import { useEffect, useCallback, useRef, useState } from 'react';
import socket from '../utils/useSocket';

export const useChatSocket = ({
    selectedUser,
    currentUser,
    getRoomId,
    setMessages,
    setIsOtherUserTyping,
    setTypingUsername,
    updateDraft
}) => {
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeout = useRef(null);

    useEffect(() => {
        if (!selectedUser || !currentUser) return;

        const roomId = getRoomId();
        if (!roomId) return;

        socket.emit('join-room', roomId);
        console.log('Sender joined room:', roomId);

        const handleReceiveMessage = (data) => {
            setMessages((prevMessages) => {
                if (data.senderId !== currentUser._id && !prevMessages.some((msg) => msg._id === data._id)) {
                    const updateMessages = [...prevMessages, data];
                    if (data.receiverId === currentUser._id && selectedUser?._id === data.senderId) {
                        socket.emit('message-seen', {
                            messageIds: [data._id],
                            roomId: data.roomId,
                        });
                    }
                    return updateMessages;
                }
                return prevMessages;
            });
        };

        const handleMessageStatus = (data) => {
            setMessages((prevMessages) => {
                return prevMessages.map((msg) => {
                    if (data.messageId && msg.tempId === data.messageId) {
                        return { ...msg, _id: data.serverId, status: data.status, tempId: undefined };
                    }
                    if (data.messageId && msg._id === data.messageId) {
                        return { ...msg, status: data.status };
                    }
                    if (data.messageIds && data.messageIds.includes(msg._id)) {
                        return { ...msg, status: data.status };
                    }
                    return msg;
                });
            });
        };

        const handleReactionUpdate = (data) => {
            setMessages((prevMessages) => {
                return prevMessages.map((msg) => {
                    if (msg._id === data.messageId) {
                        return { ...msg, reactions: data.reactions };
                    }
                    return msg;
                });
            });
        };

        const handleTyping = (data) => {
            if (data.roomId === roomId) {
                setIsOtherUserTyping(data.isTyping);
                setTypingUsername(data.isTyping ? data.username || '' : '');
            }
        };

        socket.on("receive-message", handleReceiveMessage);
        socket.on('message-sent', handleMessageStatus);
        socket.on('message-seen', handleMessageStatus);
        socket.on('message-reaction-updated', handleReactionUpdate);
        socket.on('typing', handleTyping);

        return () => {
            socket.off("receive-message", handleReceiveMessage);
            socket.off('message-sent', handleMessageStatus);
            socket.off('message-seen', handleMessageStatus);
            socket.off('message-reaction-updated', handleReactionUpdate);
            socket.off('typing', handleTyping);
            socket.emit('leave-room', roomId);
        };
    }, [selectedUser?._id, currentUser?._id, getRoomId, setMessages, setIsOtherUserTyping, setTypingUsername]);

    const handleTypingEvent = useCallback((e) => {
        const value = e.target.value;
        const roomId = getRoomId();
        if (!roomId || !currentUser) return;

        updateDraft(roomId, value);

        if (!isTyping) {
            socket.emit('typing', { roomId, isTyping: true, username: currentUser.username });
            setIsTyping(true);
        }

        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => {
            socket.emit('typing', { roomId, isTyping: false, username: currentUser.username });
            setIsTyping(false);
        }, 1000);
    }, [isTyping, getRoomId, currentUser, updateDraft]);

    return { isTyping, handleTypingEvent };
};
