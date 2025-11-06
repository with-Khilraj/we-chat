import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import "../styles/sidebar.css";
import { useUserStore } from "../hooks/useUserStore";
import { useAuth } from "../context/AuthContext";
import { useRecentMessages } from "../hooks/useRecentMessages";
import {api} from "../Api";
import socket from "../hooks/useSocket";
import { debounce, } from "lodash";
import { useOnlineUsers } from "../context/onlineUsersContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import menu from '../assets/menu.png';

const Sidebar = ({ selectedUser, setSelectedUser }) => {
  const accessToken = localStorage.getItem("accessToken");
  const { currentUser: loggedInUser } = useAuth();
  const { users: otherUsers, loading } = useUserStore(accessToken);
  const { recentMessages } = useRecentMessages(loggedInUser, accessToken);

  const [search, setSearch] = useState("");
  const onlineUsers = useOnlineUsers();
  const navigate = useNavigate();
  const dropupRef = useRef(null);
  const moreMenuRef = useRef(null);
  const [isDropupOpen, setIsDropupOpen] = useState(false);


  // Helper: turncate the message content
  const truncateMessage = (content = "", maxLength = 25) => {
    return content.length > maxLength
      ? `${content.substring(0, maxLength)}...`
      : content;
  };


  // Filter users based on the search input and sort the chat list based on the timestamp
  const filteredUsers = useMemo(() => {
    return otherUsers
      .filter((user) =>
        user.username.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        const timeA = recentMessages[a._id]?.timestamp || 0;
        const timeB = recentMessages[b._id]?.timestamp || 0;
        return timeB - timeA;
      });
  }, [otherUsers, search, recentMessages]);

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

  // adding debounce to the search input
  const debounceSetSearch = useMemo(
    () => debounce((value) => setSearch(value), 300),
    []
  );

  useEffect(() => {
    return () => {
      debounceSetSearch.cancel();
    };
  }, [debounceSetSearch]);

  // handling the logout event
  const handleLogout = async () => {
    try {
      // await logout();
      await api.post("/api/users/logout");
      localStorage.clear();

      // disconect the socket connection
      socket.disconnect();
      toast.success("Logout successful!", {
        position: "top-right",
        autoClose: 1500,
      });

      navigate("/login");
    } catch (error) {
      toast.error("Logout failed", {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

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


  if (loading) {
    return <div className="sidebar">Loading...</div>;
  }

  return (
    <>
      <div className="sidebar-menu">
        <div className="user-profile">
          {/* Display initials or profile image */}
          {loggedInUser?.avatar ? (
            <img src={loggedInUser.avatar} alt={loggedInUser?.username} />
          ) : (
            <span>{loggedInUser?.username.charAt(0).toUpperCase() || "U"}</span>
          )}
        </div>
        <div className="more-menu" onClick={toggleDropup} ref={moreMenuRef}>
          <img className="more-menu-img" src={menu} alt="more" />
        </div>
        <div ref={dropupRef} className={`dropup-menu ${isDropupOpen ? 'open' : ''}`} >
          <ul>
            <li onClick={() => navigate('')}>Settings</li>
            <li onClick={() => navigate('')}>Report a problem</li>
            <li onClick={handleLogout}>Logout</li>
          </ul>
        </div>
      </div>

      <div className="sidebar">
        {/* Search Bar */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Search"
            className="search-input"
            value={search}
            onChange={(e) => debounceSetSearch(e.target.value)}
          />
        </div>

        {/* Users List */}
        <div className="user-list">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div
                key={user._id}
                className={`user-item ${selectedUser?._id === user._id ? "selected" : ""} 
                  ${!recentMessages[user._id]?.seen && recentMessages[user._id] ? "unread" : ""
                  }`}
                onClick={() => setSelectedUser(user)} // passing selected user
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
                  <div className="user-message-container">
                    {recentMessages[user._id]?.unreadCount > 2 ? (
                      <span className="unread-count">
                        {recentMessages[user._id].unreadCount} new messages
                      </span>
                    ) : (
                      // <p className={`user-message ${!recentMessages[user._id]?.seen ? 'unseen' : ''}`}>
                      <p className="user-message">
                        {truncateMessage(recentMessages[user._id]?.message) ||
                          "No messages yet"}
                      </p>
                    )}

                    {recentMessages[user._id] && (
                      <>
                        <span className="message-timestamp">
                          {formatTimestamp(recentMessages[user._id].timestamp)}
                        </span>
                      </>
                    )}
                  </div>
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
      </div>
    </>
  );
};

export default Sidebar