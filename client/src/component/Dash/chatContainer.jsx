import React from "react";
import moment from "moment";
import "../../styles/chatContainer.css";
import { useOnlineUsers } from "../../context/onlineUsersContext";
import { useChat } from "../../hooks/useChat";
import { shouldDisplayTimeStamp, shouldStartNewGroup, renderStatusIndicator } from "../../utils/chatUtils";
import { Image, Mic, Send, Info, Video, Phone } from "lucide-react";
import { useCall } from "../../context/CallContext";
// import { useCall } from "../context/CallContextInitial";


const ChatContainer = ({ selectedUser, currentUser }) => {
  const {
    messages,
    newMessage,
    isUploading,
    showProfileInfo,
    isOtherUserTyping,
    messageEndRef,
    fileInputRef,
    handleSendMessage,
    handleFileInputChange,
    handleMediaClick,
    handleAudioRecording,
    handleTypingEvent,
    handleInitiateCallLocal,
    toggleProfileInfo,
  } = useChat(selectedUser, currentUser);

  const { isCalling, localStream, remoteStream, initiateCall } = useCall();

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
          <div className="flex items-center gap-2">
            {/* Call Buttons */}
            <button
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
            >
              <Video size={20} />
            </button>

            <button
              onClick={() => initiateCall(selectedUser)}
              disabled={isCalling}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 disabled:opacity-50"
            >
              <Phone size={20} />
            </button>

            {/* Audio Elements */}
            {localStream && <audio ref={(ref) => ref && (ref.srcObject = localStream)} muted autoPlay />}
            {remoteStream && <audio ref={(ref) => ref && (ref.srcObject = remoteStream)} autoPlay />}

            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600" onClick={toggleProfileInfo}>
              <Info size={20} />
            </button>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((message, index) => {
            const isCurrentUser = message.senderId === currentUser._id;
            const senderUser = isCurrentUser ? currentUser : selectedUser;
            const previousMessage = messages[index - 1];
            const nextMessage = messages[index + 1];

            const isLastMessageInGroup = !nextMessage || nextMessage.senderId !== message.senderId;
            const showTimeStamp = shouldDisplayTimeStamp(
              message,
              previousMessage,
            );
            const startNewGroup = shouldStartNewGroup(message, previousMessage);

            console.log(`Message: ${message.content}, Sender: ${message.senderId}, Is Last: ${isLastMessageInGroup}, New Group: ${startNewGroup}`)

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
                  {!isCurrentUser && isLastMessageInGroup && (
                    <div className="avatar-content">
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
                      } message-type-${message.messageType}`}>
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
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">

            {/* Media Action */}
            <button
              onClick={handleMediaClick}
              className="p-2 text-gray-500 hover:text-blue-500 hover:bg-gray-200 rounded-full transition-colors"
              title="Upload Media"
            >
              <Image size={20} />
            </button>

            {/* Audio Action */}
            <button
              onClick={handleAudioRecording}
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-200 rounded-full transition-colors"
              title="Record Audio"
            >
              <Mic size={20} />
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={newMessage}
              onChange={handleTypingEvent}
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-500 px-2"
            />

            {/* Send Button */}
            <button
              onClick={() => handleSendMessage()}
              disabled={isUploading || !newMessage.trim()}
              className={`p-2 rounded-full transition-colors ${isUploading || !newMessage.trim()
                ? "text-gray-400 cursor-not-allowed"
                : "text-blue-500 hover:bg-blue-100"
                }`}
              title="Send Message"
            >
              <Send size={20} />
            </button>
          </div>

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


      {/* kjbknkn */}

    </>
  );
};

export default ChatContainer;