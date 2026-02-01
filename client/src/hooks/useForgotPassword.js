import { useReducer, useEffect, useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { publicApi } from "../Api";
import { FORGOT_STATUS } from "../constant/ForgotStatus";

const initialState = {
    status: FORGOT_STATUS.IDLE,
    email: "",
    message: "",
    retryAfter: null,     // timestamp (ms)
    remainingTime: 0,     // seconds countdown
    error: ""
};

const forgotPasswordReducer = (state, action) => {
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

const useForgotPassword = () => {
    const navigate = useNavigate();
    const [state, dispatch] = useReducer(forgotPasswordReducer, initialState);

    // Side effects state (from useForgotPasswordEffect)
    const [showToast, setShowToast] = useState(false);
    const initialCountdownRef = useRef(null);
    const prevStatusRef = useRef(state.status);

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

    // Trigger toast when rate limit ends 
    useEffect(() => {
        const prev = prevStatusRef.current;
        if (prev === FORGOT_STATUS.RATE_LIMIT && state.status === FORGOT_STATUS.IDLE) {
            setShowToast(true);
            const t = setTimeout(() => setShowToast(false), 2200);
            return () => clearTimeout(t);
        }
    }, [state.status]);

    // Capture initial countdown 
    useEffect(() => {
        if (
            state.status === FORGOT_STATUS.RATE_LIMIT &&
            prevStatusRef.current !== FORGOT_STATUS.RATE_LIMIT
        ) {
            initialCountdownRef.current = state.remainingTime;
        }
        if (state.status !== FORGOT_STATUS.RATE_LIMIT) {
            initialCountdownRef.current = null;
        }
    }, [state.status, state.remainingTime]);

    // Escape key to go back
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") navigate("/login");
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [navigate]);

    // Keep previous status
    useEffect(() => {
        prevStatusRef.current = state.status;
    }, [state.status]);

    const handleForgotPassword = useCallback(async (email) => {
        dispatch({ type: 'SUBMIT_START' });

        try {
            const response = await publicApi.post('/api/users/forgot-password', { email });
            dispatch({
                type: 'SUBMIT_SUCCESS',
                payload: {
                    email,
                    message: response.data?.message
                },
            });
        } catch (error) {
            const status = error.response?.status;

            if (status === 429) {
                const retryAfterSeconds = error.response?.data?.retryAfter;
                dispatch({
                    type: "RATE_LIMIT",
                    payload: {
                        message: error.response?.data?.message || "Too many attempts. Try again later.",
                        retryAfter: retryAfterSeconds
                    }
                });
                return;
            }

            dispatch({
                type: "ERROR",
                payload: error.response?.data?.error || "An error occurred. Please try again.",
            });
        }
    }, []);

    const resetForgotPassword = useCallback(() => {
        dispatch({ type: 'RESET' });
    }, []);

    return {
        state,
        handleForgotPassword,
        resetForgotPassword,
        showToast,
        initialCountdownRef
    };
};

export default useForgotPassword;
