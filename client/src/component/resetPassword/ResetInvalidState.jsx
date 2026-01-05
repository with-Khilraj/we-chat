import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faRedo, faTimesCircle } from '@fortawesome/free-solid-svg-icons';

const ResetInvalidState = ({ onRequestNew }) => (
  <div className="text-center animate-fade-in">
    <div className="bg-gradient-to-r from-red-500 to-red-600 p-5 rounded-2xl inline-block mb-4">
      <FontAwesomeIcon icon={faTimesCircle} className="text-white text-4xl animate-shake" />
    </div>
    <h1 className="text-3xl font-bold text-white mb-2">Invalid Reset Link</h1>
    <p className="text-white opacity-70">This password reset link is not valid</p>
    <div className="glass-dark rounded-xl p-6 mb-6 mt-4">
      <h3 className="font-medium text-white mb-4">Possible reasons:</h3>
      <div className="space-y-3 text-sm text-white opacity-80 text-left">
        <div className="flex items-start gap-3">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-400 mt-0.5" />
          <span>The link has already been used</span>
        </div>
        <div className="flex items-start gap-3">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-400 mt-0.5" />
          <span>The link is malformed or incomplete</span>
        </div>
        <div className="flex items-start gap-3">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-400 mt-0.5" />
          <span>The reset request was cancelled</span>
        </div>
      </div>
    </div>
    <button className="btn-primary w-full py-3 rounded-xl text-white font-medium" onClick={() => window.location.href = '/forgot-password'}>
      <FontAwesomeIcon icon={faRedo} className="mr-2" /> Request New Reset Link
    </button>
  </div>
);

export default ResetInvalidState;