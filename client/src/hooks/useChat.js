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
  const [audioChunk, setAudioChunk] = useState([]);
  const [error, setError] = useState("");
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isOtherUsertyping, setIsOtherUserTyping] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [callRoomId, setCallRoomId] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);

  const typingTimeout = useRef(null);
  const messageEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();


  useEffect(() => {
    if (selectedUser) {
      const roomId = [currentUser._id, selectedUser._id].sort().join("-");
      socket.emit("join-room", roomId);

      const fetchChatHistory = async () => {
        try {
          const accessToken = localStorage.getItem("accessToken");
          const response = await api.get(`/api/messages/${roomId}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          setMessages(response.data.messages);

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
          console.error("Error fetching chat history:", error);
        }
      };
      fetchChatHistory();

      const handleReceiveMessage = (data) => {
        setMessages((prevMessages) => {
          if (data.senderId !== currentUser._id && !prevMessages.some((msg) => msg._id === data._id)) {
            const updateMessages = [...prevMessages, data];
            console.log("Updated messages:::", updateMessages);
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

    }
  }, [selectedUser, currentUser]);


  // Handle message status update
  useEffect(() => {
    if (selectedUser) {
      const handleMessageStautus = (data) => {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === data.messageId ? { ...msg, status: data.status } : msg
          )
        );
      };

      socket.on('message-sent', handleMessageStautus);
      socket.on('message-seen', handleMessageStautus);

      // clean up the event listner when the component unmounts
      return () => {
        socket.off('message-sent', handleMessageStautus);
        socket.off('message-seen', handleMessageStautus);
      };
    }
  }, [selectedUser])


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

  // Trigger file input when an icon is clicked
  const handleMediaClick = (type) => {
    fileInputRef.current.click();
  }

  // handle audio recording
  const handleAudioRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);

        recorder.ondataavailable = (e) => {
          setAudioChunk((prev) => [...prev, e.data]);
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunk, { type: "audio/wav" });
          setFile(audioBlob);

          handleSendMessage(audioBlob);
          setAudioChunk([]);
        };

        recorder.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Error starting audio recording:", e);
      }
    } else {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  }

  // Handle send messages button
 const handleSendMessage = async (fileToSend = file) => {
  if (!newMessage.trim() && !fileToSend) {
    return;
  }

  // Validate receiverId
  if (!selectedUser?._id || !isValidObjectId(selectedUser._id)) {
    setError("Invalid receiver ID. Please select a valid user.");
    return;
  }

  // const messageId = uuidv4();
  const messageId = new mongoose.Types.ObjectId();

  // Determine messageType based on whether a file is being sent
  let messageType = "text"; // Default to text message
  if (fileToSend && fileToSend instanceof File) {
    if (fileToSend.type.startsWith("audio")) {
      messageType = "audio";
    } else if (fileToSend.type.startsWith("video")) {
      messageType = "video";
    } else if (fileToSend.type.startsWith("image")) {
      messageType = "photo";
    } else {
      messageType = "file";
    }
  }

  const messageData = {
    _id: messageId,
    roomId: [currentUser._id, selectedUser._id].sort().join("-"),
    senderId: currentUser._id,
    receiverId: selectedUser._id,
    content: newMessage.trim(),
    messageType,
    fileUrl: fileToSend && fileToSend instanceof Blob ? URL.createObjectURL(fileToSend) : null, // Temporary URL for preview
    fileName: fileToSend ? fileToSend.name : "",
    fileSize: fileToSend ? fileToSend.size : 0,
    fileType: fileToSend ? fileToSend.type : "",
    duration: messageType === "audio" || messageType === "video"
      ? await getMediaDuration(fileToSend)
      : 0, // Calculate duration for audio/video files
    status: "sent",
  };

  try {
    setIsUploading(true);
    setMessages((prevMessages) => [...prevMessages, messageData]); // Optimistic update
    setNewMessage("");
    setFile(null);

    const accessToken = localStorage.getItem("accessToken");
    const formData = new FormData();

    // Append only required fields to FormData
    formData.append("roomId", messageData.roomId);
    formData.append("senderId", messageData.senderId);
    formData.append("receiverId", messageData.receiverId); // Explicitly append receiverId
    formData.append("content", messageData.content);
    formData.append("messageType", messageData.messageType);
    formData.append("caption", messageData.caption);
    formData.append("status", messageData.status);

    if (fileToSend && fileToSend instanceof File) {
      formData.append("file", fileToSend);
      formData.append("fileName", messageData.fileName);
      formData.append("fileSize", messageData.fileSize);
      formData.append("fileType", messageData.fileType);
      if (messageData.duration) formData.append("duration", messageData.duration);
    }

    // Send message to server
    const response = await api.post("/api/messages/", formData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "multipart/form-data",
      },
    });

    // Emit messages
    socket.emit("send-message", messageData);

    // Update message with actual ID from server response
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        // msg._id === Date.now() ? { ...msg, _id: response.data._id } : msg
        msg._id === messageId ? { ...msg, _id: response.data._id } : msg
      )
    );
  } catch (error) {
    console.error("Error while sending message:", error);
    if (error.response?.status === 401) {
      navigate('/login');
    }
  } finally {
    setIsUploading(false);
  }
};


  // when user views the chat, emit 'message-seen' for all the unread messages
  useEffect(() => {
    if (selectedUser) {
      // emit 'message-seen' for all the unread messages
      const unreadMessages = messages.filter(
        (msg) => msg.receiverId === currentUser._id && msg.status === "sent"  && isValidObjectId(msg._id)
      );
      if (unreadMessages.length > 0) {
        socket.emit('message-seen', {
          messageIds: unreadMessages.map((msg) => msg._id),
          roomId: [currentUser._id, selectedUser._id].sort().join("-"),
        })
      }
    }
  }, [selectedUser, currentUser, messages]);


  // Add the useEffect to listen for typing events
  useEffect(() => {
    if (selectedUser) {
      const roomId = [currentUser._id, selectedUser._id].sort().join("-");

      const handleTyping = (data) => {
        if (data.roomId === roomId) {
          setIsOtherUserTyping(data.isTyping);
        }
      };

      socket.on('typing', handleTyping);

      return () => {
        socket.off('typing', handleTyping);
      }
    }
  }, [selectedUser, currentUser]);


  // function to handle the typing event
  const handleTypingEvent = (e) => {
    setNewMessage(e.target.value);

    // emit typing event
    if (!isTyping) {
      console.log("Emmitting typing event: isTyping = true");
      socket.emit('typing', {
        roomId: [currentUser._id, selectedUser._id].sort().join("-"),
        isTyping: true
      });
      setIsTyping(true);
    }

    // clear previous Timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    // Set timeout to stop typing indicator
    typingTimeout.current = setTimeout(() => {
      console.log('Emitting typing event: isTyping = false')
      socket.emit('typing', {
        roomId: [currentUser._id, selectedUser._id].sort().join("-"),
        isTyping: false,
      });
      setIsTyping(false);
    }, 1000)
  };


  // Listen for incoming call
  useEffect(() => {
    socket.on('incoming-call', (data) => {
      setIncomingCall(data);
      console.log('Incomming call from:', data.callerId);
    });

    socket.on('call-accepted', (data) => {
      setIsCalling(true);
      setCallRoomId(data.roomId);
      console.log("Call accepted by:", data.receiverId);
    });

    socket.on('call-rejected', () => {
      setIsCalling(false);
      setIncomingCall(null);
      console.log("Call rejected");
    });

    socket.on('call-ended', () => {
      setIsCalling(false);
      setIncomingCall(null);
      setCallRoomId(null);
      console.log("call ended");
    });

    return () => {
      socket.off('incoming-call');
      socket.off('call-accepted');
      socket.off('call-rejected');
      socket.off('call-ended');
    }
  }, []);

  // functions to handle call initiation, acceptance, rejection and ending
  const initiateCall = () => {
    const roomId = [currentUser._id, selectedUser._id].sort().join("-");
    socket.emit('initiate-call', {
      callerId: currentUser._id,
      receiverId: selectedUser._id,
      roomId
    });
    console.log("Call initiated");
  };

  const acceptCall = (roomId) => {
    socket.emit("accept-call", {
      callerId: currentUser._id,
      receiverId: selectedUser._id,
      roomId,
    });
    console.log("Call accepted");
  };

  const rejectCall = () => {
    socket.emit('reject-call', {
      callerId: currentUser._id,
      receiverId: selectedUser._id
    });
    console.log("Call rejected");
  };

  const endCall = (roomId) => {
    socket.emit('end-call', {
      roomId,
    });
    console.log("Call ended");
  };

  // Setup WebRTC to establish a peer to peer connection
  const setupWebRTC = async (roomId) => {
    const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    const pc = new RTCPeerConnection(configuration);

    // add local stream
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setLocalStream(stream);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    // Handle remote stream
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    // handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { roomId, candidate: event.candidate });
      }
    };

    setPeerConnection(pc);
  };


  const startCall = async (roomId) => {
    const pc = await setupWebRTC(roomId);

    // create offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // send offer to the other user
    socket.emit('offer', { roomId, offer });
  };

  const handleOffer = useCallback(async (roomId, offer) => {
    const pc = await setupWebRTC(roomId);

    // set remote description
    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    // create answer
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    // send answer to the other user
    socket.emit('answer', { roomId, answer });
  }, []);

  const handleAnswer = useCallback(async (roomId, answer) => {
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }, [peerConnection]);

  const handleIceCandidate = useCallback(async (roomId, candidate) => {
    if (peerConnection) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }, [peerConnection]);

  // clean-up WebRTC resources
  const cleanupWebRTC = useCallback(() => {
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
  }, [localStream, peerConnection]);

  // listen for webRTC events
  useEffect(() => {
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
    }
  }, [handleAnswer, handleOffer, handleIceCandidate, cleanupWebRTC])


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
    isOtherUsertyping,
    isCalling,
    incomingCall,
    messageEndRef,
    fileInputRef,
    handleSendMessage,
    handleFileInputChange,
    handleMediaClick,
    handleAudioRecording,
    handleTypingEvent,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    localStream,
    remoteStream,
    toggleProfileInfo,
  }
}

