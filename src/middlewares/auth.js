import { createAppError } from '../utils/app-error.js';
import { verifyAccessToken } from '../utils/token.js';
import { asyncHandler } from '../utils/async-handler.js';
import { User } from '../models/user.model.js';

/**
 * verifyJWT
 * ---------
 * Validates the Bearer token, loads the user from DB, and attaches it to
 * req.user.  Any protected route must use this middleware.
 */
export const verifyJWT = asyncHandler(async (req, _res, next) => {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw createAppError('Authentication token is required', 401);
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    throw createAppError('Invalid or expired authentication token', 401);
  }

  const userId = decoded?.sub || decoded?.id;
  if (!userId) throw createAppError('Invalid token: missing subject', 401);

  const user = await User.findById(userId);
  if (!user) throw createAppError('User not found or account deleted', 401);

  req.user = user; // { id, phone, fullName, email, role, ... }
  next();
});

/**
 * requireRole(...roles)
 * ----------------------
 * Authorization guard — must be used AFTER verifyJWT.
 *
 * Usage:
 *   router.delete('/users/:id', verifyJWT, requireRole('admin'), handler)
 */
export const requireRole = (...roles) =>
  asyncHandler(async (req, _res, next) => {
    if (!roles.includes(req.user?.role)) {
      throw createAppError('You do not have permission to perform this action', 403);
    }
    next();
  });
