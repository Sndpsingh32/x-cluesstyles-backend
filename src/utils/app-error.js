export const createAppError = (message, statusCode = 500, details) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  error.isOperational = true;
  return error;
};
