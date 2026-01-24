import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { api } from "../../../Api";
import { useOnlineUsers } from "../../../context/onlineUsersContext";
import { useChat } from "../../../hooks/useChat";
import { useCall } from "../../../context/CallContext";
import { renderStatusIndicator } from "../../../utils/chatUtils";

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
    setReplyingTo,
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

  const { isCalling, localStream, remoteStream, initiateCall } = useCall();
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
    const { shouldStartNewGroup } = require("../../../utils/chatUtils");

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
        isCalling={isCalling}
        initiateCall={initiateCall}
        toggleProfileInfo={toggleProfileInfo}
        localStream={localStream}
        remoteStream={remoteStream}
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
        setReplyingTo={setReplyingTo}
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
      />
    </div>
  );
};

export default ChatContainer;