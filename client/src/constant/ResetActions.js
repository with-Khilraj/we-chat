export const RESET_PASSWORD_ACTIONS = {
  VALIDATE_START: 'VALIDATE_START',
  VALIDATE_SUCCESS: 'VALIDATE_SUCCESS',
  VALIDATE_FAILURE: 'VALIDATE_FAILURE',
  RESET_START: 'RESET_START',
  RESET_SUCCESS: 'RESET_SUCCESS',
  RESET_FAILURE: 'RESET_FAILURE',
};

export const RESET_PASSWORD_MESSAGES = {
  INVALID_TOKEN: 'Invalid or expired reset token. Please request a new reset link.',
  RESET_SUCCESS: 'Password reset successfully! You can now log in.',
  GENERIC_ERROR: 'An error occurred. Please try again.',
};