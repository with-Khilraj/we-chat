import { createContext, useContext, useRef, useState, useEffect, useCallback } from "react";
import { socket } from "../utils/useSocket";


const CallContexts = createContext(null);

export const useCall = () => {
  const ctx = useContext(CallContexts);
  if (!ctx) throw new Error("useCall must be used inside CallProvider");
  return ctx;
};

// Call states
export const CALL_STATE = {
  IDLE: "idle",
  OUTGOING: "outgoing",   // we initiated, waiting for answer
  INCOMING: "incoming",   // someone is calling us
  ACTIVE: "active",     // call in progress
};

export function CallProvider({ children, currentUser }) {

  // ── State ──
  const [callState, setCallState] = useState(CALL_STATE.IDLE);
  const [callType, setCallType] = useState(null);       // 'audio' | 'video'
  const [remoteUser, setRemoteUser] = useState(null);       // { _id, username, avatar }
  const [roomId, setRoomId] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [callError, setCallError] = useState(null);

  // ── Refs ──
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const isOfferCreatorRef = useRef(false);
  const iceRestarTimerRef = useRef(null);
  const roomIdRef = useRef(null);

  // ── Cleanup helper ──
  const cleanupCall = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current = null;

    // Close peer connection
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.oniceconnectionstatechange = null;  // clean up Ice handlers
      pcRef.current.close();
      pcRef.current = null;
    }

    // clear any pending ICE restart timer
    if (iceRestarTimerRef.current) {
      clearTimeout(iceRestarTimerRef.current);
      iceRestarTimerRef.current = null;
    }

    // Clear video elements
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    isOfferCreatorRef.current = false;
    roomIdRef.current = null;

    setCallState(CALL_STATE.IDLE);
    setCallType(null);
    setRemoteUser(null);
    setRoomId(null);
    setIsMuted(false);
    setIsCamOff(false);
    setIsSharing(false);
    setCallError(null);
  }, []);

  // =========== ICE Restart ===========
  const triggerIceRestart = useCallback(async () => {
    const pc = pcRef.current;
    const currentRoomId = roomIdRef.current;

    if (!pc || !currentRoomId || !isOfferCreatorRef.current) return;

    try {
      console.log("[ICE] Triggering ICE restart...");

      // createOffer with iceRestart: true forces new ICE credentials
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);

      socket.emit('offer', { roomId: currentRoomId, offer });
      console.log("[ICE] ICE restart offer sent");
    } catch (error) {
      console.error("[ICE] Failed to trigger ICE restart:", error);
      setCallError("Failed to restart connection. Please try again.");
      cleanupCall();
    }
  }, [cleanupCall]);

  // ── Build RTCPeerConnection ──
  const createPeerConnection = useCallback((targetRoomId) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        // Add TURN servers here for production
      ],
    });

    // Relay ICE candidates to the other peer via signaling server
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit("ice-candidate", { roomId: targetRoomId, candidate });
      }
    };

    // When remote stream arrives, attach to remote video element
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Monitor connection state changes
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log("[WebRTC] Connection state:", state);
      if (state === "failed" || state === "disconnected") {
        setCallError("Connection lost. Please try again.");
        cleanupCall();
      }
    };

    // ICE connection state - handle network drop recovery
    pc.oniceconnectionstatechange = () => {
      const iceState = pc.iceConnectionState;
      console.log("[ICE] Connectio state:", iceState);

      switch (iceState) {
        case "disconnected":
          // Network blip - give ti 3 sec before restarting ICE
          console.log("[ICE] Disconnected - starting 3s grace period...");
          iceRestarTimerRef.current = setTimeout(() => {
            if (pcRef.current?.iceConnectionState === "disconnected") {
              console.log("[ICE] Grace period ended - triggering ICE restart...");
              triggerIceRestart();
            }
          }, 3000);
          break;

        case "failed":
          console.error("[ICE] Failed - restarting ICE immediately.");
          if (iceRestarTimerRef.current) {
            clearTimeout(iceRestarTimerRef.current);
            iceRestarTimerRef.current = null;
          }
          triggerIceRestart();
          break;

        case "connected":
        case "completed":
          // Network restored - clear any pending restart timer
          if (iceRestarTimerRef.current) {
            console.log("[ICE] Network restored - clearing restart timer...");
            clearTimeout(iceRestarTimerRef.current);
            iceRestarTimerRef.current = null;
          }
          break;

        default:
          break;
      }
    };

    pcRef.current = pc;
    return pc;
  }, [cleanupCall, triggerIceRestart]);

  // ── Get local media stream ──
  const getLocalStream = useCallback(async (type) => {
    const constraints = {
      audio: true,
      video: type === "video" ? { width: 1280, height: 720, facingMode: "user" } : false,
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch (err) {
      console.error("[Media] Failed to get user media:", err);
      throw new Error("Could not access camera/microphone. Please check permissions.");
    }
  }, []);

  // ── INITIATE a call ──
  const initiateCall = useCallback(async (targetUser, type = "video") => {
    if (!socket || callState !== CALL_STATE.IDLE) return;

    try {
      setCallType(type);
      setRemoteUser(targetUser);
      setCallState(CALL_STATE.OUTGOING);
      setCallError(null);

      // Generate a consistent roomId from sorted user IDs
      const generatedRoomId = [currentUser._id, targetUser._id].sort().join("-");
      setRoomId(generatedRoomId);

      // Get local media before signaling
      await getLocalStream(type);

      socket.emit("initiate-call", {
        callerId: currentUser._id,
        receiverId: targetUser._id,
        roomId: generatedRoomId,
        callType: type,
      });
    } catch (err) {
      setCallError(err.message);
      cleanupCall();
    }
  }, [callState, currentUser, getLocalStream, cleanupCall]);

  // ── ACCEPT incoming call ──
  const acceptCall = useCallback(async () => {
    if (callState !== CALL_STATE.INCOMING || !roomId) return;

    try {
      await getLocalStream(callType);

      socket.emit("accept-call", {
        callerId: remoteUser._id,
        receiverId: currentUser._id,
        roomId,
      });

      setCallState(CALL_STATE.ACTIVE);
    } catch (err) {
      setCallError(err.message);
      cleanupCall();
    }
  }, [callState, roomId, callType, remoteUser, currentUser, getLocalStream, cleanupCall]);

  // ── REJECT incoming call ──
  const rejectCall = useCallback(() => {
    if (callState !== CALL_STATE.INCOMING || !roomId) return;

    socket.emit("reject-call", {
      callerId: remoteUser._id,
      receiverId: currentUser._id,
      roomId,
    });
    cleanupCall();
  }, [callState, roomId, remoteUser, currentUser, cleanupCall]);

  // ── CANCEL outgoing call ──
  const cancelCall = useCallback(() => {
    if (callState !== CALL_STATE.OUTGOING || !roomId) return;

    socket.emit("cancel-call", {
      callerId: currentUser._id,
      receiverId: remoteUser._id,
      roomId,
    });
    cleanupCall();
  }, [callState, roomId, remoteUser, currentUser, cleanupCall]);

  // ── END active call ──
  const endCall = useCallback(() => {
    if (!roomId) return;
    socket.emit("end-call", { roomId });
    cleanupCall();
  }, [roomId, cleanupCall]);

  // ── TOGGLE mic ──
  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(v => !v);
  }, []);

  // ── TOGGLE camera ──
  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsCamOff(v => !v);
  }, []);

  // ── TOGGLE screen share ──
  const toggleScreenShare = useCallback(async () => {
    if (isSharing) {
      // Stop screen share, revert to camera
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;

      const camStream = localStreamRef.current;
      const videoTrack = camStream?.getVideoTracks()[0];
      if (videoTrack && pcRef.current) {
        const sender = pcRef.current.getSenders().find(s => s.track?.kind === "video");
        sender?.replaceTrack(videoTrack);
      }
      setIsSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;

        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace video track in peer connection
        if (pcRef.current) {
          const sender = pcRef.current.getSenders().find(s => s.track?.kind === "video");
          sender?.replaceTrack(screenTrack);
        }

        // Update local preview
        if (localVideoRef.current) {
          const combined = new MediaStream([
            screenTrack,
            ...localStreamRef.current.getAudioTracks(),
          ]);
          localVideoRef.current.srcObject = combined;
        }

        // Auto-stop when user ends share via browser UI
        screenTrack.onended = () => toggleScreenShare();
        setIsSharing(true);
      } catch (err) {
        console.error("[Screen Share] Failed:", err);
      }
    }
  }, [isSharing]);

  // ── WebRTC: create and send OFFER (caller side) ──
  const startWebRTCAsOffer = useCallback(async (stream, targetRoomId) => {
    const pc = createPeerConnection(targetRoomId);
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("offer", { roomId: targetRoomId, offer });
    isOfferCreatorRef.current = true;
  }, [createPeerConnection]);

  // ── Socket event listeners ──
  useEffect(() => {
    if (!socket) return;

    // Someone is calling us
    const onIncomingCall = ({ callerId, roomId: incomingRoomId, callerUsername, callerAvatar, callType: incomingType }) => {
      if (callState !== CALL_STATE.IDLE) {
        socket.emit("call-busy", { callerId });
        return;
      }
      setCallState(CALL_STATE.INCOMING);
      setCallType(incomingType || "video");
      setRoomId(incomingRoomId);
      setRemoteUser({ _id: callerId, username: callerUsername, avatar: callerAvatar });
    };

    // Receiver accepted our call → we create the WebRTC offer
    const onCallAccepted = async ({ receiverId, roomId: acceptedRoomId }) => {
      setCallState(CALL_STATE.ACTIVE);
      if (localStreamRef.current) {
        await startWebRTCAsOffer(localStreamRef.current, acceptedRoomId);
      }
    };

    const onCallRejected = () => {
      setCallError("Call was declined.");
      cleanupCall();
    };

    const onCallCancelled = () => {
      cleanupCall();
    };

    const onCallEnded = () => {
      cleanupCall();
    };

    const onCallBusy = () => {
      setCallError("User is busy in another call.");
      cleanupCall();
    };

    const onCallFailed = ({ message }) => {
      setCallError(message || "Call failed.");
      cleanupCall();
    };

    const onCallTimeout = () => {
      setCallError("No answer.");
      cleanupCall();
    };

    // ── WebRTC Signaling ──
    // Receiver gets offer → creates answer
    const onOffer = async ({ roomId: offerRoomId, offer }) => {
      if (!pcRef.current) {
        const pc = createPeerConnection(offerRoomId);
        localStreamRef.current?.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current));
      }
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.emit("answer", { roomId: offerRoomId, answer });
    };

    // Caller gets answer → set remote description
    const onAnswer = async ({ answer }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    // Both sides receive and apply ICE candidates
    const onIceCandidate = async ({ candidate }) => {
      if (pcRef.current && candidate) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("[ICE] Failed to add candidate:", err);
        }
      }
    };

    socket.on("incoming-call", onIncomingCall);
    socket.on("call-accepted", onCallAccepted);
    socket.on("call-rejected", onCallRejected);
    socket.on("call-cancelled", onCallCancelled);
    socket.on("call-ended", onCallEnded);
    socket.on("call-busy", onCallBusy);
    socket.on("call-failed", onCallFailed);
    socket.on("call-timeout", onCallTimeout);
    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("ice-candidate", onIceCandidate);

    return () => {
      socket.off("incoming-call", onIncomingCall);
      socket.off("call-accepted", onCallAccepted);
      socket.off("call-rejected", onCallRejected);
      socket.off("call-cancelled", onCallCancelled);
      socket.off("call-ended", onCallEnded);
      socket.off("call-busy", onCallBusy);
      socket.off("call-failed", onCallFailed);
      socket.off("call-timeout", onCallTimeout);
      socket.off("offer", onOffer);
      socket.off("answer", onAnswer);
      socket.off("ice-candidate", onIceCandidate);
    };
  }, [callState, createPeerConnection, startWebRTCAsOffer, cleanupCall]);

  const value = {
    // State
    callState,
    callType,
    remoteUser,
    roomId,
    isMuted,
    isCamOff,
    isSharing,
    callError,

    // Refs (passed to <video> elements)
    localVideoRef,
    remoteVideoRef,

    // Actions
    initiateCall,
    acceptCall,
    rejectCall,
    cancelCall,
    endCall,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
  };

  return <CallContexts.Provider value={value}>{children}</CallContexts.Provider>;
}