import React from "react";
import { useNavigate } from "react-router-dom";

const SidebarList = ({
    filteredUsers,
    userId,
    recentMessages,
    onlineUsers,
    typingUsers = new Map(), // Add typingUsers prop
}) => {
    const navigate = useNavigate();

    // Helper: turncate the message content
    const truncateMessage = (content = "", maxLength = 25) => {
        return content.length > maxLength
            ? `${content.substring(0, maxLength)}...`
            : content;
    };

    // take a timestamp and return a formatted string based on the time difference
    const formatTimestamp = (timestamp) => {
        const now = new Date();
        const messageTimestamp = new Date(timestamp);
        const diffInSeconds = Math.abs(now - messageTimestamp) / 1000;

        const intervals = {
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60,
        };

        // calcutate the time difference in weeks, day, hours and minutes
        if (diffInSeconds >= intervals.week) {
            const weeks = Math.floor(diffInSeconds / intervals.week);
            return `${weeks}w`;
        } else if (diffInSeconds >= intervals.day) {
            const days = Math.floor(diffInSeconds / intervals.day);
            return `${days}d`;
        } else if (diffInSeconds >= intervals.hour) {
            const hours = Math.floor(diffInSeconds / intervals.hour);
            return `${hours}h`;
        } else if (diffInSeconds >= intervals.minute) {
            const minutes = Math.floor(diffInSeconds / intervals.minute);
            return `${minutes}m`;
        } else {
            return "just now";
        }
    };

    return (
        <div className="user-list">
            {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                    <div
                        key={user._id}
                        className={`user-item ${userId === user._id ? "selected" : ""} 
                  ${!recentMessages[user._id]?.seen && recentMessages[user._id] ? "unread" : ""
                            }`}
                        onClick={() => navigate(`chat/${user._id}`)} // passing selected user
                    >
                        <div className="user-avatar">
                            {/* Display initials or profile image */}
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.username} />
                            ) : (
                                <span>{user.username.charAt(0).toUpperCase() || "U"}</span>
                            )}
                            {/* Oline Indicator */}
                            {onlineUsers.includes(user._id) && (
                                <span className="online-indicator"></span>
                            )}
                        </div>
                        <div className="user-info-sidebar">
                            <h4 className="user-name">{user.username}</h4>

                            {/* Show typing indicator if user is typing */}
                            {typingUsers.has(user._id) ? (
                                <p className="user-typing">typing...</p>
                            ) : (
                                <div className="user-message-container">
                                    {recentMessages[user._id]?.unreadCount > 2 ? (
                                        <span className="unread-count">
                                            {recentMessages[user._id].unreadCount} new messages
                                        </span>
                                    ) : (
                                        <p className="user-message">
                                            {truncateMessage(recentMessages[user._id]?.message) ||
                                                "No messages yet"}
                                        </p>
                                    )}

                                    {recentMessages[user._id] && (
                                        <>
                                            <span className="sidebar-message-timestamp">
                                                {formatTimestamp(recentMessages[user._id].timestamp)}
                                            </span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        {!recentMessages[user._id]?.seen && recentMessages[user._id] && (
                            <span className="blue-dot"></span>
                        )}
                    </div>
                ))
            ) : (
                <p className="no-users-message">No users found</p>
            )}
        </div>
    );
};

export default SidebarList;
