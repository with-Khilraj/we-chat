import React, { useState, useEffect } from "react";
import "../styles/sidebar.css";
import { fetchUserExceptCurrent } from "./userStore";

const Sidebar = ({ onUserSelect, setOnUserSelected }) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const getUserExceptCurrent = async () => {
      try {
        const response = await fetchUserExceptCurrent(accessToken);
        setUsers(response);
      } catch (error) {
        console.log("Error fetching user expect current:", error);
      }
    };
    getUserExceptCurrent();
  }, []);

  // Filter users based on the search input
  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="sidebar">
      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search"
          className="search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Users List */}
      <div className="user-list">
        {filteredUsers.map((user) => (
          <div
            key={user._id}
            className= {`user-item ${onUserSelect?._id === user._id ? "selected" : "" }`}
            onClick={() => setOnUserSelected(user)} // passing selected user
          >
            <div className="user-avatar">
              {/* Display initials or profile image */}
              {user.avatar ? (
                <img src={user.avatar} alt={user.username} />
              ) : (
                <span>{user.username.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="user-info">
              <h4 className="user-name">{user.username}</h4>
              <p className="user-message">Recent message or status...</p>
            </div>
            {/* <div className="user-meta">
              <span className="time">20m</span>
              {index % 3 === 0 ? (
                <span className="notification-count">3</span>
              ) : (
                <span className="message-status">✔✔</span>
              )}
            </div> */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
