import React from "react";
import "react-toastify/ReactToastify.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUnlockAlt } from "@fortawesome/free-solid-svg-icons";
import "../styles/auth.css";
import SignupForm from "../component/auth/SignupForm";

const Signup = () => {

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

        <SignupForm />
      </div>
    </div>
  );
};

export default Signup;
