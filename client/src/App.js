import React from "react";
import Home from "./pages/home";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Dashboard from "./pages/dashboard";
import Profile from "./pages/profile";
import Sidebar from "./component/sidebar";
import { OnlineUsersProvider } from ".//context/onlineUsersContext";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import EmailVerification from "./component/EmailVerification";

const App = () => {
  // const [message, setMessage] = useState("");

  // useEffect(() => {
  //   fetch("/api")
  //     .then((response) => {
  //       if(!response.ok) {
  //         throw new Error(`HTTP error! status: ${response.status}`)
  //       }
  //       return response.text();
  //     })
  //     .then((data) => setMessage(data))
  //     .catch((err) => console.log("Error fetching data:", err));
  // }, []);

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
};

export default App;
