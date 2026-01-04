import { useReducer, useEffect } from 'react';
import { validateResetToken, resetPasswordRequest } from '../services/resetPasswordService';
import { RESET_PASSWORD_ACTIONS, RESET_PASSWORD_MESSAGES } from '../constant/ResetActions';

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
        loading: false,  valid: true, invalid: false, 
        expired: false, success: false, error: null 
      };
    case RESET_PASSWORD_ACTIONS.VALIDATE_FAILURE:
      return { 
        loading: false, valid: false, 
        invalid: action.payload === 'INVALID_TOKEN', 
        expired: action.payload === 'TOKEN_EXPIRED', 
        success: false, 
        error: RESET_PASSWORD_MESSAGES.INVALID_TOKEN 
      };
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
        error: action.payload || RESET_PASSWORD_MESSAGES.GENERIC_ERROR 
      };
    default:
      return state;
  }
};

export const useResetPassword = (token) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const validate = async () => {
      dispatch({ type: RESET_PASSWORD_ACTIONS.VALIDATE_START });
      try {
        const valid = await validateResetToken(token); // assuming it returns a boolean

        // const { valid } = await validateResetToken(token); // if it returns an object from service

        dispatch({ type: valid ? RESET_PASSWORD_ACTIONS.VALIDATE_SUCCESS : RESET_PASSWORD_ACTIONS.VALIDATE_FAILURE });
      } catch (error) {
        dispatch({ type: RESET_PASSWORD_ACTIONS.VALIDATE_FAILURE });
      }
    };
    if (token) validate();
  }, [token]);

  const handleReset = async (password, confirmPassword) => {
    dispatch({ type: RESET_PASSWORD_ACTIONS.RESET_START });
    try {
      await resetPasswordRequest(token, password, confirmPassword);
      dispatch({ type: RESET_PASSWORD_ACTIONS.RESET_SUCCESS });
    } catch (error) {
      dispatch({ type: RESET_PASSWORD_ACTIONS.RESET_FAILURE, payload: error.response?.data?.error });
    }
  };

  return { state, handleReset };
};