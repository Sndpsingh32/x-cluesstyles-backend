import { createAppError } from '../utils/app-error.js';
import { verifyAccessToken } from '../utils/token.js';
import { asyncHandler } from '../utils/async-handler.js';
import { User } from '../models/user.model.js';

export const verifyJWT = asyncHandler(async (req, _res, next) => {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) throw createAppError('Authentication token is required', 401);
  try {
    const decodedToken = verifyAccessToken(token);
    const user = await User.findById(decodedToken.sub);
    if (!user) throw createAppError('Invalid access token', 401);
    req.user = user;
    next();
  } catch (error) {
    if (error.isOperational) throw error;
    return next(createAppError('Invalid or expired authentication token', 401));
  }
});
