import React, { useState, useEffect } from "react";
import "../styles/sidebar.css";
import { fetchUserData, fetchUserExceptCurrent } from "./userStore";
import api from "../Api";

const Sidebar = ({ onUserSelect, setOnUserSelected }) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [recentMessages, setRecentMessages] = useState({});
  const [loggedInUser, setLoggedInUser] = useState("");
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   const accessToken = localStorage.getItem("accessToken");

  //   const getUserData = async () => {
  //     try {
  //       const { _id } = await fetchUserData(accessToken);
  //       setLoggedInUser({ _id });
  //     } catch (error) {
  //       console.log("Error fetching username:", error);
  //     }
  //   };
  //   getUserData();
  // }, []);

  // useEffect(() => {
  //   const accessToken = localStorage.getItem("accessToken");

  //   const getUserExceptCurrent = async () => {
  //     try {
  //       const response = await fetchUserExceptCurrent(accessToken);
  //       setUsers(response);
  //     } catch (error) {
  //       console.log("Error fetching user expect current:", error);
  //     }
  //   };
  //   getUserExceptCurrent();
  // }, []);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    const fetchData = async () => {
      try {
        const [userData, userList] = await Promise.all([
          fetchUserData(accessToken),
          fetchUserExceptCurrent(accessToken),
        ]);
        setLoggedInUser(userData);
        setUsers(userList);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (loggedInUser) {
      // Fetch recent messages for each user
      const fetchRecentMessages = async () => {
        try {
          const accessToken = localStorage.getItem("accessToken");
          const response = await api.get("/api/messages/recent-messages", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          console.log("API Response:::", response.data);

          // store the recent messages for each user
          const messages = response.data.recentMessages.reduce(
            (acc, message) => {
              // console.log("Messages Structure:::", message);
              const senderID = message.senderId.toString(); // converting objectId into string

              const displayMessage =
                senderID === loggedInUser._id.toString()
                  ? `You: ${message.message}`
                  : message.message;
              acc[message.userId] = displayMessage; // store the formatte message content for the user
              return acc;
            },
            {}
          );

          setRecentMessages(messages);
        } catch (error) {
          console.error("Error fetching recent messages:", error);
        }
      };
      fetchRecentMessages();
    }
  }, [loggedInUser]);

  if (loading) {
    return <div className="sidebar">Loading...</div>;
  }

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
            className={`user-item ${
              onUserSelect?._id === user._id ? "selected" : ""
            }`}
            onClick={() => setOnUserSelected(user)} // passing selected user
          >
            <div className="user-avatar">
              {/* Display initials or profile image */}
              {user.avatar ? (
                <img src={user.avatar} alt={user.username} />
              ) : (
                <span>{user.username.charAt(0).toUpperCase() || "U"}</span>
              )}
            </div>
            <div className="user-info">
              <h4 className="user-name">{user.username}</h4>
              <p className="user-message">
                {recentMessages[user._id] || "No messages yet"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
