import React, { useEffect } from "react";
import moment from "moment";
import "../styles/chatContainer.css";
import socket from "../utils/socket";
import { useOnlineUsers } from "../context/onlineUsersContext";
import { useChat } from "../hooks/useChat";
import { shouldDisplayTimeStamp, shouldStartNewGroup, renderStatusIndicator } from "../utils/chatUtils";
import audio_call from "../assets/call.png";
import video_call from "../assets/video-camera.png";
import info_icon from "../assets/info.png";
import audio_icon from "../assets/mic.png";
import media_icon from "../assets/image-gallery.png";


const ChatContainer = ({ selectedUser, currentUser }) => {
  const {
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
    messageEndRef,
    fileInputRef,
    handleSendMessage,
    handleFileInputChange,
    handleMediaClick,
    handleAudioRecording,
    handleTypingEvent,
    toggleProfileInfo,
  } = useChat (selectedUser, currentUser);

  const onlineUsers = useOnlineUsers();
  // adding class to the chat-container based on the state of the showProfileInfo
  const chatContainerClass = showProfileInfo ? 'chat-container shrink' : 'chat-container';

  // listen for new messages
  useEffect(() => {
    const roomId = [currentUser._id, selectedUser?._id].sort().join("-");
    socket.emit('join-room', roomId);

    socket.on('new-message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off('new-message');
      socket.emit('leave-room', roomId);
    }
  }, [setMessages, selectedUser, currentUser]);

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
            <button className="audio-call-icon">
              <img src={audio_call} alt="" />
            </button>
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

                </div>

                {/* Message abubble */}
                <div
                  className={`message ${message.senderId === currentUser._id ? "sent" : "received"
                    }`}
                >
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

                  {/* status indicator */}
                  {message.senderId === currentUser._id && (
                    <div className="message-status">
                    {renderStatusIndicator(message.status)}
                  </div>
                  )}            
                </div>
              </div>
            );
          })}

          {/* Add typing indicator */}
          {isOtherUsertyping && (
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

          <button onClick={handleSendMessage} disabled={isUploading}>
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
    </>
  );
};

export default ChatContainer;