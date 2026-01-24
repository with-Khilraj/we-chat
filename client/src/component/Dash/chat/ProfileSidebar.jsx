import React from "react";

const ProfileSidebar = ({ selectedUser, showProfileInfo }) => {
    return (
        <div className={`profile-info ${showProfileInfo ? 'show' : ''}`}>
            <div className="profile-pic">
                {selectedUser && (
                    <div className="user-profile-pic">
                        {selectedUser.avatar ? (
                            <img src={selectedUser.avatar} alt="" />
                        ) : (
                            <span className="user-initial-char">
                                {selectedUser.username.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="profile-user-name">
                {selectedUser && (
                    <h3>{selectedUser.username}</h3>
                )}
            </div>
            {/* Profile content goes here */}
            <p>Additional details about the current user...</p>
        </div>
    );
};

export default ProfileSidebar;
