import React from "react";
import { useNavigate } from "react-router-dom";
import SidebarUserItem from "./SidebarUserItem";

/**
 * SidebarList Component
 * Responsible for mapping the filtered user list to individual SidebarUserItem components.
 */
const SidebarList = ({
    filteredUsers,
    userId,
    recentMessages,
    onlineUsers,
    typingUsers = new Map(),
    userDrafts = {},
}) => {
    const navigate = useNavigate();

    return (
        <div className="user-list">
            {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                    <SidebarUserItem
                        key={user._id}
                        user={user}
                        isSelected={userId === user._id}
                        recentMessage={recentMessages[user._id]}
                        isOnline={onlineUsers.includes(user._id)}
                        typingData={typingUsers.get(user._id)}
                        draft={userDrafts[user._id]}
                        onClick={() => navigate(`chat/${user._id}`)}
                    />
                ))
            ) : (
                <p className="no-users-message">No users found</p>
            )}
        </div >
    );
};

export default SidebarList;
