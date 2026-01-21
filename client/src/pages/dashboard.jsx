import React, { useState, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/ReactToastify.css";
import { useAuth } from "../context/AuthContext";
import socket from "../hooks/useSocket";
import "../styles/dashboard.css";
import Sidebar from "../component/dash/sidebar/Sidebar";
import "../global.css"

const Dashboard = () => {
  const { currentUser, loading } = useAuth();

  useEffect(() => {
    if (currentUser) {
      socket.emit('online-user', currentUser._id);
    }
  }, [currentUser]);

  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !currentUser) {
      navigate("/login");
    }
  }, [currentUser, loading, navigate])


  // Handle loading and error states
  if (loading) return <div>Loading...</div>;

  return (
    <>
      <div className="dashboard-container">
        <Sidebar />
        <div className="main-content">
          <Outlet context={{ currentUser }} />
        </div>

        <ToastContainer />
      </div>
    </>
  );
};

export default Dashboard;

