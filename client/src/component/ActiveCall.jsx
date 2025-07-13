import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import "../styles/Calls.css"
import { useCall } from "../context/CallContext";

const ActiveCall = ({ onEndCall }) => {
  const { localStream, remoteStream, remoteUser } = useCall();

  const [isMuted, setIsMuted] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const[isMinimized, setIsMinimized] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

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
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle video on/off
  const handleToggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled)
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <motion.div
      className="active-call"
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.2 }}
    >

      <div className="call-header">
        <div className="user-info">
          <div className="avatar">
            {remoteUser?.avatar ? (
              <img src={remoteUser.avatar} alt={remoteUser?.username} />
            ) : (
              <span>{remoteUser?.username.charAt(0).toUpperCase()}</span>
            )}
            <div className="status-indicator"></div>
          </div>
          <h3>{remoteUser.username || 'Caller'}</h3>
          <div className="call-timer">{formatTime(callDuration)}</div>
        </div>
      </div>
      <div className="video-controlls">
        <video
          ref={remoteVideoRef}
          className="remote-video"
          autoPlay
          playsInline
          muted={false}
        />

        {/* local video preview */}
        <video
          ref={localVideoRef}
          className="local-video"
          autoPlay
          playsInline
          muted
        />
      </div>

      <div className="call-controls">
        <motion.div
          className="control-button"
          whileTap={{ scale: 0.9 }}
          onClick={handleToggleMute}
          aria-label={isMuted ? "unmute microphone" : "mute microphone"}
        // onClick={() => {
        //   setIsMuted(!isMuted);
        //   onToggleMute(!isMuted);
        // }}
        >
          {isMuted ? '🔇' : '🎤'}
          {/* 🎤 Mute */}
        </motion.div>

        <motion.button
          className="control-button"
          whileTap={{ scale: 0.9 }}
          onClick={handleToggleVideo}
          aria-label={videoEnabled ? "Turn off camera" : "Turn on camera"}
        >
          {videoEnabled ? "📷 Camera On" : "📷 Camera Off"}
        </motion.button>

        <motion.div
          className="end-call-button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onEndCall}
        >
          🚫
        </motion.div>
      </div>
    </motion.div>
  )
};

export default ActiveCall;