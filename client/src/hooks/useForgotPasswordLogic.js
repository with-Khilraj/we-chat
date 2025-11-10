import { publicApi } from "../Api";
import { useReducer, useCallback } from "react";
import { forgotPasswordReducer, initialState } from "../constant/ForgotPasswordLogic";
import { FORGOT_STATUS } from "../constant/ForgotStatus";
import { useEffect } from "react";

const useForgotPasswordReducer = () => {
  const [state, dispatch] = useReducer(forgotPasswordReducer, initialState);

  // Countdown logic
  useEffect(() => {
    if (state.status !== FORGOT_STATUS.RATE_LIMIT || state.remainingTime <= 0) return;

    const interval = setInterval(() => {
      dispatch({ type: "TICK" });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.status, state.remainingTime]);

  // Automatically exit RATE LIMIT when countdown finishes
  useEffect(() => {
    if (state.status === FORGOT_STATUS.RATE_LIMIT && state.remainingTime === 0) {
      dispatch({ type: "RESET" });
    }
  }, [state.status, state.remainingTime]);

  const handleForgotPassword = useCallback( async (email) => {
    dispatch({ type: 'SUBMIT_START'});

    try {
      const response = await publicApi.post('/api/users/forgot-password', {email});
      dispatch({
        type: 'SUBMIT_SUCCESS',
        payload: {
          email,
          message: response.data?.message
        },
      });
    } catch (error) {
      const status = error.response?.status;

       // RATE LIMIT detection (429)
      if (status === 429) {
        const retryAfterSeconds =
          error.response?.data?.retryAfter / 1000 ||
          parseInt(error.response?.headers["retry-after"], 10) ||
          60;

      dispatch({
          type: "RATE_LIMIT",
          payload: {
            message: error.response?.data?.message || "Too many attempts. Try again later.",
            retryAfter: retryAfterSeconds * 1000, // convert to ms
          },
        });
        return;
      }

      // GENERIC ERROR
      dispatch({
        type: "ERROR",
        payload: {
          error: error.response?.data?.error || "An error occurred. Please try again.",
        },
      });
    };
  }, []);

  const resetForgotPassword = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    state,
    handleForgotPassword,
    resetForgotPassword
  };
};

export default useForgotPasswordReducer;

// import { useState } from "react";
// import { publicApi } from "../Api";
// import { useCallback } from "react";

// const useForgotPassword = () => {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [successMessage, setSuccessMessage] = useState("");
//   const [submitEmail, setSubmitEmail] = useState('');
  
//   const resetState = useCallback(() => {
//     setError("");
//     setSuccessMessage("");
//     setLoading(false);
//   }, []);

//   const handleForgotPassword = useCallback(async (email) => {
//     resetState();
//     setLoading(true);

//     try {
//       const response = await publicApi.post('/api/users/forgot-password', { email });
//       setSuccessMessage(response.data.message);
//       setSubmitEmail(email);
//     } catch (error) {
//       setError(error.response?.data?.error || "An error occurred. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   }, [resetState]);

//   return {
//     loading,
//     error,
//     successMessage,
//     submitEmail,
//     handleForgotPassword,
//     resetState
//   };
// }

// export default useForgotPassword;