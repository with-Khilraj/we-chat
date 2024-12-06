import React from "react";
import Home from "./pages/home";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Dashboard from "./pages/dashboard";
import Profile from "./pages/profile";

import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';

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
    <Router>
      <main>
        <Routes>
          <Route path="/" element= { <Home /> } />
          <Route path="/login" element= { <Login /> } />
          <Route path="/signup" element= { <Signup /> } />
          <Route path="/dashboard" element= { <Dashboard /> } />
          <Route path="/dashboard" element= { <Dashboard /> } />
          <Route path="/profile" element= { <Profile />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
