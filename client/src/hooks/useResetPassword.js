import { useReducer, useEffect, useCallback } from 'react';
import { validateResetToken, resetPasswordRequest } from '../services/resetPasswordService';
import { RESET_PASSWORD_ACTIONS, RESET_PASSWORD_MESSAGES } from '../constant/ResetActions';
import { api } from '../Api';
import { useNavigate } from 'react-router-dom';

const initialState = {
  loading: true,
  valid: false,
  invalid: false,
  expired: false,
  success: false,
  error: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case RESET_PASSWORD_ACTIONS.VALIDATE_START:
      return { ...initialState, loading: true };
    case RESET_PASSWORD_ACTIONS.VALIDATE_SUCCESS:
      return {
        loading: false, valid: true, invalid: false,
        expired: false, success: false, error: null
      };
    case RESET_PASSWORD_ACTIONS.VALIDATE_FAILURE:
      const reason = action.payload;
      return {
        loading: false, valid: false,
        invalid: reason === 'INVALID_TOKEN',
        expired: reason === 'TOKEN_EXPIRED',
        success: false,
         error: reason === 'TOKEN_EXPIRED' 
          ? RESET_PASSWORD_MESSAGES.TOKEN_EXPIRED 
          : RESET_PASSWORD_MESSAGES.INVALID_TOKEN
      }
    case RESET_PASSWORD_ACTIONS.RESET_START:
      return { ...state, loading: true, error: null };
    case RESET_PASSWORD_ACTIONS.RESET_SUCCESS:
      return {
        loading: false, valid: false, invalid: false,
        expired: false, success: true, error: null
      };
    case RESET_PASSWORD_ACTIONS.RESET_FAILURE:
      return {
        ...state, loading: false,
        error: action.payload.message || RESET_PASSWORD_MESSAGES.GENERIC_ERROR
      };
    default:
      return state;
  }
};

export const useResetPassword = (token) => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, initialState);

  const getToken = () => {
    if (token) {
      return token;
    }
    return sessionStorage.getItem('resetToken');
  }

  // validate token on mount and when token changes
  useEffect(() => {
    const validateToken = async () => {
      const currentToken = getToken();
      if (!currentToken) {
        // no token provided, treat as invalid
        dispatch({
          type: RESET_PASSWORD_ACTIONS.VALIDATE_FAILURE,
          payload: 'INVALID_TOKEN'
        });
        return;
      }

      dispatch({ type: RESET_PASSWORD_ACTIONS.VALIDATE_START });

      try {
        const result = await validateResetToken(currentToken); // Call the service to validate token

        // console.log("Token validation result:", result);

        if (result.valid) {
          // store the token in sessionStorage for page refresh
          sessionStorage.setItem('resetToken', currentToken);

          // only clean URL if token came from URL params (not sessionStorage)
          if (token) {
            window.history.replaceState({}, "", '/reset-password');
          }

          dispatch({ type: RESET_PASSWORD_ACTIONS.VALIDATE_SUCCESS });

        } else {
          // clear invalid sessionStorage token
          sessionStorage.removeItem('resetToken');
          // console.log('Dispatching VALIDATE_FAILURE with reason:', result.reason);

          dispatch({
            type: RESET_PASSWORD_ACTIONS.VALIDATE_FAILURE,
            payload: result.reason
          });
        }
      } catch (error) {
        // clear on validation error
        sessionStorage.removeItem('resetToken');

        dispatch({
          type: RESET_PASSWORD_ACTIONS.VALIDATE_FAILURE,
          payload: 'VALIDATION_ERROR'

        });
      }
    };

    validateToken();
  }, [token]);

  const handleReset = async (password, confirmPassword) => {
    const currentToken = getToken();

    if (!currentToken) {
      dispatch({
        type: RESET_PASSWORD_ACTIONS.RESET_FAILURE,
        payload: { message: RESET_PASSWORD_MESSAGES.INVALID_TOKEN }
      });
      return;
    }

    dispatch({ type: RESET_PASSWORD_ACTIONS.RESET_START });
    dispatch({ type: RESET_PASSWORD_ACTIONS.RESET_START });
    try {
      await resetPasswordRequest(currentToken, password, confirmPassword);

      // clear token on successful reset
      sessionStorage.removeItem('resetToken');

      dispatch({ type: RESET_PASSWORD_ACTIONS.RESET_SUCCESS });
    } catch (error) {
      let errorMessage = RESET_PASSWORD_MESSAGES.GENERIC_ERROR;
      const errorData = error.response?.data;

      if (errorData?.error === 'INVALID_TOKEN') {
        sessionStorage.removeItem('resetToken');
        errorMessage = RESET_PASSWORD_MESSAGES.INVALID_TOKEN;
      } else if (errorData?.error === 'TOKEN_EXPIRED') {
        sessionStorage.removeItem('resetToken');
        errorMessage = RESET_PASSWORD_MESSAGES.TOKEN_EXPIRED;
      } else if (errorData?.error) {
        errorMessage = errorData.error;
      }
      dispatch({ type: RESET_PASSWORD_ACTIONS.RESET_FAILURE, payload: { message: errorMessage } });
    }
  };

  const requestNewReset = useCallback(async () => {
    const currentToken = getToken();

    try {
      // Best-effort token finalization
      if (currentToken) {
        await api.post('/api/user/reset-password/finalize', {
          token: currentToken,
        });
      }
    } catch (err) {
      // Intentionally ignore
      // Token might already be expired or invalid
    } finally {
      sessionStorage.removeItem('resetToken');
      // Always navigate — do not leak outcome
      navigate('/forgot-password', { replace: true });
    }
  }, [navigate]);

  // clean up effect - clear storage when component unmounts
  useEffect(() => {
    return () => {
      if (!state.success || !state.expired && !state.invalid) {
        sessionStorage.removeItem('resetToken');
      }
    };
  }, [state.success, state.expired, state.invalid]);

  return { state, handleReset, requestNewReset };
};

