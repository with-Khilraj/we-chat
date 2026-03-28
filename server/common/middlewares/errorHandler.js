const ApiError = require("../utils/ApiError");

const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  // Handle errors that are NOT an instance of ApiError
  if (!(err instanceof ApiError)) {
    // Standardize common error codes
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      statusCode = 401;
      message = "Unauthorized: Invalid or expired token";
    } else {
      statusCode = err.statusCode || (err.name === "ValidationError" ? 400 : 500);
      message = err.message || "Internal Server Error";
    }

    // Console log the original error for debugging in development
    if (process.env.NODE_ENV !== "production") {
      console.error(`[Error Handler] ${err.name}: ${err.message}`);
    }

    // Create a new ApiError instance for consistency
    err = new ApiError(statusCode, message, err?.errors || [], err.stack);
  }

  const response = {
    success: false,
    message: err.message,
    errors: err.errors,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
