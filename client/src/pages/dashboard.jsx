import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../component/logout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/ReactToastify.css";
import fetchUserData from "../component/util";
import Sidebar from "../component/sidebar";
import Navbar from "../component/navbar";

import "../styles/home.css";

const Dashboard = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    const getUserData = async () => {
      try {
        const { username } = await fetchUserData(accessToken);
        setUserInfo({ username });
      } catch (error) {
        console.log("Error fetching username:", error);
        setError(error.message); // Set error state here
      }
    };
    getUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
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

      <div className="main-body">
        <Sidebar />
        <div>
          {/* <h1>Welcome to Your Dashboard {userInfo.username}</h1>
        <button onClick={handleLogout}>Logout</button> */}
          <button onClick={handleProfile}>Profile</button>

          <ToastContainer />
        </div>
      </div>
    </>
  );
};

export default Dashboard;
