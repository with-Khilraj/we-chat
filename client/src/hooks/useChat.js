import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../Api';
import socket from './useSocket';
import { v4 as uuidv4 } from 'uuid';
import { isValidObjectId, getMediaDuration } from '../utils/chatUtils';
import { useCall } from '../context/CallContext';
// import { useCall } from '../context/CallContextInitial';

export const useChat = (selectedUser, currentUser) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [error, setError] = useState("");
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

  const typingTimeout = useRef(null);
  const messageEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { handleInitiateCall } = useCall();

  const isValidUUID = (id) => {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[4][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id);
  };

  // Centralized roomId generator
  const getRoomId = useCallback(() => {
    return selectedUser && currentUser
      ? [currentUser._id, selectedUser._id].sort().join('-')
      : null;
  }, [currentUser, selectedUser]);

  // Fetch chat history and join room
  useEffect(() => {
    if (!selectedUser || !currentUser) return;

    const roomId = getRoomId();
    if (!roomId) return;

    socket.emit('join-room', roomId);
    console.log('Sender joined room:', roomId);

    const fetchChatHistory = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) throw new Error('No access token found');

        const response = await api.get(`/api/messages/${roomId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        console.log("Fetched chat history:", response.data);
        setMessages(response.data.messages || []);


        // Mark all unread messages as 'seen'
        const unreadMessages = response.data.messages.filter(
          (msg) => msg.receiverId === currentUser._id && msg.status === 'sent' && isValidUUID(msg._id)
        );
        if (unreadMessages.length > 0) {
          socket.emit('message-seen', {
            messageIds: unreadMessages.map((msg) => msg._id),
            roomId,
          });
          // await api.put('/api/messages/status/bulk', {
          //   messageIds: unreadMessages.map((msg) => msg._id), status: 'seen'
          // },
          //   {
          //     headers: {
          //       Authorization: `Bearer ${accessToken}`,
          //     },
          //   }
          // );
        }
      } catch (error) {
        setError('Failed to load the chat history. Please try again.');
        console.error("Error fetching chat history:", error);
      }
    };
    fetchChatHistory();


    const handleReceiveMessage = (data) => {
      setMessages((prevMessages) => {
        if (data.senderId !== currentUser._id && !prevMessages.some((msg) => msg._id === data._id)) {
          const updateMessages = [...prevMessages, data];
          // If receiver is actively viewing the chat, mark the message as 'seen'
          if (data.receiverId === currentUser._id && selectedUser?._id === data.senderId) {
            socket.emit('message-seen', {
              messageIds: [data._id],
              roomId: data.roomId,
            })
          }
          return updateMessages;
        }
        return prevMessages;
      });
    };

    // listen for 'receive-message' event
    socket.on("receive-message", handleReceiveMessage);

    // clean up function
    return () => {
      socket.off("receive-message", handleReceiveMessage);
      socket.emit('leave-room', roomId);
    };
  }, [selectedUser, currentUser, getRoomId]);


  useEffect(() => {
    console.log("Messages state after fetch:", messages);
  }, [messages]);

  socket.onAny((event, ...args) => {
    console.log(`Socket event received: ${event}`, args);
  });


  // Handle message status update
  useEffect(() => {
    if (!selectedUser) return;

    const handleMessageStatus = (data) => {
      console.log('Received message status update:', data);
      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.map((msg) => {
          // Handle map tempId to serverId (initial send confirmation)
          if (data.messageId && msg.tempId === data.messageId) {
            console.log(`Mapping tempId ${data.messageId} to serverId ${data.serverId} for status ${data.status}`);
            return { ...msg, _id: data.serverId, status: data.status, tempId: undefined };
          }
          // Handle status update by real ID (delivered, seen, etc.)
          if (data.messageId && msg._id === data.messageId) {
            return { ...msg, status: data.status };
          }
          // Handle message-seen (bulk update)
          if (data.messageIds && data.messageIds.includes(msg._id)) {
            console.log(`Updating status to ${data.status} for message _id ${msg._id}`);
            return { ...msg, status: data.status };
          }
          return msg;
        });
        return updatedMessages;
      });
    }

    //   const handleMessageStatus = (data) => {
    //     console.log('Received message status update:', data);
    //     setMessages((prevMessages) => {
    //       const updateMessages = prevMessages.map((msg) =>
    //         data.messageIds?.includes(msg._id)
    //           ? { ...msg, status: data.status }
    //           : data.messageId === msg._id
    //             ? { ...msg, status: data.status }
    //             : msg
    //       );
    //       console.log('Updated Messages:', updateMessages.map(m => ({ id: m._id, status: m.status })));
    //       return updateMessages;
    //     });

    //   // if (data.messageIds) {
    //   //   // Handle bulk message status update
    //   //   setMessages((prevMessages) =>
    //   //     prevMessages.map((msg) =>
    //   //       data.messageIds.includes(msg._id) ? { ...msg, status: data.status } : msg
    //   //     )
    //   //   );
    //   // } else if (data.messageId) {
    //   //   // Handle single message status update
    //   //   setMessages((prevMessages) =>
    //   //     prevMessages.map((msg) =>
    //   //       msg._id === data.messageId ? { ...msg, status: data.status } : msg
    //   //     )
    //   //   );
    //   // }
    // };

    socket.on('message-sent', handleMessageStatus);
    socket.on('message-seen', handleMessageStatus);

    // clean up the event listner when the component unmounts
    return () => {
      socket.off('message-sent', handleMessageStatus);
      socket.off('message-seen', handleMessageStatus);
    };
  }, [selectedUser])


  // function to handle the typing event
  const handleTypingEvent = useCallback((e) => {
    setNewMessage(e.target.value);
    const roomId = getRoomId();
    if (!roomId) return;

    if (!isTyping) {
      socket.emit('typing', { roomId, isTyping: true });
      setIsTyping(true);
    }

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing', { roomId, isTyping: false });
      setIsTyping(false);
    }, 1000);
  }, [isTyping, getRoomId]);

  // Trigger file input when an icon is clicked
  const handleMediaClick = (type) => {
    fileInputRef.current?.click();
  }

  // Handle audio recording
  const handleAudioRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);
        setAudioChunks([]);

        recorder.ondataavailable = (e) => {
          setAudioChunks((prev) => [...prev, e.data]);
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          // Send audio immediately without staging
          sendSingleMessage(null, audioBlob);
          setAudioChunks([]);
          stream.getTracks().forEach((track) => track.stop()); // Clean up stream
        };

        recorder.start();
        setIsRecording(true);
      } catch (err) {
        setError('Failed to start recording. Please check microphone permissions.');
        console.error('Error starting audio recording:', err);
      }
    } else if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };


  // Internal function to send a single message (text or file)
  const sendSingleMessage = async (content, fileToSend) => {
    if (!content && !fileToSend) return;
    const roomId = getRoomId();
    if (!roomId || !selectedUser?._id || !isValidObjectId(selectedUser._id)) {
      setError("Invalid receiver ID. Please select a valid user.");
      return;
    }

    const tempId = uuidv4();

    // Determine messageType
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
        fileName: fileToSend.name,
        fileSize: fileToSend.size,
        fileType: fileToSend.type,
      }),
      status: "sent",
    };

    // Calculate duration for audio/video asynchronously if needed, but don't block optimistic UI
    // For now we set 0, or could improve this by calculating before calling sendSingleMessage

    try {
      // Optimistic update
      setMessages((prevMessages) => [...prevMessages, messageData]);

      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) throw new Error('No access token found');

      const formData = new FormData();
      Object.entries(messageData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && key !== 'fileUrl') formData.append(key, value);
      });
      if (fileToSend instanceof File || fileToSend instanceof Blob) formData.append('file', fileToSend);

      // Send message to server
      const response = await api.post("/api/messages/", formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Emit socket event
      socket.emit("send-message", {
        ...messageData,
        _id: response.data.message._id,
        tempId,
        // If server returns fileUrl, use it (optional, usually server returns full message object)
        fileUrl: response.data.message.fileUrl || messageData.fileUrl
      });

      // Update message with actual ID
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.tempId === tempId ? { ...msg, _id: response.data.message._id, tempId: undefined, fileUrl: response.data.message.fileUrl } : msg
        )
      );

    } catch (error) {
      console.error("Error sending message:", error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
      setMessages((prev) => prev.filter((msg) => msg.tempId !== tempId));
      setError('Failed to send message.');
    }
  };


  // Handle send messages button (Text + All Staged Files)
  const handleSendMessage = async () => {
    setIsUploading(true);
    try {
      // 1. Send text if present
      if (newMessage.trim()) {
        await sendSingleMessage(newMessage.trim(), null);
        setNewMessage("");
      }

      // 2. Send all staged files
      if (selectedFiles.length > 0) {
        // Processing sequentially to maintain order roughly, or parallel?
        // Parallel is better for speed, but sequential ensures order in chat roughly.
        // Let's do sequential for now to avoid overwhelming socket/server 
        for (const file of selectedFiles) {
          await sendSingleMessage(null, file);
        }
        setSelectedFiles([]);
      }
    } catch (err) {
      console.error("Error in batch send:", err);
    } finally {
      setIsUploading(false);
    }
  };

  // Remove a file from staging
  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // hande file input change
  // hande file input change
  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      // Reset input value so the same file selection triggers change again if needed
      e.target.value = '';
    }
  };

  // when user views the chat, emit 'message-seen' for all the unread messages
  useEffect(() => {
    const roomId = getRoomId();
    if (!roomId) return;

    // emit 'message-seen' for all the unread messages
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


  // Add the useEffect to listen for typing events
  useEffect(() => {
    const roomId = getRoomId();
    if (!roomId) return;

    const handleTyping = (data) => {
      if (data.roomId === roomId) {
        setIsOtherUserTyping(data.isTyping);
      }
    };

    socket.on('typing', handleTyping);

    return () => {
      socket.off('typing', handleTyping);
    }
  }, [selectedUser, currentUser, getRoomId]);

  useEffect(() => {
    return () => clearTimeout(typingTimeout.current);
  }, []);


  const handleInitiateCallLocal = () => {
    const roomId = getRoomId();
    if (roomId && selectedUser) handleInitiateCall(selectedUser._id, roomId, selectedUser);
  }

  // to go the end/last messages of users
  useEffect(() => {
    if (messages.length) {
      messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, currentUser, selectedUser]);

  // handle profile info change
  const toggleProfileInfo = () => {
    setShowProfileInfo(!showProfileInfo);
  }

  return {
    messages,
    setMessages,
    newMessage,
    setNewMessage,
    newMessage,
    setNewMessage,
    selectedFiles,
    removeSelectedFile,
    isUploading,
    isRecording,
    error,
    showProfileInfo,
    isTyping,
    isOtherUserTyping,
    // isCalling,
    // incomingCall,
    // caller,
    // callState,
    // callRoomId,
    messageEndRef,
    fileInputRef,
    handleSendMessage,
    handleFileInputChange,
    handleMediaClick,
    handleAudioRecording,
    handleTypingEvent,
    handleInitiateCallLocal,
    // handleInitiateCall: initiateCall,
    // handleAcceptCall: acceptCall,
    // handleRejectCall: rejectCall,
    // handleEndCall: endCall,
    // localStream,
    // remoteStream,
    toggleProfileInfo,
  }
}

