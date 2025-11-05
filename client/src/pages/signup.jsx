import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/ReactToastify.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUnlockAlt } from "@fortawesome/free-solid-svg-icons";
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
        position: "top-center",
        autoClose: 1800, // 1.8 sec
      });

      // Redirect to email verify after 1.9 second
      setTimeout(() => {
        navigate("/verify-email", { state: { email: formData.email } });
      }, 1900);
    } catch (error) {
      console.error("Signup error:", error);
      toast.error(error.response.data.error || "Something went wrong", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  return (
    <div className="gradient-bg auth-page">
      <div className="glass-card signup-form">
        <div className="flex flex-col p-6 rounded-2xl items-center form-header">
          <div className="bg-indigo-500 p-4 rounded-full mb-4">
            <FontAwesomeIcon icon={faUnlockAlt} className="text-white text-3xl" />
          </div>
          <h2 className="text-black text-xl font-semibold mb-2">Create Your Account</h2>
          <p className="text-gray-500 text-sm">Join us and get Started today</p>
        </div>

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
            <p>
              Already have an account?{" "}
              <a href="/login" className="no-underline text-indigo-400 hover:text-red">
                login
              </a>
            </p>
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
