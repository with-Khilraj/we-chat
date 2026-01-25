import React from "react";
import "../../../styles/sidebar.css";
import { useAuth } from "../../../context/AuthContext";
import { useTyping } from "../../../context/TypingContext";
import { useDrafts } from "../../../context/DraftContext";
import { useSidebarData } from "../../../hooks/useSidebarData";
import { useParams } from "react-router-dom";
import SidebarMenu from "./SidebarMenu";
import SidebarSearch from "./SidebarSearch";
import SidebarList from "./SidebarList";

/**
 * Sidebar Component (Container)
 * Orchestrates data from various hooks and context and passes it to presentation components.
 */
const Sidebar = () => {
  const { currentUser: loggedInUser } = useAuth();
  const { userId } = useParams();

  // Custom Hooks for business logic
  const {
    users,
    loading,
    recentMessages,
    onlineUsers,
    search,
    setSearch
  } = useSidebarData(loggedInUser);

  // Context for global real-time state
  const { typingUsers } = useTyping();
  const { userDrafts } = useDrafts();

  if (loading) {
    return <div className="sidebar">Loading...</div>;
  }

  return (
    <>
      <SidebarMenu />

      <div className="sidebar">
        {/* Search Bar */}
        <SidebarSearch search={search} onSearchChange={setSearch} />

        {/* Users List */}
        <SidebarList
          filteredUsers={users}
          userId={userId}
          recentMessages={recentMessages}
          onlineUsers={onlineUsers}
          typingUsers={typingUsers}
          userDrafts={userDrafts}
        />
      </div>
    </>
  );
};

export default Sidebar;