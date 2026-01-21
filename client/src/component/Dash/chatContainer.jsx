import React from "react";
import moment from "moment";
import "../../styles/chatContainer.css";
import "../../styles/chatContainerExtensions.css"
import { useOnlineUsers } from "../../context/onlineUsersContext";
import { useChat } from "../../hooks/useChat";
import { shouldDisplayTimeStamp, shouldStartNewGroup, renderStatusIndicator } from "../../utils/chatUtils";
import { Image, Mic, Send, Info, Video, Phone, X, Plus, Reply, Smile, MoreVertical } from "lucide-react";
import { useCall } from "../../context/CallContext";

import { useParams, useOutletContext } from "react-router-dom";
import { useState, useEffect } from "react";
import { api } from "../../Api";
import AudioRecordingBar from "./AudioRecordingBar";
import AudioWaveform from "./AudioWaveform";

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
    //audio recording
    audioRecordingState,
    audioDuration,
    audioCurrentTime,
    startAudioRecording,
    stopAudioRecording,
    cancelAudioRecording,
    playAudioPreview,
    pauseAudioPreview,
    sendAudioMessage,
    replyingTo,
    setReplyingTo,
    cancelReply,
    handleReaction,
    activeEmojiPicker,
    setActiveEmojiPicker,
    emojiPickerRef,
    typingUsername,
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
            // Step 1: Group messages by sender AND time proximity (5-minute window)
            const timeBasedGroups = [];
            let currentGroup = null;

            messages.forEach((msg) => {
              // Start a new group if sender changes OR time gap >= 5 minutes
              if (!currentGroup || shouldStartNewGroup(msg, currentGroup.messages[currentGroup.messages.length - 1])) {
                if (currentGroup) timeBasedGroups.push(currentGroup);
                currentGroup = {
                  id: msg._id || msg.tempId,
                  senderId: msg.senderId,
                  messages: [msg],
                  createdAt: msg.createdAt
                };
              } else {
                currentGroup.messages.push(msg);
              }
            });
            if (currentGroup) timeBasedGroups.push(currentGroup);

            // Step 2: Render each time-based group
            return timeBasedGroups.map((group, groupIndex) => {
              const prevGroup = timeBasedGroups[groupIndex - 1];
              const isCurrentUser = group.senderId === currentUser._id;
              const senderUser = isCurrentUser ? currentUser : selectedUser;

              // Show timestamp if there's a 30+ minute gap
              const showTimeStamp = shouldDisplayTimeStamp(group.messages[0], prevGroup?.messages[prevGroup.messages.length - 1]);

              return (
                <div key={group.id || groupIndex} className="message-block">
                  {/* Centered Timestamp Divider */}
                  {showTimeStamp && (
                    <div className="message-timestamp">
                      {moment(group.createdAt).format("D MMM YYYY, HH:mm")}
                    </div>
                  )}

                  {/* Message Group Container */}
                  <div className={`message-group ${isCurrentUser ? "sent" : "received"}`}>
                    {/* Render all messages in this time-based group */}
                    {group.messages.map((message, msgIndex) => {
                      const isLastInGroup = msgIndex === group.messages.length - 1;

                      // Find parent message for reply
                      const parentMessage = message.replyTo ? messages.find(m => m._id === message.replyTo) : null;


                      return (
                        <div key={message._id || message.tempId || msgIndex} className="message-row">
                          {/* Avatar Slot for Received Messages */}
                          {!isCurrentUser && (
                            <div className="avatar-slot">
                              {isLastInGroup ? (
                                <div className="message-avatar">
                                  {senderUser.avatar ? (
                                    <img src={senderUser.avatar} alt="" />
                                  ) : (
                                    <span className="message-initial">
                                      {senderUser.username.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="avatar-placeholder"></div>
                              )}
                            </div>
                          )}

                          {/* Message Bubble */}
                          <div
                            className={`message-container ${isCurrentUser ? "sent" : "received"} message-type-${message.messageType}`}
                            onDoubleClick={() => handleReaction(message._id, '❤️')}
                            style={{ cursor: 'pointer' }}
                          >

                            {/* Reply Preview Bubble */}
                            {parentMessage && (
                              <div className="reply-preview-bubble">
                                <div className="reply-preview-bar"></div>
                                <div className="reply-preview-content">
                                  <span className="reply-to-name">
                                    {parentMessage.senderId === currentUser._id ? "You" : selectedUser.username} replied
                                  </span>
                                  <p className="reply-text-truncate">
                                    {parentMessage.messageType === 'text' ? parentMessage.content : `[${parentMessage.messageType}]`}
                                  </p>
                                </div>
                              </div>
                            )}

                            <div className="message">
                              <div className="message-content">
                                {/* Text Message */}
                                {message.messageType === "text" && (
                                  <p className="text-message">{message.content}</p>
                                )}

                                {/* Photo Message */}
                                {message.messageType === "photo" && (
                                  <div className="for-photo">
                                    <img src={message.fileUrl} alt={message.fileName} className="media-message" />
                                  </div>
                                )}

                                {/* Video Message */}
                                {message.messageType === "video" && (
                                  <div>
                                    <video controls src={message.fileUrl} className="video-message" />
                                  </div>
                                )}

                                {/* Audio Message */}
                                {message.messageType === "audio" && (
                                  <AudioWaveform
                                    audioUrl={message.fileUrl}
                                    isCurrentUser={isCurrentUser}
                                  />
                                )}

                                {/* File Message */}
                                {message.messageType === "file" && (
                                  <div>
                                    <a href={message.fileUrl} download={message.fileName} className="file-message">
                                      {message.fileName}
                                    </a>
                                  </div>
                                )}


                              </div>

                              {/* Reactions Display */}
                              {message.reactions && message.reactions.length > 0 && (
                                <div className="message-reactions">
                                  {message.reactions.map((reaction, i) => (
                                    <span key={i} className="reaction-emoji">{reaction.emoji}</span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Hover Icons (For BOTH Sent and Received) */}
                            <div className={`message-hover-icons ${isCurrentUser ? 'left-side' : 'right-side'}`}>
                              <div className="hover-icon-group">
                                {/* Emoji Picker Popover (Click-based) */}
                                <div className="emoji-popover-wrapper" ref={activeEmojiPicker === message._id ? emojiPickerRef : null}>
                                  <button
                                    className="icon-button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveEmojiPicker(activeEmojiPicker === message._id ? null : message._id);
                                    }}
                                  >
                                    <Smile size={16} />
                                  </button>
                                  {activeEmojiPicker === message._id && (
                                    <div className="emoji-popover active">
                                      {['❤️', '😂', '😮', '😢', '😡', '👍'].map(emoji => (
                                        <span key={emoji} onClick={() => handleReaction(message._id, emoji)}>{emoji}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <button className="icon-button" onClick={() => setReplyingTo(message)}>
                                  <Reply size={16} />
                                </button>

                                <button className="icon-button">
                                  <MoreVertical size={16} />
                                </button>
                              </div>
                            </div>

                            {/* Status Indicator (for sent messages) */}
                            {isCurrentUser && (
                              <div className="message-status inside">
                                {renderStatusIndicator(message.status)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}

          {/* Add typing indicator */}
          {isOtherUserTyping && (
            <div className="typing-indicator received">
              <span className="typing-username">{typingUsername || selectedUser?.username} is typing...</span>
            </div>
          )}
          <div ref={messageEndRef}></div>
        </div>

        {/* message input */}
        <div className="p-4 bg-white border-t border-gray-200">

          {/* Reply Banner */}
          {replyingTo && (
            <div className="reply-banner">
              <div className="flex justify-between items-center w-full px-4 py-2 bg-gray-50 rounded-t-lg border-b border-gray-200">
                <div className="flex flex-col">
                  <span className="text-xs text-blue-500 font-semibold">
                    Replying to {replyingTo.senderId === currentUser._id ? "yourself" : selectedUser.username}
                  </span>
                  <span className="text-sm text-gray-600 truncate max-w-xs">
                    {replyingTo.messageType === 'text' ? replyingTo.content : `[${replyingTo.messageType}]`}
                  </span>
                </div>
                <button onClick={cancelReply} className="text-gray-500 hover:text-gray-700">
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Media Staging Preview */}
          {selectedFiles.length > 0 && (
            <div className="flex gap-2 p-2 mb-2 overflow-x-auto bg-gray-50 rounded-lg border border-gray-100 scrollbar-hide">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors"
              >
                <Plus size={24} className="text-gray-600" />
              </button>
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg overflow-hidden border border-gray-300 group shadow-lg">
                  {file.type.startsWith('image') ? (
                    <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-center p-1 break-words text-gray-700">
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

          {/* Conditional Rendering: Audio Recording UI or Normal Input */}
          {audioRecordingState !== 'idle' ? (
            <AudioRecordingBar
              state={audioRecordingState}
              duration={audioDuration}
              currentTime={audioCurrentTime}
              onCancel={cancelAudioRecording}
              onStop={stopAudioRecording}
              onPlay={playAudioPreview}
              onPause={pauseAudioPreview}
              onSend={sendAudioMessage}
            />
          ) : (
            <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
              {/* Media Action */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:text-blue-500 hover:bg-gray-200 rounded-full transition-colors"
                title="Upload Media"
              >
                <Image size={20} />
              </button>

              {/* Audio Action */}
              <button
                onClick={startAudioRecording}
                className="p-2 text-gray-500 hover:text-red-500 hover:bg-white/5 rounded-full transition-colors"
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
                className={`p-2.5 rounded-full transition-colors shadow-lg ${isUploading || (!newMessage.trim() && selectedFiles.length === 0)
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-500 hover:bg-blue-100"
                  }`}
                title="Send Message"
              >
                <Send size={20} />
              </button>
            </div>
          )}

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