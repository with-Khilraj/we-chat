import React from "react";
import { useNavigate } from "react-router-dom";
import SidebarUserItem from "./SidebarUserItem";
import { MessageSquareDashed, UserPlus, SearchX } from "lucide-react";

/* Responsible for mapping the filtered user list to individual SidebarUserItem components.*/

const SidebarList = ({
    filteredUsers,
    userId,
    recentMessages,
    onlineUsers,
    typingUsers = new Map(),
    userDrafts = {},
    activeTab,
    setActiveTab
}) => {
    const navigate = useNavigate();

    const handleUserClick = (targetUserId) => {
        setActiveTab('chats');
        navigate(`chat/${targetUserId}`);
    };

    const renderEmptyState = () => {
        if (activeTab === 'chats') {
            return (
                <div className="empty-state">
                    <div className="empty-icon-container">
                        <MessageSquareDashed size={48} className="empty-icon" />
                    </div>
                    <h3>No active chats yet</h3>
                    <p>Start a new conversation from your contacts!</p>
                </div>
            );
        } else {
            return (
                <div className="empty-state">
                    <div className="empty-icon-container">
                        <UserPlus size={48} className="empty-icon" />
                    </div>
                    <h3>No contacts found</h3>
                    <p>Invite your friends to start chatting!</p>
                </div>
            );
        }
    };

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
                        onClick={() => handleUserClick(user._id)}
                    />
                ))
            ) : (
                renderEmptyState()
            )}
        </div >
    );
};

export default SidebarList;
