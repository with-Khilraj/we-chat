import React from "react";
import { Info } from "lucide-react";
import CallButton from "../../call/CallButton";

const ChatHeader = ({ selectedUser, onlineUsers, toggleProfileInfo }) => {
    return (
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
                    <br />
                    {onlineUsers.includes(selectedUser._id) && (
                        <span className="online-status">Active now</span>
                    )}
                </h3>
            </div>

            <div className="flex items-center gap-2">
                <CallButton targetUser={selectedUser} type="video" />
                <CallButton targetUser={selectedUser} type="audio" />

                <button className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600" onClick={toggleProfileInfo}>
                    <Info size={20} />
                </button>
            </div>
        </div>
    );
};

export default ChatHeader;
