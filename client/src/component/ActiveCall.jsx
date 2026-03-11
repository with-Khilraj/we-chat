import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import "../styles/Calls.css"
import { useCall } from "../context/CallContext";

const ActiveCall = ({ onEndCall }) => {
  const { localStream, remoteStream, remoteUser } = useCall();

  const [isMuted, setIsMuted] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const[isMinimized, setIsMinimized] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // call duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Assign local stream to video element
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Assign remote stream to video element
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleToggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(prev => !prev);
    }
  };

  // Toggle video on/off
  const handleToggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(prev => !prev);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const displayName = remoteUser?.username || "Caller";
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <motion.div
      className={`active-call ${isMinimized ? 'active-call--minimized' : ''}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="call-header">
        <div className="user-info">
          <div className="avatar">
            {remoteUser?.avatar ? (
              <img src={remoteUser.avatar} alt={displayName} />
            ) : (
              <span>{avatarInitial}</span>
            )}
            <div className="status-indicator" />
          </div>
          <h3>{displayName}</h3>
          <div className="call-timer">{formatTime(callDuration)}</div>
        </div>

        <motion.button
          className="minimize-button"
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsMinimized(prev => !prev)}
          aria-label={isMinimized ? "Expand call" : "Minimize call"}
        >
          {isMinimized ? '▲' : '▼'}
        </motion.button>
      </div>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            className="video-controls"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <video
              ref={remoteVideoRef}
              className="remote-video"
              autoPlay
              playsInline
            />

            {videoEnabled ? (
              <video
                ref={localVideoRef}
                className="local-video"
                autoPlay
                playsInline
                muted
              />
            ) : (
              <div className="local-video local-video--off">
                <span>{avatarInitial}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="call-controls">
        <motion.button
          className={`control-button ${isMuted ? 'control-button--active' : ''}`}
          whileTap={{ scale: 0.9 }}
          onClick={handleToggleMute}
          aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </motion.button>

        <motion.button
          className={`control-button ${!videoEnabled ? 'control-button--active' : ''}`}
          whileTap={{ scale: 0.9 }}
          onClick={handleToggleVideo}
          aria-label={videoEnabled ? "Turn off camera" : "Turn on camera"}
        >
          {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
        </motion.button>

        <motion.button
          className="end-call-button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onEndCall}
          aria-label="End call"
        >
          <PhoneOff size={20} />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ActiveCall;