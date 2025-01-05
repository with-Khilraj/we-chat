import React, { useState, useEffect, useMemo, useCallback } from "react";
import "../styles/sidebar.css";
import { fetchUserData, fetchUserExceptCurrent } from "./userStore";
import api from "../Api";
import socket from "./socket";
import { debounce } from "lodash";
import { useOnlineUsers } from "../context/onlineUsersContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ onUserSelect, setOnUserSelected }) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [recentMessages, setRecentMessages] = useState({});
  const [loggedInUser, setLoggedInUser] = useState("");
  const [loading, setLoading] = useState(true);
  const onlineUsers = useOnlineUsers();
  const navigate = useNavigate();

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

  // useEffect(() => {
  //   socket.emit('user-online', userId); // notify the server that this user is online

  //   // listen for the active users updates
  //   socket.on('updateActiveUsers', (activeUsers) => {
  //     setOnlineUsers(activeUsers);
  //   });

  //   return () => {
  //     socket.disconnect();
  //   }
  // }, [userId]);

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
        socket.emit("online-user", userData._id);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);


  // function to update the recent messages
  const updateRecentMessages = useCallback(
    (newMessages) => {
      setRecentMessages((prevMessages) => {
        const updatedMessages = { ...prevMessages };
        newMessages.forEach((message) => {
          const senderID = message.senderId.toString();
          const receiverID = message.userId.toString(); // userId = receiverId
          const otherUserID =
            senderID === loggedInUser._id.toString() ? receiverID : senderID;
          const displayMessage =
            senderID === loggedInUser._id.toString()
              ? `You: ${message.message}`
              : message.message;
          updatedMessages[otherUserID] = {
            message: displayMessage,
            timestamp: new Date(message.lastMessageTimestamp).getTime(),
          };
          // updatedMessages[message.userId] = displayMessage;
        });
        return updatedMessages;
      });
    },
    [loggedInUser?._id]
  );


  useEffect(() => {
    if (loggedInUser) {
      const fetchRecentMessages = async () => {
        try {
          const accessToken = localStorage.getItem("accessToken");
          const response = await api.get("/api/messages/recent-messages", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          updateRecentMessages(response.data.recentMessages);
        } catch (error) {
          console.error(`Error fetching recent messages: ${error}`);
        }
      };
      fetchRecentMessages();
    }
  }, [loggedInUser, updateRecentMessages]);



  // useEffect for the socket events
  useEffect(() => {
    const handleNewMessage = (message) => {
      updateRecentMessages([message]);
    };

    // listen for new messages
    socket.on("new_message", handleNewMessage);

    // clean up the socket listener whe the component unmounts
    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [updateRecentMessages]);



  // Helper: turncate the message content 
  const truncateMessage = (content = "", maxLength = 25) => {
    return content.length > maxLength
      ? `${content.substring(0, maxLength)}...`
      : content;
  };


  // Filter users based on the search input and sort the chat list based on the timestamp
  const filteredUsers = useMemo(() => {
    return users
      .filter((user) =>
        user.username.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        const timeA = recentMessages[a._id]?.timestamp || 0;
        const timeB = recentMessages[b._id]?.timestamp || 0;
        return timeB - timeA;
      });
  }, [users, search, recentMessages]);


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
      // Clear all user-related data from local storage
      localStorage.clear();

      // update the local state
      setLoggedInUser(null);

      // clear recent messages
      setRecentMessages({});

      // disconect the socket connection
      socket.disconnect();

      toast.success("Logout successful!", {
        position: "top-right",
        autoClose: 2000,
      });

      // Redirect to the login page immediately
      navigate("/login");
    } catch (error) {
      toast.error("Logout failed", {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

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
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
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
                  {/* Oline Indicator */}
                  {onlineUsers.includes(user._id) && (
                    <span className="online-indicator"></span>
                  )}
                </div>
                <div className="user-info">
                  <h4 className="user-name">{user.username}</h4>
                  <p className="user-message">
                    {truncateMessage(recentMessages[user._id]?.message) ||
                      "No messages yet"}
                  </p>
                  {recentMessages[user._id] && (
                    <span className="message-timestamp">
                      {new Date(
                        recentMessages[user._id].timestamp
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
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

export default Sidebar;
