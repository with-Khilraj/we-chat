import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../Api';
import socket from '../utils/useSocket';
import { v4 as uuidv4 } from 'uuid';
import { isValidObjectId } from '../utils/chatUtils';
import { useCall } from '../context/CallContext';
import { useDrafts } from '../context/DraftContext';

// Import specialized hooks
import { useAudioRecorder } from './useAudioRecorder';
import { useFileStaging } from './useFileStaging';
import { useChatSocket } from './useChatSocket';

export const useChat = (selectedUser, currentUser) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState("");
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [typingUsername, setTypingUsername] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [activeEmojiPicker, setActiveEmojiPicker] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const lastMessageIdRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const navigate = useNavigate();
  const { handleInitiateCall } = useCall();
  const { updateDraft, clearDraft, userDrafts } = useDrafts();

  // Initialize specialized hooks
  const {
    audioRecordingState,
    audioBlob,
    audioDuration,
    audioCurrentTime,
    audioError,
    startAudioRecording,
    stopAudioRecording,
    cancelAudioRecording,
    playAudioPreview,
    pauseAudioPreview,
    setAudioBlob
  } = useAudioRecorder();

  const {
    selectedFiles,
    setSelectedFiles,
    isUploading,
    setIsUploading,
    fileInputRef,
    handleFileInputChange,
    removeSelectedFile,
    handleMediaClick,
    clearSelectedFiles
  } = useFileStaging();

  const getRoomId = useCallback(() => {
    return selectedUser && currentUser
      ? [currentUser._id, selectedUser._id].sort().join('-')
      : null;
  }, [currentUser, selectedUser]);

  const { isTyping, handleTypingEvent } = useChatSocket({
    selectedUser,
    currentUser,
    getRoomId,
    setMessages,
    setIsOtherUserTyping,
    setTypingUsername,
    updateDraft
  });

  // Combine errors
  useEffect(() => {
    if (audioError) setError(audioError);
  }, [audioError]);

  // 1. Fetch initial chat history
  useEffect(() => {
    if (!selectedUser || !currentUser) return;

    const roomId = getRoomId();
    if (!roomId) return;

    const fetchChatHistory = async () => {
      try {
        const response = await api.get(`/api/messages/${roomId}?limit=20`);
        const fetchedMessages = response.data.messages || [];
        setMessages(fetchedMessages);
        setHasMore(response.data.hasMore ?? fetchedMessages.length === 20);

        // Mark as seen if viewing
        const unreadMessages = fetchedMessages.filter(
          (msg) => msg.receiverId === currentUser._id && msg.status === 'sent' && isValidObjectId(msg._id)
        );
        if (unreadMessages.length > 0) {
          socket.emit('message-seen', {
            messageIds: unreadMessages.map((msg) => msg._id),
            roomId,
          });
        }
      } catch (error) {
        setError('Failed to load chat history.');
        console.error("Error fetching chat history:", error);
      }
    };
    fetchChatHistory();
  }, [selectedUser?._id, currentUser?._id, getRoomId]);

  // 2. Sync initial draft when switching users
  useEffect(() => {
    if (!selectedUser) return;
    const draft = userDrafts[selectedUser._id];
    setNewMessage(draft || "");
  }, [selectedUser?._id, userDrafts]);

  // 3. Mark unread messages as seen when messages update (e.g. on focus/view)
  useEffect(() => {
    const roomId = getRoomId();
    if (!roomId) return;

    const unreadMessages = messages.filter(
      (msg) => msg.receiverId === currentUser._id && msg.status === "sent" && isValidObjectId(msg._id)
    );
    if (unreadMessages.length > 0) {
      socket.emit('message-seen', {
        messageIds: unreadMessages.map((msg) => msg._id),
        roomId,
      });
    }
  }, [messages, getRoomId, currentUser]);

  // 4. Reset on user change
  useEffect(() => {
    lastMessageIdRef.current = null;
  }, [selectedUser]);

  // 5. Click outside for emoji picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setActiveEmojiPicker(null);
      }
    };
    if (activeEmojiPicker) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeEmojiPicker]);

  // --- Message Actions ---

  const sendSingleMessage = async (content, fileToSend, duration = 0) => {
    if (!content && !fileToSend) return;
    const roomId = getRoomId();
    if (!roomId || !selectedUser?._id) return;

    const tempId = uuidv4();
    let messageType = 'text';
    if (fileToSend) {
      if (fileToSend.type.startsWith('audio')) messageType = 'audio';
      else if (fileToSend.type.startsWith('video')) messageType = 'video';
      else if (fileToSend.type.startsWith('image')) messageType = 'photo';
      else messageType = 'file';
    }

    const messageData = {
      tempId,
      roomId,
      senderId: currentUser._id,
      receiverId: selectedUser._id,
      content: messageType === 'text' ? content : '',
      messageType,
      ...(fileToSend && {
        fileUrl: fileToSend instanceof Blob ? URL.createObjectURL(fileToSend) : null,
        fileName: fileToSend.name || `recording_${Date.now()}.${messageType === 'audio' ? 'webm' : 'mp4'}`,
        fileSize: fileToSend.size,
        fileType: fileToSend.type,
      }),
      ...((messageType === 'audio' || messageType === 'video') && { duration }),
      status: "sent",
      replyTo: replyingTo ? replyingTo._id : null,
    };

    try {
      setMessages((prev) => [...prev, messageData]);
      const formData = new FormData();
      Object.entries(messageData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && key !== 'fileUrl') formData.append(key, value);
      });
      if (fileToSend instanceof File || fileToSend instanceof Blob) formData.append('file', fileToSend);

      const response = await api.post("/api/messages/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      socket.emit("send-message", {
        ...messageData,
        _id: response.data.message._id,
        tempId,
        fileUrl: response.data.message.fileUrl || messageData.fileUrl
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId ? { ...msg, _id: response.data.message._id, tempId: undefined, fileUrl: response.data.message.fileUrl } : msg
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
      if (error.response?.status === 401) navigate('/login');
      setMessages((prev) => prev.filter((msg) => msg.tempId !== tempId));
      setError('Failed to send message.');
    }
  };

  const handleSendMessage = async () => {
    setIsUploading(true);
    try {
      if (newMessage.trim()) {
        await sendSingleMessage(newMessage.trim(), null);
        setNewMessage("");
        const roomId = getRoomId();
        if (roomId) clearDraft(roomId);
      }

      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          await sendSingleMessage(null, file);
        }
        clearSelectedFiles();
      }
      setReplyingTo(null);
    } catch (err) {
      console.error("Error in batch send:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const sendAudioMessage = async () => {
    if (!audioBlob) return;
    await sendSingleMessage(null, audioBlob, audioDuration);
    cancelAudioRecording();
  };

  const fetchMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMore || !selectedUser || !currentUser) return;
    const roomId = getRoomId();
    if (!roomId) return;

    setIsLoadingMore(true);
    try {
      const oldestMessage = messages[0];
      const before = oldestMessage ? oldestMessage.createdAt : null;
      let url = `/api/messages/${roomId}?limit=20${before ? `&before=${before}` : ''}`;

      const response = await api.get(url);

      const newMessages = response.data.messages || [];
      if (newMessages.length > 0) setMessages((prev) => [...newMessages, ...prev]);
      setHasMore(response.data.hasMore ?? newMessages.length === 20);
    } catch (error) {
      console.error("Error fetching more messages:", error);
      setError("Failed to load older messages.");
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, selectedUser, currentUser, getRoomId, messages]);

  const handleReaction = async (messageId, emoji) => {
    try {
      const targetMessage = messages.find(m => m._id === messageId);
      const existingReaction = targetMessage?.reactions?.find(
        r => (r.userId === currentUser._id || r.userId._id === currentUser._id) && r.emoji === emoji
      );

      if (existingReaction) {
        await api.delete(`/api/messages/${messageId}/reactions`);
      } else {
        await api.post(`/api/messages/${messageId}/reactions`, { emoji });
      }
      setActiveEmojiPicker(null);
    } catch (error) {
      console.error("Failed to handle reaction", error);
    }
  };

  const removeReaction = async (messageId) => {
    try {
      await api.delete(`/api/messages/${messageId}/reactions`);
    } catch (error) {
      console.error("Failed to remove reaction", error);
    }
  };

  const handleInitiateCallLocal = () => {
    const roomId = getRoomId();
    if (roomId && selectedUser) handleInitiateCall(selectedUser._id, roomId, selectedUser);
  };

  const toggleProfileInfo = () => setShowProfileInfo(!showProfileInfo);
  const cancelReply = () => setReplyingTo(null);

  // Legacy/Compatibility
  const handleAudioRecording = async () => {
    if (audioRecordingState === 'idle') await startAudioRecording();
    else if (audioRecordingState === 'recording') stopAudioRecording();
  };

  return {
    messages,
    setMessages,
    newMessage,
    setNewMessage,
    selectedFiles,
    removeSelectedFile,
    isUploading,
    isRecording: audioRecordingState === 'recording',
    error,
    showProfileInfo,
    isTyping,
    isOtherUserTyping,
    fileInputRef,
    handleSendMessage,
    handleFileInputChange,
    handleMediaClick,
    handleAudioRecording,
    handleTypingEvent,
    handleInitiateCallLocal,
    toggleProfileInfo,
    audioRecordingState,
    audioDuration,
    audioCurrentTime,
    startAudioRecording,
    stopAudioRecording,
    cancelAudioRecording,
    playAudioPreview,
    pauseAudioPreview,
    sendAudioMessage,
    replyingTo,
    setReplyingTo,
    cancelReply,
    handleReaction,
    removeReaction,
    activeEmojiPicker,
    setActiveEmojiPicker,
    emojiPickerRef,
    typingUsername,
    hasMore,
    isLoadingMore,
    fetchMoreMessages,
  };
};
