import React from "react";
import { Video, Phone, Info } from "lucide-react";

const ChatHeader = ({ selectedUser, onlineUsers, isCalling, initiateCall, toggleProfileInfo, localStream, remoteStream }) => {
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
                <button className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600">
                    <Video size={20} />
                </button>

                <button
                    onClick={() => initiateCall(selectedUser)}
                    disabled={isCalling}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 disabled:opacity-50"
                >
                    <Phone size={20} />
                </button>

                {localStream && <audio ref={(ref) => ref && (ref.srcObject = localStream)} muted autoPlay />}
                {remoteStream && <audio ref={(ref) => ref && (ref.srcObject = remoteStream)} autoPlay />}

                <button className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600" onClick={toggleProfileInfo}>
                    <Info size={20} />
                </button>
            </div>
        </div>
    );
};

export default ChatHeader;
