import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCheckCircle, faSignInAlt } from '@fortawesome/free-solid-svg-icons';


const ResetSuccessState = () => (
      <div className="text-center animate-fade-in">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-5 rounded-2xl inline-block mb-4">
          <FontAwesomeIcon icon={faCheckCircle} className="text-white text-4xl" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Password Reset Successfully</h1>
        <p className="text-white opacity-70">Your password has been updated securely</p>
        <div className="glass-dark rounded-xl p-6 mb-6 mt-4">
          <div className="space-y-3 text-sm text-white opacity-80">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 opacity-20 p-1 rounded-full">
                <i className="fas fa-check text-green-400 text-xs"></i>
              </div>
              <span>Password updated with strong encryption</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-green-500 opacity-20 p-1 rounded-full">
                <FontAwesomeIcon icon={faCheck} className="text-green-400 text-xs" />
              </div>
              <span>All active sessions have been logged out</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-green-500 opacity-20 p-1 rounded-full">
                <FontAwesomeIcon icon={faCheck} className="text-green-400 text-xs" />
              </div>
              <span>Security notification sent to your email</span>
            </div>
          </div>
        </div>
        <button className="btn-primary w-full py-3 rounded-xl text-white font-medium" onClick={() => window.location.href = '/login'}>
          <FontAwesomeIcon icon={faSignInAlt} className="mr-2" /> Sign In with New Password
        </button>
      </div>
);

export default ResetSuccessState;
