import React, {useState} from "react";
import { AnimatePresence } from "framer-motion";
import Home from "./pages/home";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Dashboard from "./pages/dashboard";
import Profile from "./pages/profile";
import Sidebar from "./component/sidebar";
import { OnlineUsersProvider } from ".//context/onlineUsersContext";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import EmailVerification from "./component/EmailVerification";
import IncomingCall from "./component/Incoming_call";
import CallInitiation from "./component/CallInitiation";
import FloatingCallWindow from "./component/FloatingCallWindow";
import ActiveCall from "./component/ActiveCall";
import { useChat } from "./hooks/useChat";
import { AuthProvider, useAuth } from "./context/AuthContext";


const App = () => {
  return (
    <OnlineUsersProvider>
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
        </main>
      </Router>
    </OnlineUsersProvider>
  );
}

export default App;
