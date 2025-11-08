import React from "react";
import Button from "../forgotPassword/shared/Button";

const SuccessState = ({ email, onTryDifferent }) => (
  <div className="text-center animate-fade-in">
    <div className="success-state p-6 rounded-2xl inline-block mb-4">
      <i className="fas fa-paper-plane text-white text-4xl email-sent-animation"></i>
    </div>
    <h1 className="text-3xl font-bold text-white mb-2">Check Your Email</h1>
    <p className="text-white text-opacity-70">We've sent password reset instructions to</p>
    <p className="text-blue-400 font-medium mt-1">{email}</p>
    <Button onClick={onTryDifferent} className="btn-secondary mt-6 w-full py-3 rounded-xl">
      Try Different Email
    </Button>
  </div>
);

export default SuccessState;
