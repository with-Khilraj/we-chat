import React from "react";
import { Virtuoso } from "react-virtuoso";
import { ArrowDown } from "lucide-react";
import moment from "moment";
import MessageItem from "./MessageItem";
import { shouldDisplayTimeStamp } from "../../../utils/chatUtils";

const MessageList = ({
    virtuosoRef,
    messageGroups,
    handleStartReached,
    setIsAtBottom,
    setShowNewPill,
    isLoadingMore,
    showNewPill,
    scrollToBottom,
    isOtherUserTyping,
    typingUsername,
    selectedUser,
    currentUser,
    messages,
    handleReaction,
    activeEmojiPicker,
    setActiveEmojiPicker,
    emojiPickerRef,
    setReplyingTo,
    renderStatusIndicator
}) => {
    return (
        <div className="chat-messages-wrapper" style={{ height: '100%', flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <Virtuoso
                ref={virtuosoRef}
                data={messageGroups}
                style={{ flex: 1 }}
                initialTopMostItemIndex={messageGroups.length - 1}
                startReached={handleStartReached}
                atBottomStateChange={(atBottom) => {
                    setIsAtBottom(atBottom);
                    if (atBottom) setShowNewPill(false);
                }}
                atBottomThreshold={100}
                followOutput="auto"
                alignToBottom
                components={{
                    Header: () => (
                        <>
                            {isLoadingMore && (
                                <div className="flex justify-center p-2">
                                    <span className="text-xs text-gray-400">Loading older messages...</span>
                                </div>
                            )}
                        </>
                    ),
                    Footer: () => <div style={{ height: '20px' }} />
                }}
                itemContent={(index, group) => {
                    const prevGroup = messageGroups[index - 1];
                    const isCurrentUser = group.senderId === currentUser._id;
                    const senderUser = isCurrentUser ? currentUser : selectedUser;
                    const showTimeStamp = shouldDisplayTimeStamp(group.messages[0], prevGroup?.messages[prevGroup.messages.length - 1]);

                    return (
                        <div key={group.id || index} className="message-block" style={{ padding: '0 10px' }}>
                            {showTimeStamp && (
                                <div className="message-timestamp">
                                    {moment(group.createdAt).format("D MMM YYYY, HH:mm")}
                                </div>
                            )}

                            <div className={`message-group ${isCurrentUser ? "sent" : "received"}`}>
                                {group.messages.map((message, msgIndex) => (
                                    <MessageItem
                                        key={message._id || message.tempId || msgIndex}
                                        message={message}
                                        isCurrentUser={isCurrentUser}
                                        senderUser={senderUser}
                                        isLastInGroup={msgIndex === group.messages.length - 1}
                                        currentUser={currentUser}
                                        selectedUser={selectedUser}
                                        messages={messages}
                                        handleReaction={handleReaction}
                                        activeEmojiPicker={activeEmojiPicker}
                                        setActiveEmojiPicker={setActiveEmojiPicker}
                                        emojiPickerRef={emojiPickerRef}
                                        setReplyingTo={setReplyingTo}
                                        renderStatusIndicator={renderStatusIndicator}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                }}
            />

            {showNewPill && (
                <button className="new-messages-pill" onClick={scrollToBottom}>
                    <ArrowDown size={16} />
                    New Messages
                </button>
            )}

            {isOtherUserTyping && (
                <div className="typing-indicator received" style={{ padding: '10px' }}>
                    <span className="typing-username">{typingUsername || selectedUser?.username} is typing...</span>
                </div>
            )}
        </div>
    );
};

export default MessageList;
