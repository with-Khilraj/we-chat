import React from 'react';
import { useParams } from 'react-router-dom';
import { useResetPassword } from '../hooks/useResetPassword';
import ResetPassForm from '../component/resetPassword/ResetPassForm';
import ResetExpiredState from '../component/resetPassword/ResetExpiredState';
import ResetInvalidState from '../component/resetPassword/ResetInvalidState';
import ResetSuccessState from '../component/resetPassword/ResetSuccessState';


const ResetPassword = () => {
  const { token } = useParams();

  const { state, handleReset, requestNewReset } = useResetPassword(token);

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
        {state.success ? (
          <ResetSuccessState />
        ) : state.expired ? (
          <ResetExpiredState onRequestNew={requestNewReset} />
        ) : state.invalid ? (
          <ResetInvalidState onRequestNew={requestNewReset} />
        ) : state.valid ? (
          <ResetPassForm state={state} onSubmit={handleReset} />
        ) : (
          <div className="text-center text-white">
            <p>Unable to process reset request</p>
            <button
              onClick={() => window.location.href = '/forgot-password'}
              className="mt-4 px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
            >
              Request New Reset
            </button>
          </div>
        )}

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