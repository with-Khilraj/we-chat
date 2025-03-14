import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../Api';
import socket from '../utils/socket';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { isValidObjectId, getMediaDuration } from '../utils/chatUtils';

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
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callState, setCallState] = useState('idle')  // 'idle', 'ringing', 'active'
  const [callRoomId, setCallRoomId] = useState(null);
  const [caller, setCaller] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);

  const typingTimeout = useRef(null);
  const messageEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

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

    const fetchChatHistory = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) throw new Error('No access token found');

        const response = await api.get(`/api/messages/${roomId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setMessages(response.data.messages || []);

        // Mark all unread messages as 'seen'
        const unreadMessages = response.data.messages.filter(
          (msg) => msg.receiverId === currentUser._id && msg.status === 'sent'
        );
        if (unreadMessages.length > 0) {
          await api.put('/api/messages/status/bulk', {
            messageIds: unreadMessages.map((msg) => msg._id), status: 'seen'
          },
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
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


  // Handle message status update
  useEffect(() => {
    if (!selectedUser) return;

    const handleMessageStatus = (data) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === data.messageId ? { ...msg, status: data.status } : msg
        )
      );
    };

    socket.on('message-sent', handleMessageStatus);
    socket.on('message-seen', handleMessageStatus);

    // clean up the event listner when the component unmounts
    return () => {
      socket.off('message-sent', handleMessageStatus);
      socket.off('message-seen', handleMessageStatus);
    };
  }, [selectedUser])



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

    // Validate receiverId
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

    const messageId = uuidv4();

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

    // log for debugging
    console.log('Sending Messages::::', { newMessage, fileToSend, messageType });

    const messageData = {
      _id: messageId,
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

      // formData.append("roomId", messageData.roomId);
      // formData.append("senderId", messageData.senderId);
      // formData.append("receiverId", messageData.receiverId); // Explicitly append receiverId
      // formData.append("content", messageData.content);
      // formData.append("messageType", messageData.messageType);
      // formData.append("caption", messageData.caption);
      // formData.append("status", messageData.status);

      // if (fileToSend && fileToSend instanceof File) {
      //   formData.append("file", fileToSend);
      //   formData.append("fileName", messageData.fileName);
      //   formData.append("fileSize", messageData.fileSize);
      //   formData.append("fileType", messageData.fileType);
      //   if (messageData.duration) formData.append("duration", messageData.duration);
      // }

      // Send message to server
      const response = await api.post("/api/messages/", formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Emit messages
      socket.emit("send-message", { ...messageData, _id: response.data.message._id });

      // Update message with actual ID from server response
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messageId ? { ...msg, _id: response.data.message._id } : msg
        )
      );
    } catch (error) {
      setError('Failed to send message. Please try again.')
      console.error("Error while sending message:", error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
      // Rollback optimistic update on failure
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
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
  }, [messages, getRoomId]);


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


  // IMPLEMENTATION FOR AUDIO CALL FUNCTIONALITY ..............................

  // WebRTC Setup
  const setupWebRTC = useCallback(async (roomId) => {
    const configuration = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
    const pc = new RTCPeerConnection(configuration);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    } catch (err) {
      setError('Failed to access microphone. Please check permissions.');
      console.error('WebRTC setup error:', err);
      return null;
    }

    pc.ontrack = (event) => setRemoteStream(event.streams[0]);
    pc.onicecandidate = (event) => {
      if (event.candidate) socket.emit("ice-candidate", { roomId, candidate: event.candidate });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        console.error("WebRTC connection failed");
        cleanupWebRTC();
        setCallState("idle");
        setError("Call connection failed. Please try again.");
      }
    };

    setPeerConnection(pc);
    return pc;
  }, []);

  // Start Call (Caller)
  const startCall = useCallback(async (roomId) => {
    try {
      const pc = await setupWebRTC(roomId);
      if (!pc) return;

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer to the other user
      socket.emit('offer', { roomId, offer });
    } catch (error) {
      console.error('WebRTC error:', error);
      setError('Failed to start call');
      // endCall();
    }

  }, [setupWebRTC]);

  // Handle Offer (Receiver)
  const handleOffer = useCallback(async (roomId, offer) => {
    const pc = await setupWebRTC(roomId);
    if (!pc) return;

    // Set remote description
    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    // Create answer
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    // Send answer to the other user
    socket.emit('answer', { roomId, answer });
  }, [setupWebRTC]);

  // Handle Answer (Caller)
  const handleAnswer = useCallback(async (roomId, answer) => {
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }, [peerConnection]);

  // Handle ICE Candidate
  const handleIceCandidate = useCallback(async (roomId, candidate) => {
    if (peerConnection) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }, [peerConnection]);

  // Clean up WebRTC resources
  const cleanupWebRTC = useCallback(() => {
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false; // Extra precaution
      });
      setLocalStream(null);
    }
    setRemoteStream(null);
    setCallRoomId(null); // Reset room ID too
  }, [peerConnection, localStream]);

  // Call Management
  const initiateCall = useCallback(() => {
    const roomId = getRoomId();
    if (!roomId) return;

    socket.emit('initiate-call', {
      callerId: currentUser._id,
      receiverId: selectedUser._id,
      roomId,
    });
    setCallRoomId(roomId);
    setCallState('ringing');
  }, [getRoomId, currentUser, selectedUser]);

  const acceptCall = useCallback((roomId) => {
    const expectedRoomId = getRoomId();
    if (roomId !== expectedRoomId) {
      console.error('Room ID mismatch:', { roomId, expectedRoomId });
      cleanupWebRTC();
      return;
    }
    try {
      socket.emit('accept-call', {
        callerId: currentUser._id,
        receiverId: selectedUser._id,
        roomId,
      });
      setCallState('active');
      startCall(roomId);
    } catch (error) {
      console.error('Error accepting call:', error);
      setCallState('idle');
      cleanupWebRTC();
    }
  }, [startCall, getRoomId, cleanupWebRTC, currentUser, selectedUser]);

  const rejectCall = useCallback(() => {
    const roomId = getRoomId();
    if (!roomId) return;

    socket.emit('reject-call', {
      callerId: currentUser._id,
      receiverId: selectedUser._id,
      roomId,
    });
    setCallState('idle');
    setIncomingCall(null);
    cleanupWebRTC();
  }, [getRoomId, cleanupWebRTC, currentUser, selectedUser]);

  const endCall = useCallback(() => {
    const roomId = getRoomId();
    if (!roomId) return;

    socket.emit('end-call', { roomId });
    setCallState('idle');
    setCallRoomId(null);
    setIncomingCall(null);
    cleanupWebRTC();
  }, [getRoomId, cleanupWebRTC]);

  // Call Event Listeners
  useEffect(() => {
    // Listen for incoming call
    const handleIncomingCall = (data) => {
      setIncomingCall(data);
      setCaller({ _id: data.callerId });
      setCallState('ringing');
      setCallRoomId(data.roomId);
    };

    // Listen for call acceptance
    const handleCallAccepted = (data) => {
      setIsCalling(true);
      setCallState('active');
      setCallRoomId(data.roomId);
      startCall(data.roomId)
    }

    // Listen for call rejection
    const handleCallRejected = () => {
      setIsCalling(false);
      setCallState('idle');
      setIncomingCall(null);
      cleanupWebRTC();
    };

    // Listen for call end
    const handleCallEnded = () => {
      setIsCalling(false);
      setCallState('idle');
      setIncomingCall(null);
      setCallRoomId(null);
      cleanupWebRTC();
    };

    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-accepted', handleCallAccepted);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-ended', handleCallEnded);

    return () => {
      socket.off('incoming-call');
      socket.off('call-accepted');
      socket.off('call-rejected');
      socket.off('call-ended');
    };
  }, [cleanupWebRTC, startCall]);

  useEffect(() => {
    socket.on('call-busy', () => {
      setCallState('idle');
      setError('User is already in a call')
    });
    return () => socket.off('call-busy');
  }, []);

  // time out
  useEffect(() => {
    let timeout;
    if (callState === 'ringing' && !incomingCall) {
      timeout = setTimeout(() => {
        endCall();
        setError('Call timed out')
      }, 30000);
    }
    return () => clearTimeout(timeout);
  }, [callState, incomingCall, endCall]);

  // handle call intitation
  // const handleInitiateCall = () => {
  //   const roomId = [currentUser._id, selectedUser._id].sort().join("-");
  //   setCallRoomId(roomId);
  //   setCallState('ringing');
  //   initiateCall();
  // };

  // // Handle call acceptance
  // const handleAcceptCall = (roomId) => {
  //   setCallState('active');
  //   acceptCall(roomId);
  //   startCall(roomId);
  // };

  // // Handle call rejection
  // const handleRejectCall = () => {
  //   setCallState('idle');
  //   rejectCall();
  //   cleanupWebRTC();
  // };

  // // Handle call end
  // const handleEndCall = () => {
  //   setCallState('idle');
  //   endCall(callRoomId);
  //   cleanupWebRTC();
  // }


  useEffect(() => {
    // Listen for WebRTC events
    socket.on('offer', (data) => {
      handleOffer(data.roomId, data.offer);
    });

    socket.on('answer', (data) => {
      handleAnswer(data.roomId, data.answer);
    });

    socket.on('ice-candidate', (data) => {
      handleIceCandidate(data.roomId, data.candidate);
    });

    return () => {
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      cleanupWebRTC();
    };
  }, [handleAnswer, handleOffer, handleIceCandidate, cleanupWebRTC]);

  // fetch caller details 
  useEffect(() => {
    if (!incomingCall?.callerId) return;


    const fetchCallerDetails = async () => {
      try {
        const accessToken = await localStorage.getItem('accessToken');
        if (!accessToken) {
          console.error("Access token is missing");
          return;
        }

        console.log("Fetching caller details for callerId:", incomingCall.callerId);
        const response = await api.get(`/api/users/${incomingCall.callerId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.data) {
          console.error("No user data returned for callerId:", incomingCall.callerId);
          return;
        }

        console.log("Fetched caller details:", response.data);
        setCaller(response.data);
      } catch (error) {
        setError('Failed to fetch caller details.')
        console.error("Error fetching caller details:", error);
      }
    };

    fetchCallerDetails(); // Call the function
  }, [incomingCall]);


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
    isCalling,
    incomingCall,
    caller,
    callState,
    callRoomId,
    messageEndRef,
    fileInputRef,
    handleSendMessage,
    handleFileInputChange,
    handleMediaClick,
    handleAudioRecording,
    handleTypingEvent,
    handleInitiateCall: initiateCall,
    handleAcceptCall: acceptCall,
    handleRejectCall: rejectCall,
    handleEndCall: endCall,
    localStream,
    remoteStream,
    toggleProfileInfo,
  }
}

