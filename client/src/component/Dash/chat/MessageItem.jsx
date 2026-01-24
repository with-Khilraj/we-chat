import React from "react";
import AudioWaveform from "./AudioWaveform";
import { Smile, Reply, MoreVertical } from "lucide-react";

const MessageItem = ({
    message,
    isCurrentUser,
    senderUser,
    isLastInGroup,
    currentUser,
    selectedUser,
    messages,
    handleReaction,
    activeEmojiPicker,
    setActiveEmojiPicker,
    emojiPickerRef,
    setReplyingTo,
    renderStatusIndicator
}) => {
    const parentMessage = message.replyTo ? messages.find(m => m._id === message.replyTo) : null;

    return (
        <div className="message-row">
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

            <div
                className={`message-container ${isCurrentUser ? "sent" : "received"} message-type-${message.messageType}`}
                onDoubleClick={() => handleReaction(message._id, '❤️')}
                style={{ cursor: 'pointer' }}
            >
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
                            <AudioWaveform audioUrl={message.fileUrl} isCurrentUser={isCurrentUser} />
                        )}
                        {message.messageType === "file" && (
                            <div>
                                <a href={message.fileUrl} download={message.fileName} className="file-message">
                                    {message.fileName}
                                </a>
                            </div>
                        )}
                    </div>

                    {message.reactions && message.reactions.length > 0 && (
                        <div className="message-reactions">
                            {message.reactions.map((reaction, i) => (
                                <span key={i} className="reaction-emoji">{reaction.emoji}</span>
                            ))}
                        </div>
                    )}
                </div>

                <div className={`message-hover-icons ${isCurrentUser ? 'left-side' : 'right-side'}`}>
                    <div className="hover-icon-group">
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

                {isCurrentUser && (
                    <div className="message-status inside">
                        {renderStatusIndicator(message.status)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageItem;
