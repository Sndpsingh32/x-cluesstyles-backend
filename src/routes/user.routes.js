import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { validateBody } from '../middlewares/validate.js';
import { verifyJWT } from '../middlewares/auth.js';
import { updateProfileSchema } from '../models/user.schema.js';

/**
 * User profile routes — all protected by verifyJWT
 * -------------------------------------------------
 * GET  /users/profile  — get own profile
 * PATCH /users/profile — update profile / delivery address
 */
export const createUserRouter = ({ userController }) => {
  const router = Router();

  router.get(
    '/profile',
    verifyJWT,
    asyncHandler(userController.getProfile),
  );

  router.patch(
    '/profile',
    verifyJWT,
    validateBody(updateProfileSchema),
    asyncHandler(userController.updateProfile),
  );

  return router;
};
