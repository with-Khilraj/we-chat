import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { api } from "../../../api/apiClient";
import { useOnlineUsers } from "../../../context/onlineUsersContext";
import { useChat } from "../../../hooks/useChat";
import { renderStatusIndicator, shouldStartNewGroup } from "../../../utils/chatUtils";

// New specialized components
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ProfileSidebar from "./ProfileSidebar";

import "../../../styles/chatContainer.css";
import "../../../styles/chatContainerExtensions.css";

const ChatContainer = () => {
  const { currentUser } = useOutletContext();
  const { userId } = useParams();
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        setSelectedUser(null);
        return;
      }
      
      // Reset state immediately to force re-fetch and clear stale UI
      setSelectedUser(null);
      setLoadingUser(true);
      setError(null);

      try {
        const response = await api.get(`/api/users/${userId}`);
        setSelectedUser(response.data.user || response.data);
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setError("User not found");
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, [userId]);

  const {
    messages,
    newMessage,
    selectedFiles,
    removeSelectedFile,
    isUploading,
    showProfileInfo,
    isOtherUserTyping,
    fileInputRef,
    handleSendMessage,
    handleFileInputChange,
    handleTypingEvent,
    toggleProfileInfo,
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
    handleSetReplyingTo,
    cancelReply,
    handleReaction,
    activeEmojiPicker,
    setActiveEmojiPicker,
    emojiPickerRef,
    typingUsername,
    hasMore,
    isLoadingMore,
    fetchMoreMessages,
  } = useChat(selectedUser, currentUser);

  // const { isCalling, initiateCall } = useCall();
  const onlineUsers = useOnlineUsers();

  const virtuosoRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showNewPill, setShowNewPill] = useState(false);
  const prevMessagesLength = useRef(messages.length);

  // Smart scroll logic for new messages
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      if (!isAtBottom) {
        setShowNewPill(true);
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length, isAtBottom]);

  // Memoize grouping to keep Virtuoso fast
  const messageGroups = useMemo(() => {
    const timeBasedGroups = [];
    let currentGroup = null;

    messages.forEach((msg) => {
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
    return timeBasedGroups;
  }, [messages]);

  // Extract shared data for ProfileSidebar
  const sharedMedia = useMemo(() => {
    return messages.filter(msg => msg.messageType === 'photo' || msg.messageType === 'video');
  }, [messages]);

  const sharedFiles = useMemo(() => {
    return messages.filter(msg => msg.messageType === 'file');
  }, [messages]);

  const sharedLinks = useMemo(() => {
    const links = [];
    messages.forEach(msg => {
      if (msg.messageType === 'text' && msg.content) {
        // Simple regex to find URLs
        const matches = msg.content.match(/(https?:\/\/[^\s]+)/g);
        if (matches) {
          matches.forEach(url => {
            links.push({
              url,
              domain: url.split('/')[2] || 'Link',
              createdAt: msg.createdAt
            });
          });
        }
      }
    });
    return links;
  }, [messages]);


  const handleStartReached = async () => {
    if (hasMore && !isLoadingMore) {
      await fetchMoreMessages();
    }
  };

  const scrollToBottom = () => {
    if (virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({
        index: messageGroups.length - 1,
        behavior: 'smooth'
      });
      setShowNewPill(false);
    }
  };

  if (loadingUser) return <div className="unselected-chat">Loading chat...</div>;
  if (!currentUser) return <div className="unselected-chat">Loading user data...</div>;
  if (!selectedUser) return <div className="unselected-chat">Select a user to start chatting!</div>;

  return (
    <div className={showProfileInfo ? 'chat-container shrink' : 'chat-container'}>
      <ChatHeader
        selectedUser={selectedUser}
        onlineUsers={onlineUsers}
        toggleProfileInfo={toggleProfileInfo}
      />

      <MessageList
        virtuosoRef={virtuosoRef}
        messageGroups={messageGroups}
        handleStartReached={handleStartReached}
        setIsAtBottom={setIsAtBottom}
        setShowNewPill={setShowNewPill}
        isLoadingMore={isLoadingMore}
        showNewPill={showNewPill}
        scrollToBottom={scrollToBottom}
        isOtherUserTyping={isOtherUserTyping}
        typingUsername={typingUsername}
        selectedUser={selectedUser}
        currentUser={currentUser}
        messages={messages}
        handleReaction={handleReaction}
        activeEmojiPicker={activeEmojiPicker}
        setActiveEmojiPicker={setActiveEmojiPicker}
        emojiPickerRef={emojiPickerRef}
        setReplyingTo={handleSetReplyingTo}
        renderStatusIndicator={renderStatusIndicator}
      />

      <MessageInput
        replyingTo={replyingTo}
        currentUser={currentUser}
        selectedUser={selectedUser}
        cancelReply={cancelReply}
        selectedFiles={selectedFiles}
        fileInputRef={fileInputRef}
        removeSelectedFile={removeSelectedFile}
        audioRecordingState={audioRecordingState}
        audioDuration={audioDuration}
        audioCurrentTime={audioCurrentTime}
        cancelAudioRecording={cancelAudioRecording}
        stopAudioRecording={stopAudioRecording}
        playAudioPreview={playAudioPreview}
        pauseAudioPreview={pauseAudioPreview}
        sendAudioMessage={sendAudioMessage}
        newMessage={newMessage}
        handleTypingEvent={handleTypingEvent}
        isUploading={isUploading}
        handleSendMessage={handleSendMessage}
        handleFileInputChange={handleFileInputChange}
        startAudioRecording={startAudioRecording}
      />

      <ProfileSidebar
        selectedUser={selectedUser}
        showProfileInfo={showProfileInfo}
        toggleProfileInfo={toggleProfileInfo}
        isOnline={onlineUsers.includes(selectedUser._id)}
        sharedMedia={sharedMedia}
        sharedFiles={sharedFiles}
        sharedLinks={sharedLinks}
      />
    </div>
  );
};

export default ChatContainer;