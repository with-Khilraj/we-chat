import React, { useState, useMemo, useEffect } from "react";
import "../../../styles/sidebar.css";
import { useUserStore } from "../../../hooks/useUserStore";
import { useAuth } from "../../../context/AuthContext";
import { useRecentMessages } from "../../../hooks/useRecentMessages";
import { debounce } from "lodash";
import { useOnlineUsers } from "../../../context/onlineUsersContext";
import { useParams } from "react-router-dom";
import SidebarMenu from "./SidebarMenu";
import SidebarSearch from "./SidebarSearch";
import SidebarList from "./SidebarList";
import socket from "../../../utils/useSocket";

const Sidebar = () => {
  const accessToken = localStorage.getItem("accessToken");
  const { currentUser: loggedInUser, logout } = useAuth();
  const { users: otherUsers, loading } = useUserStore(accessToken);
  const { recentMessages } = useRecentMessages(loggedInUser, accessToken);

  const [search, setSearch] = useState("");
  const onlineUsers = useOnlineUsers();
  const { userId } = useParams();

  // Track typing users globally
  const [typingUsers, setTypingUsers] = useState(new Map());

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

  // Listen for typing events from all users
  useEffect(() => {
    const handleTyping = (data) => {
      if (data.isTyping && data.username) {
        // Extract userId from roomId (format: userId1-userId2)
        const [user1, user2] = data.roomId.split('-');
        // Determine which user is typing (not the logged-in user)
        const typingUserId = user1 === loggedInUser._id ? user2 : user1;

        setTypingUsers(prev => {
          const newMap = new Map(prev);
          newMap.set(typingUserId, data.username);
          return newMap;
        });
      } else if (data.roomId) {
        // User stopped typing
        const [user1, user2] = data.roomId.split('-');
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          newMap.delete(user1);
          newMap.delete(user2);
          return newMap;
        });
      }
    };

    socket.on('typing', handleTyping);

    return () => {
      socket.off('typing', handleTyping);
    };
  }, [loggedInUser]);

  if (loading) {
    return <div className="sidebar">Loading...</div>;
  }

  return (
    <>
      <SidebarMenu />

      <div className="sidebar">
        {/* Search Bar */}
        <SidebarSearch search={search} onSearchChange={debounceSetSearch} />

        {/* Users List */}
        <SidebarList
          filteredUsers={filteredUsers}
          userId={userId}
          recentMessages={recentMessages}
          onlineUsers={onlineUsers}
          currentUserId={loggedInUser?._id}
          typingUsers={typingUsers}
        />
      </div>
    </>
  );
};

export default Sidebar;