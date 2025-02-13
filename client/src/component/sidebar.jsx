import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import "../styles/sidebar.css";
import { fetchUserData, fetchUserExceptCurrent } from "../utils/userStore";
import api from "../Api";
import socket from "../utils/socket";
import { debounce, } from "lodash";
import { useOnlineUsers } from "../context/onlineUsersContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import menu from '../assets/menu.png';

const Sidebar = ({ selectedUser, setSelectedUser }) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [recentMessages, setRecentMessages] = useState({});
  const [loggedInUser, setLoggedInUser] = useState("");
  const [loading, setLoading] = useState(true);
  const onlineUsers = useOnlineUsers();
  const navigate = useNavigate();
  const dropupRef = useRef(null);
  const moreMenuRef = useRef(null);
  const [isDropupOpen, setIsDropupOpen] = useState(false);

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
          const receiverID = message.receiverId.toString(); // userId = receiverId
          const otherUserID =
            senderID === loggedInUser._id.toString() ? receiverID : senderID;
            const isSeen = message.seen || false;

            // Determine the display message based on the messageType
            let displayMessage;
            if(message.messageType === 'text') {
              // we call message.message not message.content because in server-side, 
              // we save the content and file both on 'message' while sending the message
              const messageContent = message.message || "";   
              console.log("message::::", message);
              console.log("messageContent::::", messageContent);
              displayMessage =
                senderID === loggedInUser._id.toString()
                  ? `You: ${messageContent}`
                  : messageContent;
            } else if (message.messageType) {
              const messageTypeMap = {
                "photo": 'a photo',
                "video": 'a video',
                "file": 'a file',
                "audio": 'an audio',
              };
              const messageTypeText = messageTypeMap[message.messageType];
              displayMessage =
                senderID === loggedInUser._id.toString()
                ? `You sent ${messageTypeText}`
                : `Sent you ${messageTypeText}`;
            } else {
              displayMessage = 'New message';
            }
          
          updatedMessages[otherUserID] = {
            message: displayMessage,
            timestamp: new Date(message.lastMessageTimestamp).getTime(),
            seen: isSeen
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
      // Clear all user-related data from local storage
      localStorage.clear();

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
    
  const toggleDropup = (event) => {
    event.stopPropagation();
    setIsDropupOpen((prev) => !prev);
  }


  const handleClickOutside = useCallback((event) => {
    if(dropupRef.current && 
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
          <div ref={dropupRef} className= {`dropup-menu ${isDropupOpen ? 'open' : ''}`} >
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
                className={`user-item ${
                  selectedUser?._id === user._id ? "selected" : ""
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
                <div className="user-info">
                  <h4 className="user-name">{user.username}</h4>
                  <div className="user-message-container">
                    <p className= {`user-message ${!recentMessages[user._id]?.seen ? 'unseen' : ''}`}>
                      {truncateMessage(recentMessages[user._id]?.message) ||
                        "No messages yet"}
                    </p>
                    {recentMessages[user._id] && (
                      <>
                        <span className="message-timestamp">
                          {formatTimestamp(recentMessages[user._id].timestamp)}
                        </span>
                        {/* {!recentMessages[user._id]?.seen && (
                          <span className="unseen-indicator"></span>
                        )} */}
                      </>
                    )}
                  </div>
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

export default Sidebar