import React, { memo } from "react";
import { truncateMessage, formatRelativeTime } from "../../../utils/formatters";

const SidebarUserItem = memo(({
    user,
    isSelected,
    recentMessage,
    isOnline,
    typingData,
    draft,
    onClick
}) => {
    const { username, avatar, _id } = user;
    const hasUnread = recentMessage && !recentMessage.seen;

    return (
        <div
            className={`user-item ${isSelected ? "selected" : ""} ${hasUnread ? "unread" : ""}`}
            onClick={onClick}
        >
            <div className="user-avatar">
                {avatar ? (
                    <img src={avatar} alt={username} />
                ) : (
                    <span>{username.charAt(0).toUpperCase() || "U"}</span>
                )}
                {isOnline && <span className="online-indicator"></span>}
            </div>

            <div className="user-info-sidebar">
                <h4 className="user-name">{username}</h4>

                {/* Priority display logic: Typing > Draft > Last Message */}
                {typingData ? (
                    <p className="user-typing">typing...</p>
                ) : draft ? (
                    <p className="user-draft">
                        <span className="draft-label">Draft:</span> {truncateMessage(draft, 20)}
                    </p>
                ) : (
                    <div className="user-message-container">
                        {recentMessage?.unreadCount > 2 ? (
                            <span className="unread-count">
                                {recentMessage.unreadCount} new messages
                            </span>
                        ) : (
                            <p className="user-message">
                                {truncateMessage(recentMessage?.message) || "No messages yet"}
                            </p>
                        )}

                        {recentMessage && (
                            <span className="sidebar-message-timestamp">
                                {formatRelativeTime(recentMessage.timestamp)}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {hasUnread && <span className="blue-dot"></span>}
        </div>
    );
});

export default SidebarUserItem;
