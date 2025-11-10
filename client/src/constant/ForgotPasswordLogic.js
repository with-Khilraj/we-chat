import { FORGOT_STATUS } from "./ForgotStatus";

export const initialState = {
  status: FORGOT_STATUS.IDLE,
  email: "",
  message: "",
  retryAfter: null,     // timestamp (ms)
  remainingTime: 0,     // seconds countdown
  error: ""
};


export const forgotPasswordReducer = (state, action) => {
  switch (action.type) {
    case "SUBMIT_START":
      return { ...state, status: FORGOT_STATUS.SUBMITTING, message: "", error: "" };

    case "SUBMIT_SUCCESS":
      return {
        ...state,
        status: FORGOT_STATUS.SUCCESS,
        email: action.payload?.email,
        message: action.payload?.message,
      };

    case "ERROR":
      return {
        ...state,
        status: FORGOT_STATUS.ERROR,
        error: action.payload
      };

     case "RATE_LIMIT": {
      const future = Date.now() + action.payload.retryAfter;
      return {
        ...state,
        status: FORGOT_STATUS.RATE_LIMIT,
        message: action.payload.message,
        retryAfter: future,
        remainingTime: Math.ceil(action.payload.retryAfter / 1000),
      };
    };

     case "TICK":
      return {
        ...state,
        remainingTime: state.remainingTime > 0 ? state.remainingTime - 1 : 0,
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}