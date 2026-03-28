import React, { useState, useRef, useEffect, useCallback } from "react";
import { Settings, ShieldAlert, LogOut, MoreVertical, Bell, Contact, MessageCircleCodeIcon, Phone } from "lucide-react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { toast } from "react-toastify";

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
                <NavLink
                    to="/dashboard/chats"
                    className={({ isActive }) => `menu-icon ${isActive ? 'active' : ''}`}
                    title="Chats"
                >
                    <MessageCircleCodeIcon size={24} />
                </NavLink>
                <NavLink
                    to="/dashboard/contacts"
                    className={({ isActive }) => `menu-icon ${isActive ? 'active' : ''}`}
                    title="Contacts"
                >
                    <Contact size={24} />
                </NavLink>
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
                    <li onClick={logout}>
                        <LogOut size={18} />
                        <span>Logout</span>
                    </li>
                </ul>
            </div>
        </div>
    )
}

export default SidebarMenu;