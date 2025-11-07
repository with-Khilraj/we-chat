import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faComment, faUsers, faBell } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";


const SuccessCard = () => {
  const navigate = useNavigate();

  return (
    <div className="success-card text-center animate-bounce-in">
      {/* Top success message */}
      <div className="mb-8">
        <div className="success-state p-6 rounded-2xl inline-block mb-4">
          <FontAwesomeIcon icon={faCheckCircle} className="text-white text-4xl checkmark-animation" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Email Verified!</h1>
        <p className="text-white text-opacity-70">
          Your account has been successfully verified
        </p>
      </div>

      {/* Welcome message card */}
      <div className="glass-dark rounded-xl p-6 mb-6 animate-fade-in">
        <h3 className="font-medium text-white mb-4">Welcome to We-Chat!</h3>
        <div className="space-y-3 text-sm text-white text-opacity-80 text-left">
          <div className="flex items-start gap-3">
            <FontAwesomeIcon icon={faComment} className="text-blue-400 mt-0.5" />
            <span>Start chatting with your friends in real-time</span>
          </div>
          <div className="flex items-start gap-3">
            <FontAwesomeIcon icon={faUsers} className="text-purple-400 mt-0.5" />
            <span>Collaborate in group chats and communities</span>
          </div>
          <div className="flex items-start gap-3">
            <FontAwesomeIcon icon={faBell} className="text-green-400 mt-0.5" />
            <span>Get notifications for messages and calls instantly</span>
          </div>
        </div>
      </div>


      <button
        className="btn-primary w-full py-3 rounded-xl text-white font-medium"
        onClick={() => navigate("/login")}
      >
        Continue to Login
      </button>
    </div>
  )
};

export default SuccessCard;