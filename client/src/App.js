import React from "react";
import Home from "./pages/home";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Dashboard from "./pages/dashboard";
import Profile from "./pages/profile";
import Sidebar from "./component/dash/sidebar";
import { OnlineUsersProvider } from ".//context/onlineUsersContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CallProvider, useCall } from "./context/CallContext";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import EmailVerification from "./pages/EmailVerification";
import FloatingCallWindow from "./component/FloatingCallWindow";
import ActiveCall from "./component/ActiveCall";
import IncomingCall from "./component/Incoming_call";
import CallInitiation from "./component/CallInitiation";
import { AnimatePresence } from "framer-motion";
import "./global.css"
import ForgotPasswordPage from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const CallComponents = () => {
  const {
    isCalling,
    callState,
    remoteUser,
    acceptCall,
    rejectCall,
    endCall,
  } = useCall();

  return (
    <AnimatePresence>
      {/* Outgoing call UI */}
      {callState === "ringing_outgoing" && remoteUser && (
        <FloatingCallWindow>
          <CallInitiation />
        </FloatingCallWindow>
      )}

      {/* Incoming call UI */}
      {callState === "ringing_incoming" && remoteUser && (
        <FloatingCallWindow>
          <IncomingCall />
        </FloatingCallWindow>
      )}

      {/* Active call UI */}
      {callState === "active" && remoteUser && (
        <FloatingCallWindow>
          <ActiveCall onEndCall={endCall} />
        </FloatingCallWindow>
      )}
    </AnimatePresence>
  );
};

const AppContent = () => {
  const { currentUser, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  // if (!currentUser) return <div>Please log in to continue.</div>;

  return (
    <CallProvider currentUser={currentUser}>
      <Router>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/sidebar" element={<Sidebar />} />
            <Route path="/verify-email" element={<EmailVerification />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Routes>
          <CallComponents />
        </main>
      </Router>
    </CallProvider>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <OnlineUsersProvider>
        <AppContent />
      </OnlineUsersProvider>
    </AuthProvider>
  );
};

export default App;
