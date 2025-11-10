import React from "react";
import ForgotPassForm from "../component/forgotPassword/ForgotPassForm";
import SuccessState from "../component/forgotPassword/SuccessState";
import FloatingCard from "../component/forgotPassword/FloatingCard";
import useForgotPassword from "../hooks/useForgotPasswordLogic";
import '../styles/forgotPassword.css';

const ForgotPasswordPage = () => {
  const { successMessage, submitEmail, resetState } = useForgotPassword();

  const handleTryDifferent = () => {
    resetState();
  };

  return (
    <div className="gradient-bg flex items-center justify-center p-4 min-h-screen relative">
      {/* Floating Code Elements */}
      <FloatingCard code="const resetToken = generateToken();" className="top-10 left-10" />
      <FloatingCard code="await sendResetEmail(user.email);" className="top-20 right-20" style={{ animationDelay: "-2s" }} />
      <FloatingCard code="if (tokenValid) { allowReset(); }" className="bottom-20 left-20" style={{ animationDelay: "-4s" }} />
      <FloatingCard code="// Password recovery flow" className="bottom-10 right-10" style={{ animationDelay: "-1s" }} />

      {/* Main Container */}
      <div className="forgot-container glass rounded-3xl p-8 w-full max-w-md animate-slide-up">
        {!successMessage && <ForgotPassForm />}
        {successMessage && <SuccessState email={submitEmail} onTryDifferent={handleTryDifferent} />}

        <div className="mt-8 text-center animate-fade-in">
          <p className="text-white text-opacity-50 text-sm">
            <i className="fas fa-question-circle mr-2"></i>
            Need help? <a href="/help" className="text-blue-400 hover:text-blue-300">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
