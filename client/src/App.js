import React from "react";
import Home from "./pages/home";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Dashboard from "./pages/dashboard";
import Profile from "./pages/profile";
import Sidebar from "./component/sidebar";
import { OnlineUsersProvider } from ".//context/onlineUsersContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CallProvider, useCall } from "./context/CallContext";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import EmailVerification from "./component/EmailVerification";
import FloatingCallWindow from "./component/FloatingCallWindow";
import ActiveCall from "./component/ActiveCall";
import IncomingCall from "./component/Incoming_call";
import CallInitiation from "./component/CallInitiation";
import { AnimatePresence } from "framer-motion";

const CallComponents = () => {
  const { isCalling, callState, incomingCall, recipient, caller, callerLoading, callRoomId, localStream, handleAcceptCall, handleRejectCall, handleEndCall } =
    useCall();

  return (
    // Call Components
    <AnimatePresence>
      {/* Call Initiation UI (for caller) */}
      {callState === 'ringing' && !incomingCall && !isCalling && (
        <CallInitiation
          user={recipient}
          onCallCancel={handleEndCall}
        />
      )}

      {/* Incoming Call UI (for receiver) */}
      {callState === 'ringing' && incomingCall && caller?.username && !callerLoading && (
        <IncomingCall
          user={caller}
          onAccept={() => handleAcceptCall(callRoomId)}
          onReject={handleRejectCall}
        />
      )}

      {callState === 'active' && caller?.username && !callerLoading && (
        <FloatingCallWindow>
          <ActiveCall
            user={caller || recipient}
            onEndCall={handleEndCall}
            onToggleMute={(muted) => {
              if (localStream) {
                localStream.getAudioTracks().forEach(track => {
                  track.enabled = !muted;
                });
              }
            }}
          />
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
