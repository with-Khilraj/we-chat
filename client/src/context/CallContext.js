import React, { createContext, useContext, useEffect, useReducer, useCallback, useMemo, useRef } from "react";
import socket from "../utils/useSocket";
import { api } from "../Api";

// ======================
// Constants & Types
// ======================
const ACTIONS = {
  INITIATE_CALL: 'INITIATE_CALL',
  RECEIVE_CALL: 'RECEIVE_CALL',
  ACCEPT_CALL: 'ACCEPT_CALL',
  REJECT_CALL: 'REJECT_CALL',
  END_CALL: 'END_CALL',
  SET_MEDIA_STREAMS: 'SET_MEDIA_STREAMS',
  SET_PEER_CONNECTION: 'SET_PEER_CONNECTION',
  ERROR: 'ERROR'
};

const callStates = {
  IDLE: 'idle',
  RINGING_OUTGOING: 'ringing_outgoing',
  RINGING_INCOMING: 'ringing_incoming',
  ACTIVE: 'active',
  ERROR: 'error'
};

const initialState = {
  status: callStates.IDLE,
  error: null,
  roomId: null,
  remoteUser: null
};

// ======================
// Reducer
// ======================
function callReducer(state, action) {
  switch (action.type) {
    case ACTIONS.INITIATE_CALL:
      return {
        ...state,
        status: callStates.RINGING_OUTGOING,
        roomId: action.roomId,
        remoteUser: action.remoteUser
      };

    case ACTIONS.RECEIVE_CALL:
      return {
        ...state,
        status: callStates.RINGING_INCOMING,
        roomId: action.roomId,
        remoteUser: action.remoteUser
      };

    case ACTIONS.ACCEPT_CALL:
      return { ...state, status: callStates.ACTIVE };

    case ACTIONS.REJECT_CALL:
    case ACTIONS.END_CALL:
      return initialState;

    case ACTIONS.ERROR:
      return { ...initialState, error: action.error };

    default:
      return state;
  }
}


// DEFAULT CONTEXT VALUE ***************
const defaultCallContextValue = {
  // state
  callState: callStates.IDLE,
  localStream: null,
  remoteStream: null,
  remoteUser: null,
  error: null,
  isCalling: false,

  // Actions
  initiateCall: () => console.error(
    "CallContext not found! Wrap your app with <CallProvider>"
  ),
  acceptCall: () => console.error("CallProvider not initialized"),
  rejectCall: () => console.error("CallProvider not initialized"),
  endCall: () => console.error("CallProvider not initialized"),
};

// ======================
// Context
// ======================
const CallContext = createContext(defaultCallContextValue);

export const CallProvider = ({ children, currentUser }) => {
  const [state, dispatch] = useReducer(callReducer, initialState);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // triggers re-render when ref values change (refs alone don't cause re-renders)
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  // WebRTC Setup
  const setupWebRTC = useCallback(async (roomId) => {
    try {
      const config = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" }
        ]
      };
      const pc = new RTCPeerConnection(config);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      }).catch(() => {
        throw new Error('Media access denied');
      });

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      localStreamRef.current = stream;
      peerConnectionRef.current = pc;
      forceUpdate();

      pc.ontrack = (e) => {
        remoteStreamRef.current = e.streams[0];
        forceUpdate();
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", { roomId, candidate: e.candidate });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") {
          dispatch({ type: ACTIONS.ERROR, error: "Call disconnected" });
          cleanupResources();
        }
      };

      return pc;

    } catch (err) {
      dispatch({
        type: ACTIONS.ERROR,
        error: err.message || 'WebRTC setup failed'
      });
      return null;
    }
  }, [forceUpdate, cleanupResources]);


  // ======================
  // Resource Cleanup
  // ======================
  const cleanupResources = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    remoteStreamRef.current = null;
  }, []);

  // Call Actions
  const initiateCall = useCallback(async (remoteUser, roomId) => {
    try {
      socket.emit('initiate-call', {
        callerId: currentUser._id,
        receiverId: remoteUser._id,
        roomId
      });
      dispatch({
        type: ACTIONS.INITIATE_CALL,
        roomId,
        remoteUser
      });
    } catch (err) {
      dispatch({
        type: ACTIONS.ERROR,
        error: 'Call initiation failed'
      });
    }
  }, [currentUser]);

  const acceptCall = useCallback(async () => {
    if (!state.roomId || !state.remoteUser) {
      dispatch({
        type: ACTIONS.ERROR,
        error: 'Missing call data'
      });
      return;
    }

    try {
      const pc = await setupWebRTC(state.roomId);
      if (!pc) return;

      // tell the caller we've accepted and are ready to connect - they will respond by creating an offer
      socket.emit('accept-call', {
        callerId: state.remoteUser._id,
        receiverId: currentUser._id,
        roomId: state.roomId
      });

      dispatch({ type: ACTIONS.ACCEPT_CALL });

    } catch (err) {
      dispatch({
        type: ACTIONS.ERROR,
        error: err.message || 'Call acceptance failed'
      });
      endCall();
    }
  }, [state.roomId, state.remoteUser, setupWebRTC, currentUser]);

  const rejectCall = useCallback(() => {
    if (!state.remoteUser || !state.roomId) return;

    socket.emit('reject-call', {
      callerId: state.remoteUser._id,
      receiverId: currentUser._id,
      roomId: state.roomId
    });

    cleanupResources();
    dispatch({ type: ACTIONS.REJECT_CALL });
  }, [state.remoteUser, state.roomId, currentUser, cleanupResources]);

  const endCall = useCallback(() => {
    socket.emit('end-call', { roomId: state.roomId });
    cleanupResources();
    dispatch({ type: ACTIONS.END_CALL });
  }, [state.roomId, cleanupResources]);


  useEffect(() => {
    // handleIceCandidate uses stateRef to avoid stale closures
    const handleIceCandidate = ({ roomId, candidate }) => {
      if (peerConnectionRef.current && stateRef.current.roomId === roomId) {
        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    // callee handles offer → creates answer → emits 'answer' (not 'offer')
    const handleOffer = async ({ roomId, offer }) => {
      if (stateRef.current.roomId === roomId && stateRef.current.status === callStates.RINGING_INCOMING) {
        try {
          const pc = peerConnectionRef.current || (await setupWebRTC(roomId));
          if (!pc) throw new Error("Failed to setup WebRTC");

          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          // FIX: was wrongly emitting 'offer' here — must be 'answer'
          socket.emit('answer', { roomId, answer });
        } catch (error) {
          dispatch({ type: ACTIONS.ERROR, error: error.message || "Failed to handle offer" });
          endCall();
        }
      }
    };

    const handleAnswer = ({ roomId, answer }) => {
      if (peerConnectionRef.current && stateRef.current.roomId === roomId) {
        peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer))
          .catch(() => {
            dispatch({ type: ACTIONS.ERROR, error: "Failed to set remote description" });
            endCall();
          });
      }
    };

    // caller creates the offer HERE, after callee accepts the call and is ready to connect
    const handleCallAccepted = async ({ roomId }) => {
      if (stateRef.current.status === callStates.RINGING_OUTGOING) {
        try {
          const pc = await setupWebRTC(stateRef.current.roomId);
          if (!pc) return;

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('offer', { roomId: stateRef.current.roomId, offer });

          dispatch({ type: ACTIONS.ACCEPT_CALL });
        } catch (err) {
          dispatch({ type: ACTIONS.ERROR, error: 'Failed to create offer' });
          endCall();
        }
      }
    };

    socket.on('ice-candidate', handleIceCandidate);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('call-accepted', handleCallAccepted);
    socket.on('call-rejected', () => {
      if (stateRef.current.status === callStates.RINGING_OUTGOING) {
        dispatch({ type: ACTIONS.ERROR, error: 'Call rejected' });
        endCall();
      }
    });
    socket.on('call-ended', ({ roomId }) => {
      if (stateRef.current.roomId === roomId) {
        cleanupResources();
        dispatch({ type: ACTIONS.END_CALL });
      }
    });
    socket.on('call-busy', () => {
      dispatch({ type: ACTIONS.ERROR, error: 'User is busy' });
      endCall();
    });

    return () => {
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('call-accepted', handleCallAccepted);
      socket.off('call-rejected');
      socket.off('call-ended');
      socket.off('call-busy');
    };
  }, [setupWebRTC, endCall, cleanupResources]);


  // ======================
  // Auto Cleanup on Unmount
  // ======================
  useEffect(() => {
    const handleBeforeUnload = () => {
      cleanupResources(state.peerConnection, state.localStream);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.peerConnection, state.localStream, cleanupResources]);


  // ======================
  // Call Timeout
  // ======================
  useEffect(() => {
    let timeout;
    if (state.status === callStates.RINGING_OUTGOING) {
      timeout = setTimeout(() => {
        dispatch({ type: ACTIONS.ERROR, error: 'Call timed out' });
        endCall();
      }, 30000);
    }
    return () => clearTimeout(timeout);
  }, [state.status, endCall]);


  // fetching caller details
  useEffect(() => {
    const fetchCallerDetails = async (callerId, roomId) => {
      try {
        const response = await api.get(`/api/users/${callerId}`);

        // Update the remoteUser in state with full caller details
        dispatch({
          type: ACTIONS.RECEIVE_CALL,
          roomId,
          remoteUser: response.data
        });

      } catch (err) {
        dispatch({
          type: ACTIONS.ERROR,
          error: "Failed to fetch caller details"
        });
        endCall(); // Auto-reject if details can't be loaded
      }
    };

    const handleIncomingCall = ({ callerId, roomId }) => {
      // dispatch imediately with partial user so UI shows without dealy
      dispatch({
        type: ACTIONS.RECEIVE_CALL,
        roomId,
        remoteUser: { _id: callerId } // Temporary partial user
      });
      // then fetch full details and update state
      fetchCallerDetails(callerId, roomId)
    };

    socket.on('incoming-call', handleIncomingCall);
    return () => socket.off('incoming-call', handleIncomingCall);
  }, [endCall]);

  // ======================
  // Context Value
  // ======================


  const contextValue = useMemo(() => ({
    callState: state.status,
    localStream: localStreamRef.current,
    remoteStream: remoteStreamRef.current,
    remoteUser: state.remoteUser,
    error: state.error,
    initiateCall, acceptCall, rejectCall, endCall,
    isCalling: state.status !== callStates.IDLE
  }), [state.status, state.remoteUser, state.error,
    initiateCall, acceptCall, rejectCall, endCall]);

  return (
    <CallContext.Provider value={contextValue}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);