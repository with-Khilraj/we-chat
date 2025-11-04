import React, { createContext, useContext, useEffect, useReducer, useCallback, useMemo } from "react";
import socket from "../services/socket";
import api from "../Api";

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
  localStream: null,
  remoteStream: null,
  peerConnection: null,
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

    case ACTIONS.SET_MEDIA_STREAMS:
      return {
        ...state,
        localStream: action.localStream,
        remoteStream: action.remoteStream
      };

    case ACTIONS.SET_PEER_CONNECTION:
      return { ...state, peerConnection: action.peerConnection };

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

  // ======================
  // WebRTC Setup
  // ======================
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
      }).catch(err => {
        throw new Error('Media access denied');
      });

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (e) => dispatch({
        type: ACTIONS.SET_MEDIA_STREAMS,
        localStream: stream,
        remoteStream: e.streams[0]
      });

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", {
            roomId,
            candidate: e.candidate
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") {
          dispatch({
            type: ACTIONS.ERROR,
            error: "Call disconnected"
          });
          cleanupResources(pc, stream);
        }
      };

      dispatch({
        type: ACTIONS.SET_PEER_CONNECTION,
        peerConnection: pc
      });

      return pc;

    } catch (err) {
      dispatch({
        type: ACTIONS.ERROR,
        error: err.message || 'WebRTC setup failed'
      });
      return null;
    }
  }, []);

  // ======================
  // Resource Cleanup
  // ======================
  const cleanupResources = useCallback((pc, stream) => {
    if (pc) pc.close();
    if (stream) stream.getTracks().forEach(track => track.stop());
  }, []);

  // ======================
  // Call Actions
  // ======================
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

      const offer = await pc.createOffer()
        .catch(err => {
          throw new Error('Failed to create offer');
        });

      await pc.setLocalDescription(offer);
      socket.emit('offer', {
        roomId: state.roomId,
        offer
      });

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

    cleanupResources(state.peerConnection, state.localStream);
    dispatch({ type: ACTIONS.REJECT_CALL });
  }, [state.remoteUser, state.roomId, state.peerConnection, state.localStream, currentUser, cleanupResources]);

  const endCall = useCallback(() => {
    socket.emit('end-call', { roomId: state.roomId });
    cleanupResources(state.peerConnection, state.localStream);
    dispatch({ type: ACTIONS.END_CALL });
  }, [state.roomId, state.peerConnection, state.localStream]);

  // ======================
  // Socket Listeners
  // ======================
  useEffect(() => {
    const handleIncomingCall = async ({ callerId, roomId }) => {
      try {
        // const accessToken = localStorage.get('accessToken');
        // if(!accessToken) throw new Error('No access token!');

        // // Dipatch initial state with partial remoteUser
        // dispatch({
        //   type: ACTIONS.RECEIVE_CALL,
        //   roomId,
        //   remoteUser: { _Id: callerId }
        // });

        // fetch full caller details
        const res = await api.get(`api/users/${callerId}`);

        // update with full remoteUser details
        // dispatch({
        //   type: ACTIONS.RECEIVE_CALL,
        //   roomId,
        //   remoteUser: res.data
        // });
      } catch (err) {
        dispatch({
          type: ACTIONS.ERROR,
          error: 'Failed to load caller details'
        });
        endCall();
      }
    };

    const handleIceCandidate = ({ roomId, candidate }) => {
      if (state.peerConnection && state.roomId === roomId) {
        state.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    const handleOffer = async ({ roomId, offer }) => {
      if(state.roomId === roomId && state.status === callStates.RINGING_INCOMING) {
        try {
          const pc = state.peerConnection || (await setupWebRTC(roomId));
          if(!pc) throw new Error("Failed to setup WebRTC");

          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('offer', {
            roomId,
            answer,
          })
        } catch (error) {
          dispatch({
            type: ACTIONS.ERROR,
            error: error.message || "Failed to handle offer"
          });
          endCall();
        }
      }
    }

    const handleAnswer = ({ roomId, answer }) => {
      if(state.peerConnection && state.roomId === roomId && state.status === callStates.RINGING_OUTGOING) {
        state.peerConnection.setRemoteDescription(new RTCSessionDescription(answer)).catch(err => {
          dispatch({
            type: ACTIONS.ERROR, 
            error: "Failed to set remote description "
          });
          endCall();
        });
      }
    };

    socket.on('incoming-call', handleIncomingCall);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('call-accepted', () => {
      if (state.status === callStates.RINGING_OUTGOING) {
        dispatch({ type: ACTIONS.ACCEPT_CALL });
      }
    });
    socket.on('call-rejected', () => {
      if (state.status === callStates.RINGING_OUTGOING) {
        dispatch({ type: ACTIONS.ERROR, error: 'Call rejected' });
        endCall();
      }
    });
    socket.on('call-ended', ({ roomId }) => {
      if(state.roomId === roomId) {
        cleanupResources(state.peerConnection, state.localStream);
        dispatch({ type: ACTIONS.END_CALL });
      }
    });
    socket.on('call-busy', () => {
      dispatch({ type: ACTIONS.ERROR, error: 'User is busy' });
      endCall();
    });

    return () => {
      socket.off('incoming-call', handleIncomingCall);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('call-accepted');
      socket.off('call-rejected');
      socket.off('call-ended');
      socket.off('call-busy');
    };
  }, [state.status, endCall, state.peerConnection, state.roomId]);


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
    const fetchCallerDetails = async (callerId) => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) throw new Error("No access token");

        const response = await api.get(`/api/users/${callerId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        // Update the remoteUser in state with full caller details
        dispatch({
          type: ACTIONS.RECEIVE_CALL,
          roomId: state.roomId,
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

    // Trigger when incoming call arrives
    const handleIncomingCall = ({ callerId, roomId }) => {
      fetchCallerDetails(callerId);
      dispatch({
        type: ACTIONS.RECEIVE_CALL,
        roomId,
        remoteUser: { _id: callerId } // Temporary partial user
      });
    };

    socket.on('incoming-call', handleIncomingCall);
    return () => socket.off('incoming-call', handleIncomingCall);
  }, [endCall, state.roomId]);

  // ======================
  // Context Value
  // ======================
  
  
  const contextValue = useMemo(() => ({
    callState: state.status,
    localStream: state.localStream,
    remoteStream: state.remoteStream,
    remoteUser: state.remoteUser,
    error: state.error,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    isCalling: state.status !== callStates.IDLE
  }), [
    state.status,
    state.localStream,
    state.remoteStream,
    state.remoteUser,
    state.error,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall
  ]);

  return (
    <CallContext.Provider value={contextValue}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);