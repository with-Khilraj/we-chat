import React from "react";
import { Link } from "react-router-dom";
import Button from "../forgotPassword/shared/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faPaperPlane } from "@fortawesome/free-solid-svg-icons";

const SuccessState = ({ email, onTryDifferent }) => (
  <div className="text-center animate-fade-in" role="status">
    <div className="success-state p-6 rounded-2xl inline-block mb-4">
      <FontAwesomeIcon icon={faPaperPlane} className="text-white text-3xl email-sent-animation" />
    </div>
    <h1 className="text-3xl font-bold text-white mb-2">Check Your Email</h1>
    <p className="text-white text-opacity-70">We've sent password reset instructions to</p>
    <p className="text-blue-400 font-medium mt-1">{email}</p>
    <Button onClick={onTryDifferent} className="btn-secondary mt-6 w-full py-3 rounded-xl">
      Try Different Email
    </Button>
    <div className="mt-8 animate-fade-in">
      <Link to="/login" id="backToLoginRateLimit" className="text-blue-400 hover:text-blue-300 transition-colors text-sm flex items-center justify-center gap-2">
        <FontAwesomeIcon icon={faArrowLeft} />
        Back to Login
      </Link>
    </div>
  </div>
);

export default SuccessState;
