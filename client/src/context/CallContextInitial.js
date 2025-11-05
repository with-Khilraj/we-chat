import React, { createContext, useEffect, useContext, useState, useCallback } from "react";
import socket from "../hooks/useSocket";
import api from "../Api";

const CallContext = createContext();

export const CallProvider = ({ children, currentUser }) => {
  const [error, setError] = useState("");
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callState, setCallState] = useState('idle')  // 'idle', 'ringing', 'active'
  const [recipient, setRecipient] = useState(null);
  const [callRoomId, setCallRoomId] = useState(null);
  const [caller, setCaller] = useState(null);
  const [callerLoading, setCallerLoading] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);


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
    setRecipient(null);
  }, [peerConnection, localStream]);


  // Call Management
  const initiateCall = useCallback((receiverId, roomId, recipientUser) => {
    socket.emit('initiate-call', {
      callerId: currentUser._id,
      receiverId,
      roomId,
    });
    setCallRoomId(roomId);
    setCallState('ringing');
    setRecipient(recipientUser);
  }, [currentUser]);

  const acceptCall = useCallback((roomId) => {
    try {
      socket.emit('accept-call', {
        // callerId: currentUser._id,
        callerId: incomingCall.callerId,
        // receiverId: selectedUser._id,
        receiverId: currentUser._id,
        roomId,
      });
      setCallState('active');
      startCall(roomId);
    } catch (error) {
      console.error('Error accepting call:', error);
      setCallState('idle');
      cleanupWebRTC();
    }
  }, [startCall, cleanupWebRTC, currentUser, incomingCall]);

  const rejectCall = useCallback(() => {
    socket.emit('reject-call', {
      callerId: incomingCall.callerId,
      receiverId: currentUser._id,
      roomId: callRoomId,
    });
    setCallState('idle');
    setIncomingCall(null);
    cleanupWebRTC();
  }, [cleanupWebRTC, currentUser, incomingCall, callRoomId]);

  const endCall = useCallback(() => {
    socket.emit('end-call', { roomId: callRoomId });
    setCallState('idle');
    setCallRoomId(null);
    setIncomingCall(null);
    cleanupWebRTC();
  }, [callRoomId, cleanupWebRTC]);

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
      setRecipient(null);
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
        setCallerLoading(true);
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
      } finally {
        setCallerLoading(false);
      }
    };

    fetchCallerDetails(); // Call the function
  }, [incomingCall]);


  return (
    <CallContext.Provider
      value={{
        isCalling,
        callState,
        incomingCall,
        caller,
        callerLoading,
        recipient,
        callRoomId,
        localStream,
        remoteStream,
        handleInitiateCall: initiateCall,
        handleAcceptCall: acceptCall,
        handleRejectCall: rejectCall,
        handleEndCall: endCall,
      }}
    >
      {children}
    </CallContext.Provider>
  )
};

export const useCall = () => useContext(CallContext);