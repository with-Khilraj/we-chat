import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/ReactToastify.css";
import { useAuth } from "../context/AuthContext";
import socket from "../utils/socket";
import "../styles/dashboard.css";
import ChatContainer from "../component/chatContainer";
import Sidebar from "../component/sidebar";

const Dashboard = () => {
  const {currentUser, loading} = useAuth();
  // const [userInfo, setUserInfo] = useState(null);
  // const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (currentUser) {
      socket.emit('online-user', currentUser._id);
    }
  }, [currentUser]);

  // useEffect(() => {
  //   const accessToken = localStorage.getItem("accessToken");

  //   const getUserData = async () => {
  //     try {
  //       const { username, _id } = await fetchUserData(accessToken);
  //       setUserInfo({ username, _id });

  //       // Emit online status to server
  //       socket.emit("online-user", _id);
  //     } catch (error) {
  //       console.log("Error fetching username:", error);
  //       setError(error.message); // Set error state here
  //     }
  //   };
  //   getUserData();
  // }, []);

  // Handle loading and error states
  if (loading) return <div>Loading...</div>;
  // if (!currentUser) return <div>Error: Unable to load user data. Please log in again.</div>;

  return (
    <>
      <div className="dashboard-container">
        <Sidebar
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
        />
        
        <ChatContainer selectedUser={selectedUser} currentUser={currentUser} />

        <ToastContainer />
      </div>
    </>
  );
};

export default Dashboard;

