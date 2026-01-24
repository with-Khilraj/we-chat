import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../Api';
import socket from '../utils/useSocket';
import { v4 as uuidv4 } from 'uuid';
import { isValidObjectId, getMediaDuration } from '../utils/chatUtils';
import { useCall } from '../context/CallContext';
import { useDrafts } from '../context/DraftContext';

export const useChat = (selectedUser, currentUser) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const lastMessageIdRef = useRef(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [error, setError] = useState("");
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // State for the message being replied to
  const [activeEmojiPicker, setActiveEmojiPicker] = useState(null); // Track which message's picker is open
  const [typingUsername, setTypingUsername] = useState(''); // Store username of typing user
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // audio recording states
  const [audioRecordingState, setAudioRecordingState] = useState('idle'); // 'idle' | 'recording' | 'stopped' | 'playing'
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioStream, setAudioStream] = useState(null);
  const [audioMimeType, setAudioMimeType] = useState(''); // Store actual MIME type
  const audioPreviewRef = useRef(null); // Audio element for playback
  const recordingTimerRef = useRef(null); // Timer interval
  const emojiPickerRef = useRef(null); // Ref for emoji picker

  const typingTimeout = useRef(null);
  const messageEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { handleInitiateCall } = useCall();
  const { updateDraft, clearDraft, userDrafts } = useDrafts();

  // Cleanup audio resources when component unmounts or user changes
  useEffect(() => {
    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
    };
  }, [selectedUser, audioStream]);

  const isValidUUID = (id) => {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[4][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id);
  };

  // Centralized roomId generator
  const getRoomId = useCallback(() => {
    return selectedUser && currentUser
      ? [currentUser._id, selectedUser._id].sort().join('-')
      : null;
  }, [currentUser, selectedUser]);

  // 1. Fetch chat history and join room (Stable dependencies)
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

        const response = await api.get(`/api/messages/${roomId}?limit=20`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        console.log("Fetched chat history:", response.data);
        const fetchedMessages = response.data.messages || [];
        setMessages(fetchedMessages);
        setHasMore(response.data.hasMore ?? fetchedMessages.length === 20);

        const unreadMessages = fetchedMessages.filter(
          (msg) => msg.receiverId === currentUser._id && msg.status === 'sent' && isValidUUID(msg._id)
        );
        if (unreadMessages.length > 0) {
          socket.emit('message-seen', {
            messageIds: unreadMessages.map((msg) => msg._id),
            roomId,
          });
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
  }, [selectedUser?._id, currentUser?._id, getRoomId]); // Removed userDrafts

  // 2. Sync initial draft when switching users
  useEffect(() => {
    if (!selectedUser) return;

    const draft = userDrafts[selectedUser._id];
    setNewMessage(draft || "");
  }, [selectedUser?._id, userDrafts]);



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

    socket.on('message-sent', handleMessageStatus);
    socket.on('message-seen', handleMessageStatus);

    // clean up the event listner when the component unmounts
    return () => {
      socket.off('message-sent', handleMessageStatus);
      socket.off('message-seen', handleMessageStatus);
    };
  }, [selectedUser])

  // Handle message reaction updates
  useEffect(() => {
    if (!selectedUser) return;

    const handleReactionUpdate = (data) => {
      console.log('Received reaction update:', data);
      setMessages((prevMessages) => {
        return prevMessages.map((msg) => {
          if (msg._id === data.messageId) {
            return { ...msg, reactions: data.reactions };
          }
          return msg;
        });
      });
    };

    socket.on('message-reaction-updated', handleReactionUpdate);

    return () => {
      socket.off('message-reaction-updated', handleReactionUpdate);
    };
  }, [selectedUser]);

  // Click outside handler for emoji picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setActiveEmojiPicker(null);
      }
    };

    if (activeEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeEmojiPicker]);


  // function to handle the typing event
  const handleTypingEvent = useCallback((e) => {
    const value = e.target.value;
    setNewMessage(value);
    const roomId = getRoomId();
    if (!roomId || !currentUser) return;

    // Save draft via centralized context
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

  // Trigger file input when an icon is clicked
  const handleMediaClick = (type) => {
    fileInputRef.current?.click();
  }


  // === Audio Recording Functions ===

  // Start audio recording
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Detect supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : MediaRecorder.isTypeSupported('audio/ogg')
            ? 'audio/ogg'
            : ''; // Fallback to default

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});

      setAudioStream(stream);
      setMediaRecorder(recorder);
      setAudioChunks([]);
      setAudioDuration(0);
      setAudioMimeType(mimeType || recorder.mimeType); // Store the actual MIME type
      setAudioRecordingState('recording');

      // Start timer
      const startTime = Date.now();
      recordingTimerRef.current = setInterval(() => {
        setAudioDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 100);

      recorder.ondataavailable = (e) => {
        setAudioChunks((prev) => [...prev, e.data]);
      };

      recorder.onstop = () => {
        setAudioChunks((latestChunks) => {
          const blob = new Blob(latestChunks, { type: mimeType || recorder.mimeType });
          setAudioBlob(blob);
          return latestChunks;
        });

        // Stop timer
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }

        // Stop stream
        if (audioStream) {
          audioStream.getTracks().forEach(track => track.stop());
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Failed to start recording. Please check microphone permissions.');
      console.error('Error starting audio recording:', err);
    }
  };

  // Stop audio recording
  const stopAudioRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      setAudioRecordingState('stopped');
    }
  };

  // Cancel audio recording
  const cancelAudioRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }

    // Clean up
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    // Reset state
    setIsRecording(false);
    setAudioRecordingState('idle');
    setAudioBlob(null);
    setAudioDuration(0);
    setAudioCurrentTime(0);
    setAudioChunks([]);
    setMediaRecorder(null);
    setAudioStream(null);
  };

  // Play audio preview
  const playAudioPreview = () => {
    if (!audioBlob) return;

    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audioPreviewRef.current = audio;

    audio.ontimeupdate = () => {
      setAudioCurrentTime(Math.floor(audio.currentTime));
    };

    audio.onended = () => {
      setAudioRecordingState('stopped');
      setAudioCurrentTime(0);
    };

    audio.play();
    setAudioRecordingState('playing');
  };

  // Pause audio preview
  const pauseAudioPreview = () => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      setAudioRecordingState('stopped');
    }
  };

  // Send audio message
  const sendAudioMessage = async () => {
    if (!audioBlob) return;

    await sendSingleMessage(null, audioBlob, audioDuration);

    // Reset audio state after sending
    cancelAudioRecording();
  };

  // Legacy function for backward compatibility
  const handleAudioRecording = async () => {
    if (audioRecordingState === 'idle') {
      await startAudioRecording();
    } else if (audioRecordingState === 'recording') {
      stopAudioRecording();
    }
  };

  // Function to fetch more (older) messages
  const fetchMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMore || !selectedUser || !currentUser) return;

    const roomId = getRoomId();
    if (!roomId) return;

    setIsLoadingMore(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const oldestMessage = messages[0];
      const before = oldestMessage ? oldestMessage.createdAt : null;

      let url = `/api/messages/${roomId}?limit=20`;
      if (before) {
        url += `&before=${before}`;
      }

      const response = await api.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const newMessages = response.data.messages || [];
      if (newMessages.length > 0) {
        setMessages((prev) => [...newMessages, ...prev]);
      }
      setHasMore(response.data.hasMore ?? newMessages.length === 20);
    } catch (error) {
      console.error("Error fetching more messages:", error);
      setError("Failed to load older messages.");
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, selectedUser, currentUser, getRoomId, messages]);


  // Internal function to send a single message (text or file)
  const sendSingleMessage = async (content, fileToSend, duration = 0) => {
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
        fileName: fileToSend.name || `recording_${Date.now()}.${messageType === 'audio' ? 'webm' : 'mp4'}`,
        fileSize: fileToSend.size,
        fileType: fileToSend.type,
      }),
      ...((messageType === 'audio' || messageType === 'video') && { duration }),
      status: "sent",
      replyTo: replyingTo ? replyingTo._id : null,
    };

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
      if (newMessage.trim()) {
        await sendSingleMessage(newMessage.trim(), null);
        setNewMessage("");

        const roomId = getRoomId();
        if (roomId) {
          clearDraft(roomId);
        }
      }

      // 2. Send all staged files
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          await sendSingleMessage(null, file);
        }
        setSelectedFiles([]);
      }
      setReplyingTo(null);
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
        setTypingUsername(data.isTyping ? data.username || '' : '');
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

  // Reset lastMessageIdRef when switching users
  useEffect(() => {
    lastMessageIdRef.current = null;
  }, [selectedUser]);

  // handle profile info change
  const toggleProfileInfo = () => {
    setShowProfileInfo(!showProfileInfo);
  }

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      const accessToken = localStorage.getItem("accessToken");

      // Check if user already has this exact reaction
      const targetMessage = messages.find(m => m._id === messageId);
      const existingReaction = targetMessage?.reactions?.find(
        r => (r.userId === currentUser._id || r.userId._id === currentUser._id) && r.emoji === emoji
      );

      if (existingReaction) {
        await api.delete(`/api/messages/${messageId}/reactions`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      } else {
        await api.post(`/api/messages/${messageId}/reactions`, { emoji }, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      }

      setActiveEmojiPicker(null);
    } catch (error) {
      console.error("Failed to handle reaction", error);
    }
  };

  const removeReaction = async (messageId) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      await api.delete(`/api/messages/${messageId}/reactions`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    } catch (error) {
      console.error("Failed to remove reaction", error);
    }
  }

  return {
    messages,
    setMessages,
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
  }
}
