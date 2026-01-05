import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faRedo, faClock } from '@fortawesome/free-solid-svg-icons';

const ResetExpiredState = ({ onRequestNew }) => {
  return (
    <div className="text-center">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="token-expired bg-gradient-to-r from-red-500 to-red-600 p-5 rounded-2xl inline-block mb-4">
          <FontAwesomeIcon icon={faClock} className="text-white text-4xl animate-shake" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">
          Reset Link Expired
        </h1>

        <p className="text-white opacity-70">
          This password reset link has expired
        </p>
      </div>

      {/* Security Info */}
      <div
        className="glass-dark rounded-xl p-6 mb-6 animate-fade-in"
        style={{ animationDelay: '0.1s' }}
      >
        <h3 className="font-medium text-white mb-4">
          Security Information
        </h3>

        <div className="space-y-3 text-sm text-white opacity-80 text-left">
          <div className="flex items-start gap-2">
            <FontAwesomeIcon icon={faInfoCircle} className="text-yellow-400 mt-1" />
            <span>Reset links expire after 10 mins for security</span>
          </div>

          <div className="flex items-start gap-2">
            <FontAwesomeIcon icon={faInfoCircle} className="text-yellow-400 mt-1" />
            <span>This helps protect your account from unauthorized access</span>
          </div>

          <div className="flex items-start gap-2">
            <FontAwesomeIcon icon={faInfoCircle} className="text-yellow-400 mt-1" />
            <span>You can request a new reset link anytime</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onRequestNew}
        className="btn-primary w-full py-3 rounded-xl text-white font-medium animate-fade-in"
        style={{ animationDelay: '0.2s' }}
      >
        <FontAwesomeIcon icon={faRedo} className="mr-2" />
        Request New Reset Link
      </button>
    </div>
  );
};

export default ResetExpiredState;
