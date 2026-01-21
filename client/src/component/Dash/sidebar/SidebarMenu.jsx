import React, { useState, useRef, useEffect, useCallback } from "react";
import { Settings, ShieldAlert, LogOut, MoreVertical, Bell, User, MessageCircleCodeIcon, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../Api";
import { toast } from "react-toastify";
import socket from "../../../utils/useSocket";

const SidebarMenu = () => {
    const { currentUser: loggedInUser, logout } = useAuth();
    const navigate = useNavigate();
    const [isDropupOpen, setIsDropupOpen] = useState(false);
    const dropupRef = useRef(null);
    const moreMenuRef = useRef(null);

    const toggleDropup = (event) => {
        event.stopPropagation();
        setIsDropupOpen((prev) => !prev);
    }

    const handleClickOutside = useCallback((event) => {
        if (dropupRef.current &&
            !dropupRef.current.contains(event.target) &&
            !moreMenuRef.current.contains(event.target)) {
            setIsDropupOpen(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [handleClickOutside]);

    const handleLogout = async () => {
        try {
            await api.post("/api/users/logout");
            toast.success("Logout successful!", {
                position: "top-right",
                autoClose: 1500,
            });
        } catch (error) {
            console.error("Logout API failed (network or token issue):", error);
        } finally {
            // ALWAYS perform these cleanup steps
            logout(); // Use context logout to update state
            if (socket.connected) socket.disconnect();
            navigate("/login");
        }
    };

    return (
        <div className="sidebar-menu">
            <div className="user-profile" onClick={() => navigate('/profile')}>
                {/* Display initials or profile image */}
                {loggedInUser?.avatar ? (
                    <img src={loggedInUser.avatar} alt={loggedInUser?.username} />
                ) : (
                    <span>{loggedInUser?.username.charAt(0).toUpperCase() || "U"}</span>
                )}
            </div>

            <div className="menu-icons">
                <div className="menu-icon" onClick={() => toast.info("New Chat feature coming soon!")}>
                    <MessageCircleCodeIcon size={24} />
                </div>
                <div className="menu-icon" onClick={() => navigate('/profile')}>
                    <User size={24} />
                </div>
                <div className="menu-icon" onClick={() => toast.info("Call History feature coming soon!")}>
                    <Phone size={24} />
                </div>
                <div className="menu-icon" onClick={() => toast.info("Notifications feature coming soon!")}>
                    <Bell size={24} />
                </div>
            </div>

            <div className="more-menu" onClick={toggleDropup} ref={moreMenuRef}>
                <MoreVertical size={24} />
            </div>
            <div ref={dropupRef} className={`dropup-menu ${isDropupOpen ? 'open' : ''}`} >
                <ul>
                    <li onClick={() => navigate('')}>
                        <Settings size={18} />
                        <span>Settings</span>
                    </li>
                    <li onClick={() => navigate('')}>
                        <ShieldAlert size={18} />
                        <span>Report a problem</span>
                    </li>
                    <li onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>Logout</span>
                    </li>
                </ul>
            </div>
        </div>
    )
}

export default SidebarMenu;