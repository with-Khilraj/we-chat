import React from "react";
import moment from "moment";
import "../styles/chatContainer.css";
import "../styles/Calls.css"
import { useOnlineUsers } from "../context/onlineUsersContext";
import { useChat } from "../hooks/useChat";
import { shouldDisplayTimeStamp, shouldStartNewGroup, renderStatusIndicator } from "../utils/chatUtils";
import audio_call from "../assets/call.png";
import video_call from "../assets/video-camera.png";
import info_icon from "../assets/info.png";
import audio_icon from "../assets/mic.png";
import media_icon from "../assets/image-gallery.png";
import FloatingCallWindow from "./FloatingCallWindow";
import ActiveCall from "./ActiveCall";
import IncomingCall from "./Incoming_call";
import CallInitiation from "./CallInitiation";
import { AnimatePresence } from "framer-motion";


const ChatContainer = ({ selectedUser, currentUser, initiateCall }) => {
  const {
    messages,
    newMessage,
    isUploading,
    showProfileInfo,
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
    handleInitiateCall,
    handleAcceptCall,
    handleRejectCall,
    handleEndCall,
    localStream,
    remoteStream,
    toggleProfileInfo,
  } = useChat(selectedUser, currentUser);

  const onlineUsers = useOnlineUsers();
  // const isOnline = React.useMemo(() => onlineUsers.includes(selectedUser._id), [onlineUsers, selectedUser._id]);
  // adding class to the chat-container based on the state of the showProfileInfo
  const chatContainerClass = showProfileInfo ? 'chat-container shrink' : 'chat-container';

  if (!selectedUser) {
    return (
      <div className="unselected-chat">Select a user to start chatting!</div>
    );
  }

  return (
    <>
      <div className={chatContainerClass}>
        <div className="chat-header">
          <div className="user-profile-name">
            <div className="chat-avatar">
              {selectedUser.avatar ? (
                <img src={selectedUser.avatar} alt="" />
              ) : (
                <span>{selectedUser.username.charAt(0).toUpperCase()}</span>
              )}
              {onlineUsers.includes(selectedUser._id) && (
                <span className="online-indicator"></span>
              )}
            </div>
            <h3 className="chat-username">
              {selectedUser.username}
              <br></br>
              {onlineUsers.includes(selectedUser._id) && (
                <span className="online-status">Active now</span>
              )}
            </h3>
          </div>

          {/* adding video and audio call icons */}
          <div className="chat-call-icons">
            <button className="video-call-icon">
              <img src={video_call} alt="" />
            </button>

            {/* Call Buttons */}
            <button
              onClick={handleInitiateCall}
              // onClick={() => initiateCall(selectedUser._id)}
              disabled={isCalling}
              className="audio-call-icon"
            >
              <img src={audio_call} alt="" />
            </button>

            {/* Audio Elements */}
            {localStream && <audio ref={(ref) => ref && (ref.srcObject = localStream)} muted autoPlay />}
            {remoteStream && <audio ref={(ref) => ref && (ref.srcObject = remoteStream)} autoPlay />}

            <button className="info-icon" onClick={toggleProfileInfo}>
              <img src={info_icon} alt="" />
            </button>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((message, index) => {
            const isCurrentUser = message.senderId === currentUser._id;
            const senderUser = isCurrentUser ? currentUser : selectedUser;
            const previousMessage = messages[index - 1];
            // const nextMessage = messages[index + 1];
            const showTimeStamp = shouldDisplayTimeStamp(
              message,
              previousMessage,
            );
            const startNewGroup = shouldStartNewGroup(message, previousMessage);

            return (
              <div key={index}>
                {/* show timestamp if necessary */}
                {showTimeStamp && (
                  <div className="message-timestamp">
                    {moment(message.createdAt || Date.now()).format(
                      "D MMM YYYY, HH:mm"
                    )}
                  </div>
                )}

                <div
                  className={`message-group ${isCurrentUser ? "sent" : "received"
                    }`}
                >
                  {!isCurrentUser && startNewGroup && (
                    <div className="avatar-content">
                      {/* Avatar or Initial char of username */}
                      <div className="message-avatar">
                        {senderUser.avatar ? (
                          <img src={senderUser.avatar} alt="" />
                        ) : (
                          <span className="message-initial">
                            {senderUser.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Message abubble */}
                  <div
                    className={`message-container ${message.senderId === currentUser._id ?
                      "sent" : "received"
                      }`}>
                    <div className="message">
                      <div className="message-content">
                        {message.messageType === "text" && <p className="text-message">{message.content}</p>}
                        {message.messageType === "photo" && (
                          <div className="for-photo">
                            <img src={message.fileUrl} alt={message.fileName} className="media-message" />
                          </div>
                        )}
                        {message.messageType === "video" && (
                          <div>
                            <video controls src={message.fileUrl} className="video-message" />
                          </div>
                        )}
                        {message.messageType === "audio" && (
                          <div>
                            <audio controls src={message.fileUrl} className="audio-message" />
                          </div>
                        )}
                        {message.messageType === "file" && (
                          <div>
                            <a href={message.fileUrl} download={message.fileName} className="file-message">
                              {message.fileName}
                            </a>
                          </div>
                        )}

                        {/* Hover Icons for received or left */}
                        {message.senderId !== currentUser._id && (
                          <div className="message-hover-icons">
                            <button className="icon-button" >
                              <span role="img" aria-label="React">❤️</span> {/* Reaction icon */}
                            </button>
                            <button className="icon-button" >
                              <span role="img" aria-label="Reply">↩️</span> {/* Reply icon */}
                            </button>
                            <button className="icon-button" >
                              <span role="img" aria-label="More">⋮</span> {/* More options icon */}
                            </button>
                          </div>
                        )}
                      </div>


                    </div>
                    {/* status indicator */}
                    {message.senderId === currentUser._id && (
                      <div className="message-status inside">
                        {renderStatusIndicator(message.status)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add typing indicator */}
          {isOtherUserTyping && (
            <div className="typing-indicator received">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messageEndRef}></div>
        </div>

        {/* message input */}
        <div className="chat-input">
          <div className="media-icons">
            <button onClick={handleMediaClick}>
              <img src={media_icon} alt="Media" />
            </button>
            {/* Icon for audio (if needed) */}
            <button onClick={handleAudioRecording}>
              <img src={audio_icon} alt="Audio" />
            </button>
          </div>

          <input
            type="text"
            value={newMessage}
            // onChange={(e) => setNewMessage(e.target.value)}
            onChange={handleTypingEvent}
            placeholder="Type your message..."
          />

          <button onClick={() => handleSendMessage()} disabled={isUploading}>
            {isUploading ? "Sending" : "Send"}
          </button>

          {/* Hidden file input for media (photos, videos, files) */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileInputChange}
            accept="image/*, video/*, .pdf, .doc, .docx" // Allow photos, videos, and files
          />
        </div>
      </div>

      {/* Profile Info Container */}
      <div className={`profile-info ${showProfileInfo ? 'show' : ''}`}>
        <div className="profile-pic">
          {selectedUser && (
            <div className="user-profile-pic">
              {selectedUser.avatar ? (
                <img src={selectedUser.avatar} alt="" />
              ) : (
                <span className="user-initial-char">
                  {selectedUser.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="profile-user-name">
          {selectedUser && (
            <h3>{selectedUser.username}</h3>
          )}
        </div>
        {/* Profile content goes here */}
        <p>Additional details about the current user...</p>
      </div>


      {/* Call Components */}
      <AnimatePresence>
        {/* Call Initiation UI (for caller) */}
        {callState === 'ringing' && !incomingCall && !isCalling && (
          <CallInitiation
            user={selectedUser}
            onCallCancel={handleEndCall}
          />
        )}

        {/* Incoming Call UI (for receiver) */}
        {callState === 'ringing' && incomingCall && (
          <IncomingCall
            user={caller}
            onAccept={() => handleAcceptCall(callRoomId)}
            onReject={handleRejectCall}
          />
        )}

        {callState === 'active' && (
          <FloatingCallWindow>
            <ActiveCall
              user={selectedUser}
              onEndCall={handleEndCall}
              onToggleMute={(muted) => {
                // if (localStream) {
                //   localStream.getAudioTracks().forEach(track => {
                //     track.enabled = !muted;
                //   });
                // }
              }}
            />
          </FloatingCallWindow>
        )}
      </AnimatePresence>

    </>
  );
};

export default ChatContainer;