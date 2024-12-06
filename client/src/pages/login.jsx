import React, { useState } from "react";
import api from "../Api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(
        "/api/users/login",
        { email, password },
        { withCredentials: true }
      );
      localStorage.setItem("accessToken", response.data.accessToken);

      // sucess message using toastify
      toast.success("Welcome to test", {
        position: "top-right",
        autoClose: 2000,
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 2500);
    } catch (error) {
      // alert( error.response?.data.erorr || "Login failed!" );
      toast.error(error.response?.data.erorr || "Login failed!", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  return (
    <div className="auth-page">
      <div className="login-form">
        <form onSubmit={handleLogin}>
          <div className="input-container">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              name="email"
              required
            />
            <label htmlFor="email">Email</label>
          </div>

          <div className="input-container">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              name="password"
              required
            />
            <label htmlFor="password">Password</label>
          </div>

          <div className="ask">
            Don't have an accout? <a href="/signup">Singup</a>
          </div>

          <button className="login-btn" type="submit">
            Login
          </button>
        </form>
        <ToastContainer />
      </div>
    </div>
  );
};

export default Login;

// const handleLogout = async () => {
//   try {
//     await api.post('/api/logout');
//     localStorage.removeItem('accessToken');
//     alert('Logged out successfully');
//   } catch (error) {
//     console.error(error);
//     alert('Logout failed');
//   }
// };
