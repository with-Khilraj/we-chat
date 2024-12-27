import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/ReactToastify.css";
import { fetchUserData } from "../component/userStore";
import Sidebar from "../component/sidebar";
import api from "../Api";

import "../styles/dashboard.css";
import ChatContainer from "../component/chatContainer";

const Dashboard = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    const getUserData = async () => {
      try {
        const { username, _id } = await fetchUserData(accessToken);
        setUserInfo({ username, _id });
      } catch (error) {
        console.log("Error fetching username:", error);
        setError(error.message); // Set error state here
      }
    };
    getUserData();
  }, []);

  const handleLogout = async () => {
    try {
      // await logout();
      await api.post('/api/users/logout');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userInfo');
      setUserInfo(null);
      toast.success("Logout successful!", {
        position: "top-right",
        autoClose: 2000,
      });

      setTimeout(() => {
        navigate("/login");
      }, 2300);
    } catch (error) {
      toast.error("Logout failed", {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  if (error) return <div>Error: {error}</div>; // Show error if present
  if (!userInfo) return <div>Loading...</div>; // Show loading message if data is not yet available

  return (
    <>
      {/* <Navbar /> */}

      <div className="dashboard-container">
        <div className="menu">---</div>
        <Sidebar
          onUserSelect={selectedUser}
          setOnUserSelected={setSelectedUser}
        />
        <ChatContainer selectedUser={selectedUser} currentUser={userInfo} />

        {/* Profile Info Container */}
        <div className="profile-info">
          <div className="profile-pic">
            {selectedUser && (
              <div className="user-profile-pic">
                {selectedUser.avatar ? (
                  <img src={selectedUser.avatar} alt="" />
                ) : (
                  <span className="user-initial-char">
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="profile-user-name">
            { selectedUser && (
              <h3>{selectedUser.username}</h3>
            )}
          </div>
          {/* Profile content goes here */}
          <p>Additional details about the current user...</p>
          <button 
            className="logout-btn"
            onClick={handleLogout}
          >Logout</button>
        </div>
        <button onClick={handleProfile}>Profile</button>

        <ToastContainer />
      </div>
    </>
  );
};

export default Dashboard;
