import React, { useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";
import api from "../Api";

const Signup = () => {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    phone: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("http://localhost:5000/api/users/signup", formData);

      // show success message using toastify
      toast.success(response.data.message, {
        position: "top-right",
        autoClose: 2000, // 2 sec
      });

      // Redirect to login page after 2.3 second
      setTimeout(() => {
        navigate("/verify-email", { state: { email: formData.email}});
      }, 2300);
    } catch (error) {
      console.error("Signup error:", error);
      toast.error(error.response.data.error || "Something went wrong", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  return (
    <div className="auth-page">
      <div className="signup-form">
        <form onSubmit={handleSubmit}>
          <div className="input-container">
            <input type="email" name="email" onChange={handleChange} required />
            <label htmlFor="email">email address</label>
          </div>
          <div className="input-container">
            <input
              type="text"
              name="username"
              onChange={handleChange}
              required
            />
            <label htmlFor="username">username</label>
          </div>
          <div className="input-container">
            <input type="text" name="phone" onChange={handleChange} required />
            <label htmlFor="name">phone number</label>
          </div>
          <div className="input-container">
            <input
              type="password"
              name="password"
              onChange={handleChange}
              required
            />
            <label htmlFor="name">your password</label>
          </div>

          <div className="ask">
            Already have an accoutn? <a href="/login">Singin</a>
          </div>
          <button className="signup-btn" type="submit">
            Signup
          </button>
        </form>

        <ToastContainer />
      </div>
    </div>
  );
};

export default Signup;
