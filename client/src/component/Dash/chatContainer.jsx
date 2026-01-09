import React from "react";
import moment from "moment";
import "../../styles/chatContainer.css";
import { useOnlineUsers } from "../../context/onlineUsersContext";
import { useChat } from "../../hooks/useChat";
import { shouldDisplayTimeStamp, shouldStartNewGroup, renderStatusIndicator } from "../../utils/chatUtils";
import { Image, Mic, Send, Info, Video, Phone, X, Plus } from "lucide-react";
import { useCall } from "../../context/CallContext";
// import { useCall } from "../context/CallContextInitial";

import { useParams, useOutletContext } from "react-router-dom";
import { useState, useEffect } from "react";
import { api } from "../../Api";
import MediaCluster from "./MediaCluster";

const ChatContainer = () => {
  const { currentUser } = useOutletContext();
  const { userId } = useParams();
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      setLoadingUser(true);
      try {
        const response = await api.get(`/api/users/${userId}`);
        setSelectedUser(response.data.user || response.data);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [userId]);

  const {
    messages,
    newMessage,
    setNewMessage,
    selectedFiles,
    removeSelectedFile,
    isUploading,
    isRecording,
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

  if (loadingUser) {
    return (
      <div className="unselected-chat">Loading chat...</div>
    );
  }

  if (!currentUser) {
    return (
      <div className="unselected-chat">Loading user data...</div>
    );
  }

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
          {(() => {
            // Group messages by type for clustering media
            const clusteredMessages = [];
            let currentCluster = null;

            messages.forEach((msg) => {
              const isMedia = ['photo', 'video'].includes(msg.messageType);

              if (currentCluster &&
                currentCluster.senderId === msg.senderId &&
                isMedia && currentCluster.isMedia) {
                currentCluster.messages.push(msg);
              } else {
                if (currentCluster) clusteredMessages.push(currentCluster);
                currentCluster = {
                  id: msg._id || msg.tempId,
                  senderId: msg.senderId,
                  isMedia, // Only true if it's photo/video
                  messages: [msg],
                  createdAt: msg.createdAt
                };
              }
            });
            if (currentCluster) clusteredMessages.push(currentCluster);

            return clusteredMessages.map((cluster, clusterIndex) => {
              const isCurrentUser = cluster.senderId === currentUser._id;
              const senderUser = isCurrentUser ? currentUser : selectedUser;
              const nextCluster = clusteredMessages[clusterIndex + 1];
              const prevCluster = clusteredMessages[clusterIndex - 1];

              // Determine if this cluster is the end of a sequence from this user
              const isLastBlockOfGroup = !nextCluster || nextCluster.senderId !== cluster.senderId;

              // Timestamp is based on the first message of the cluster vs previous cluster last message
              const showTimeStamp = shouldDisplayTimeStamp(cluster.messages[0], prevCluster?.messages[prevCluster.messages.length - 1]);

              // If it's a media cluster with MULTIPLE images -> Render Grid/Cluster
              if (cluster.isMedia && cluster.messages.length > 1) {
                return (
                  <div key={cluster.id}>
                    {showTimeStamp && (
                      <div className="message-timestamp">
                        {moment(cluster.createdAt || Date.now()).format("D MMM YYYY, HH:mm")}
                      </div>
                    )}

                    <div className={`message-group ${isCurrentUser ? "sent" : "received"}`}>
                      {/* Avatar logic for received messages */}
                      {!isCurrentUser && (
                        <div className={`avatar-content ${isLastBlockOfGroup ? '' : 'invisible'}`}>
                          {isLastBlockOfGroup && (
                            <div className="message-avatar">
                              {senderUser.avatar ? <img src={senderUser.avatar} alt="" /> : <span className="message-initial">{senderUser.username.charAt(0).toUpperCase()}</span>}
                            </div>
                          )}
                        </div>
                      )}

                      <MediaCluster
                        messages={cluster.messages}
                        isCurrentUser={isCurrentUser}
                      />
                    </div>
                  </div>
                );
              }

              // Standard rendering (Single messages or Non-grouped text)
              // Note: Our clustering logic puts text one-by-one, so we just render single message here.
              return cluster.messages.map((message, index) => {
                // Determine internal Last Message status for this specific message in case of single items
                const isLastMessageInCluster = index === cluster.messages.length - 1;
                // For avatar, we need to know if this is the LAST message of the sender's block.
                // It is if (this is the last cluster of group) AND (this is last message of cluster).
                const showAvatar = !isCurrentUser && isLastBlockOfGroup && isLastMessageInCluster;

                return (
                  <div key={index}>
                    {/* show timestamp if necessary (handled by cluster above mostly, but for single items logic is same) */}
                    {showTimeStamp && index === 0 && (
                      <div className="message-timestamp">
                        {moment(message.createdAt || Date.now()).format("D MMM YYYY, HH:mm")}
                      </div>
                    )}

                    <div className={`message-group ${isCurrentUser ? "sent" : "received"}`}>
                      {/* Avatar Slot */}
                      {!isCurrentUser && (
                        /* We only render the avatar container if it's the last message to maintain spacing/layout? 
                           Our CSS uses absolute positioning for avatar, but requires padding on .received group.
                           So we just render the avatar element itself conditionally.
                        */
                        showAvatar && (
                          <div className="avatar-content">
                            <div className="message-avatar">
                              {senderUser.avatar ? (
                                <img src={senderUser.avatar} alt="" />
                              ) : (
                                <span className="message-initial">{senderUser.username.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                          </div>
                        )
                      )}

                      {/* Message bubble */}
                      <div className={`message-container ${isCurrentUser ? "sent" : "received"} message-type-${message.messageType}`}>
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
                                  <span role="img" aria-label="React">❤️</span>
                                </button>
                                <button className="icon-button" >
                                  <span role="img" aria-label="Reply">↩️</span>
                                </button>
                                <button className="icon-button" >
                                  <span role="img" aria-label="More">⋮</span>
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
                )
              });
            });
          })()}

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

          {/* Media Staging Preview */}
          {selectedFiles.length > 0 && (
            <div className="flex gap-2 p-2 mb-2 overflow-x-auto bg-gray-50 rounded-lg border border-gray-100">
              <button onClick={handleMediaClick} className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors">
                <Plus size={24} className="text-gray-600" />
              </button>
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-300 group">
                  {file.type.startsWith('image') ? (
                    <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-center p-1 break-words bg-white text-gray-700">
                      {file.name.slice(0, 8)}...
                    </div>
                  )}
                  <button
                    onClick={() => removeSelectedFile(index)}
                    className="absolute top-0 right-0 bg-black bg-opacity-50 text-white rounded-bl p-1 hover:bg-red-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isUploading && (newMessage.trim() || selectedFiles.length > 0)) {
                  handleSendMessage();
                }
              }}
            />

            {/* Send Button */}
            <button
              onClick={() => handleSendMessage()}
              disabled={isUploading || (!newMessage.trim() && selectedFiles.length === 0)}
              className={`p-2 rounded-full transition-colors ${isUploading || (!newMessage.trim() && selectedFiles.length === 0)
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
            multiple
            accept="image/*, video/*, .pdf, .doc, .docx" // Allow photos, videos, and files
          />
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

      </div>
    </>
  );
};

export default ChatContainer;