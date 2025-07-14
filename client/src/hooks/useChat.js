import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../Api';
import socket from '../utils/socket';
import { v4 as uuidv4 } from 'uuid';
import { isValidObjectId, getMediaDuration } from '../utils/chatUtils';
import { useCall } from '../context/CallContext';
// import { useCall } from '../context/CallContextInitial';

export const useChat = (selectedUser, currentUser) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState(null);
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
          if(data.receiverId === currentUser._id && selectedUser?._id === data.senderId) {
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
          // Handle message-sent (single message)
          if (data.messageId && msg.tempId === data.messageId) {
            console.log(`Mapping tempId ${data.messageId} to serverId ${data.serverId} for status ${data.status}`);
            return { ...msg, _id: data.serverId, status: data.status, tempId: undefined };
          }
          // Handle message-seen (bulk update)
          if (data.messageIds && data.messageIds.includes(msg._id)) {
            console.log(`Updating status to ${data.status} for message _id ${msg._id}`);
            return { ...msg, status: data.status };
          }
          return msg;
        });
        console.log('Updated messages:', updatedMessages.map(m => ({ _id: m._id, tempId: m.tempId, status: m.status })));
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
          setFile(audioBlob);
          handleSendMessage(audioBlob);
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


  // Handle send messages button
  const handleSendMessage = async (fileToSend = file) => {
    if (!newMessage.trim() && !fileToSend) return;
    const roomId = getRoomId();
    if (!roomId || !selectedUser?._id || !isValidObjectId(selectedUser._id)) {
      setError("Invalid receiver ID. Please select a valid user.");
      return;
    }

    // Validate fileToSend
    if (fileToSend && !(fileToSend instanceof File || fileToSend instanceof Blob)) {
      console.error('Invalid fileToSend:', fileToSend);
      setError('Invalid file input. Please select a valid file.');
      return;
    }

    // const messageId = uuidv4(); // ------ old way to handle IDs
    const tempId = uuidv4(); // ------ new way to handle optimistic update

    // Determine messageType based on whether a file is being sent
    const messageType = fileToSend
      ? fileToSend.type.startsWith('audio')
        ? 'audio'
        : fileToSend.type.startsWith('video')
          ? 'video'
          : fileToSend.type.startsWith('image')
            ? 'photo'
            : 'file'
      : 'text';

    const messageData = {
      // _id: messageId, ----- old way
      tempId,  // ----- new way to handle IDs
      roomId,
      senderId: currentUser._id,
      receiverId: selectedUser._id,
      content: messageType === 'text' ? newMessage.trim() : '',
      messageType,
      ...(fileToSend && { // Only include file fields if fileToSend exists
        fileUrl: fileToSend instanceof Blob ? URL.createObjectURL(fileToSend) : null,
        fileName: fileToSend.name,
        fileSize: fileToSend.size,
        fileType: fileToSend.type,
        duration: ['audio', 'video'].includes(messageType) ? await getMediaDuration(fileToSend) : 0,
      }),
      status: "sent",
    };

    try {
      setIsUploading(true);
      setMessages((prevMessages) => [...prevMessages, messageData]); // Optimistic update
      setNewMessage("");
      setFile(null);

      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) throw new Error('No access token found')

      const formData = new FormData();
      // Append only required fields to FormData
      Object.entries(messageData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) formData.append(key, value);
      });
      if (fileToSend instanceof File) formData.append('file', fileToSend);

      // Send message to server
      const response = await api.post("/api/messages/", formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Emit messages
      socket.emit("send-message", {
        ...messageData,
        _id: response.data.message._id,
        tempId
      });

      // Update message with actual ID from server response
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.tempId === tempId ? { ...msg, _id: response.data.message._id, tempId: undefined } : msg
        )
      );
    } catch (error) {
      setError('Failed to send message. Please try again.')
      console.error("Error while sending message:", error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
      // Rollback optimistic update on failure
      setMessages((prev) => prev.filter((msg) => msg.tempId !== tempId));
    } finally {
      setIsUploading(false);
    }
  };

  // hande file input change
  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      handleSendMessage(selectedFile);
    } else {
      setFile(null);
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
    file,
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

