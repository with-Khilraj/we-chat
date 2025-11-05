import React, { useState } from "react";
import api from "../Api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/ReactToastify.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightToBracket } from "@fortawesome/free-solid-svg-icons";
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

      console.log("Access Token while login:::", response.data.accessToken);

      // sucess message using toastify
      toast.success("Welcome to we-chat", {
        position: "top-center",
        autoClose: 2000,
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 2500);
    } catch (error) {
      // alert( error.response?.data.erorr || "Login failed!" );
      toast.error(error.response?.data.error || "Login failed!", {
        position: "top-center",
        autoClose: 2100,
      });
    }
  };

  return (
    <div className="gradient-bg auth-page">
      <div className="login-form">
        <div className="flex flex-col p-6 rounded-2xl items-center form-header">
          <div className="bg-indigo-500 p-4 rounded-full mb-4">
            <FontAwesomeIcon icon={faRightToBracket} className="text-white text-3xl" />
          </div>
          <h2 className="text-black text-xl font-semibold mb-2">Welcome Back!</h2>
          <p className="text-gray-500 text-sm">Please login to continue</p>
        </div>

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

          <div className="flex justify-between items-center text-sm ask">
            <p>
              Don’t have an account?{" "}
              <a href="/signup" className="no-underline text-indigo-400 hover:text-red">
                Signup
              </a>
            </p>
            <a href="/forgot-password" className="no-underline text-indigo-400 hover:underline">
              Forgot password?
            </a>
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
