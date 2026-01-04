import React from 'react';
import { useParams } from 'react-router-dom';
import { useResetPassword } from '../hooks/useResetPassword';
import ResetPassForm from '../component/resetPassword/ResetPassForm';
import { useState } from 'react';
import { useEffect } from 'react';

const ResetPassword = () => {
  const { token } = useParams();
  const [secureToken, setSecureToken] = useState(null);

  // store token in react state to avoid direct URL access later
  useEffect(() => {
    if (token) {
      setSecureToken(token);
    }
  }, [token]);

  // remove token from URL
  useEffect(() => {
    if (token) {
      window.history.replaceState({}, "", '/reset-password'); 
    }
  })

  const { state, handleReset } = useResetPassword(secureToken);

  return (
    <div className="gradient-bg flex items-center justify-center p-4 min-h-screen">
      {/* Floating Elements */}
      <div className="absolute top-10 left-10 opacity-10 animate-float font-mono text-white text-sm">
        const newPassword = hash(password);
      </div>
      <div className="absolute top-20 right-20 opacity-10 animate-float font-mono text-white text-sm" style={{ animationDelay: '-2s' }}>
        if (tokenValid && passwordStrong) updatePassword();
      </div>
      {/* Main Container */}
      <div className="glass rounded-3xl p-8 w-full max-w-md animate-slide-up">
        <ResetPassForm state={state} onSubmit={handleReset} />
        <div className="mt-8 text-center">
          <p className="text-white opacity-50 text-sm">
            <i className="fas fa-question-circle mr-2"></i>
            Need help? <a href="/help" className="text-blue-400 hover:text-blue-300">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;