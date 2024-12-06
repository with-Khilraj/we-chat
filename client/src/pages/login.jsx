import React, { useState } from "react";
import api from "../Api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/ReactToastify.css";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/api/users/login", { email, password }, { withCredentials: true });
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
      toast.error( error.response?.data.erorr || "Login failed!", {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  return (
    <div>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit">Login</button>
      </form>
      <ToastContainer />
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
