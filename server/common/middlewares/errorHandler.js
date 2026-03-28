const ApiError = require("../utils/ApiError");

const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  // Handle errors that are NOT an instance of ApiError
  if (!(err instanceof ApiError)) {
    statusCode = err.statusCode || (err.name === "ValidationError" ? 400 : 500);
    message = err.message || "Internal Server Error";
    
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
