import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/ReactToastify.css";
import { fetchUserData } from "../component/userStore";
import socket from "../component/socket";
import "../styles/dashboard.css";
import ChatContainer from "../component/chatContainer";
import Sidebar from "../component/sidebar";

const Dashboard = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    const getUserData = async () => {
      try {
        const { username, _id } = await fetchUserData(accessToken);
        setUserInfo({ username, _id });

        // Emit online status to server
        socket.emit("online-user", _id);
      } catch (error) {
        console.log("Error fetching username:", error);
        setError(error.message); // Set error state here
      }
    };
    getUserData();
  }, []);

  if (error) return <div>Error: {error}</div>; // Show error if present
  if (!userInfo) return <div>Loading...</div>; // Show loading message if data is not yet available

  return (
    <>
      <div className="dashboard-container">
        <Sidebar
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
        />
        
        <ChatContainer selectedUser={selectedUser} currentUser={userInfo} />

        <ToastContainer />
      </div>
    </>
  );
};

export default Dashboard;
