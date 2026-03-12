import React from "react";
import Home from "./pages/home";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Dashboard from "./pages/dashboard";
import Profile from "./pages/profile";
import Sidebar from "./component/dash/sidebar/Sidebar";
import ChatContainer from "./component/dash/chat/ChatContainer";
import { OnlineUsersProvider } from "./context/onlineUsersContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
// import { CallProvider, useCall } from "./context/CallContext";  // old method
import { CallProvider } from "./context/NewCallContext"; // new method
import { TypingProvider } from "./context/TypingContext";
import { DraftProvider } from "./context/DraftContext";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import EmailVerification from "./pages/EmailVerification";
import "./global.css"
import ForgotPasswordPage from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import WelcomeState from "./component/dash/WelcomeState";

import CallManager from "./component/call/CallManager";

// const CallComponents = () => {
//   const { callState, remoteUser } = useCall();

//    return (
//     <AnimatePresence mode="wait">
//       {/* Outgoing call — waiting for answer */}
//       {callState === CALL_STATE.OUTGOING && remoteUser && (
//         <OutgoingCallScreen key="outgoing" />
//       )}

//       {/* Incoming call — modal overlay */}
//       {callState === CALL_STATE.INCOMING && remoteUser && (
//         <IncomingCallModal key="incoming" />
//       )}

//       {/* Active call — full screen */}
//       {callState === CALL_STATE.ACTIVE && remoteUser && (
//         <ActiveCallScreen key="active" />
//       )}
//     </AnimatePresence>
//   );
// };

const AppContent = () => {
  const { currentUser, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <CallProvider currentUser={currentUser}>
      <Router>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />}>
              <Route path="chat/:userId" element={<ChatContainer />} />
              <Route index element={<Navigate to="chats" replace />} />
              <Route path="chats" element={<WelcomeState />} />
              <Route path="contacts" element={<WelcomeState />} />
              <Route path="calls" element={<WelcomeState />} />
              <Route path="notifications" element={<WelcomeState />} />
            </Route>
            <Route path="/profile" element={<Profile />} />
            <Route path="/sidebar" element={<Sidebar />} />
            <Route path="/verify-email" element={<EmailVerification />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Routes>
          <CallManager />
        </main>
      </Router>
    </CallProvider>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <OnlineUsersProvider>
        <TypingProvider>
          <DraftProvider>
            <AppContent />
          </DraftProvider>
        </TypingProvider>
      </OnlineUsersProvider>
    </AuthProvider>
  );
};

export default App;
