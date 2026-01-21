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

const Sidebar = () => {
  const accessToken = localStorage.getItem("accessToken");
  const { currentUser: loggedInUser, logout } = useAuth();
  const { users: otherUsers, loading } = useUserStore(accessToken);
  const { recentMessages } = useRecentMessages(loggedInUser, accessToken);

  const [search, setSearch] = useState("");
  const onlineUsers = useOnlineUsers();
  const { userId } = useParams();

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
        />
      </div>
    </>
  );
};

export default Sidebar;