import React from "react";
import { X, Bell, Calendar, TrendingUp, Archive, FileText, Globe, ExternalLink } from "lucide-react";

const ProfileSidebar = ({ 
    selectedUser, 
    showProfileInfo, 
    toggleProfileInfo,
    isOnline,
    sharedMedia = [],
    sharedFiles = [],
    sharedLinks = []
}) => {
    if (!selectedUser) return null;

    return (
        <div className={`profile-info ${showProfileInfo ? 'show' : ''}`}>
            <div className="profile-header">
                <h2>Chat Details</h2>
                <button className="close-btn" onClick={toggleProfileInfo} title="Close">
                    <X size={20} />
                </button>
            </div>

            <div className="profile-content">
                {/* User Info Section */}
                <div className="profile-avatar-section">
                    <div className="profile-avatar-large">
                        {selectedUser.avatar ? (
                            <img src={selectedUser.avatar} alt={selectedUser.username} />
                        ) : (
                            <span className="user-initial">
                                {selectedUser.username.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                    <h1 className="profile-name">{selectedUser.username}</h1>
                    <p className={`profile-status ${isOnline ? 'online' : 'offline'}`}>
                        {isOnline ? 'Active now' : 'Offline'}
                    </p>
                    <h2 className="bio">{selectedUser.bio}</h2>
                </div>

                {/* Quick Action Icons Row */}
                <div className="profile-actions">
                    <div className="action-item">
                        <button className="action-btn" title="Mute Notifications">
                            <Bell size={18} />
                        </button>
                    </div>
                    <div className="action-item">
                        <button className="action-btn" title="Schedule">
                            <Calendar size={18} />
                        </button>
                    </div>
                    <div className="action-item">
                        <button className="action-btn" title="Statistics">
                            <TrendingUp size={18} />
                        </button>
                    </div>
                    <div className="action-item">
                        <button className="action-btn danger" title="Archive Chat">
                            <Archive size={18} />
                        </button>
                    </div>
                </div>

                {/* Photos and Videos Section */}
                <div className="sidebar-section">
                    <div className="section-header">
                        <h3>Photos and Videos <span>{sharedMedia.length}</span></h3>
                        {sharedMedia.length > 0 && <a href="#see-all" className="see-all">See all</a>}
                    </div>
                    {sharedMedia.length > 0 ? (
                        <div className="media-grid">
                            {sharedMedia.slice(0, 4).map((msg, idx) => (
                                <div key={msg._id || idx} className="media-item">
                                    <img src={msg.fileUrl} alt={msg.fileName} />
                                    {msg.messageType === 'video' && msg.duration && (
                                        <span className="video-duration">{msg.duration}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="empty-section">No photos or videos</p>
                    )}
                </div>

                {/* Shared Files Section */}
                <div className="sidebar-section">
                    <div className="section-header">
                        <h3>Shared Files <span>{sharedFiles.length}</span></h3>
                        {sharedFiles.length > 0 && <a href="#see-all" className="see-all">See all</a>}
                    </div>
                    {sharedFiles.length > 0 ? (
                        <div className="item-list">
                            {sharedFiles.slice(0, 3).map((file, idx) => (
                                <div key={file._id || idx} className="list-item">
                                    <div className="item-icon">
                                        <FileText size={18} />
                                    </div>
                                    <div className="item-info">
                                        <div className="item-title">{file.fileName}</div>
                                        <div className="item-desc">{file.fileType?.split('/')[1]?.toUpperCase() || 'FILE'} • {(file.fileSize / 1024 / 1024).toFixed(1)} MB</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="empty-section">No shared files</p>
                    )}
                </div>

                {/* Shared Links Section */}
                <div className="sidebar-section">
                    <div className="section-header">
                        <h3>Shared Links <span>{sharedLinks.length}</span></h3>
                        {sharedLinks.length > 0 && <a href="#see-all" className="see-all">See all</a>}
                    </div>
                    {sharedLinks.length > 0 ? (
                        <div className="item-list">
                            {sharedLinks.slice(0, 3).map((link, idx) => (
                                <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="list-item">
                                    <div className="favicon">
                                        <img src={`https://www.google.com/s2/favicons?domain=${link.domain}&sz=64`} alt="favicon" />
                                    </div>
                                    <div className="item-info">
                                        <div className="item-title">{link.domain}</div>
                                        <div className="item-link">{link.url}</div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <p className="empty-section">No shared links</p>
                    )}
                </div>
            </div>
        </div>
    );
};


export default ProfileSidebar;

