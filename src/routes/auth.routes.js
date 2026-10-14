import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { validateBody } from '../middlewares/validate.js';
import { sendOtpSchema, verifyOtpSchema } from '../models/user.schema.js';

/**
 * OTP auth routes
 * ---------------
 * POST /auth/send-otp    — request an OTP for a phone number
 * POST /auth/verify-otp  — submit the OTP, receive a JWT
 */
export const createAuthRouter = ({ authController }) => {
  const router = Router();

  router.post(
    '/send-otp',
    validateBody(sendOtpSchema),
    asyncHandler(authController.sendOtp),
  );

  router.post(
    '/verify-otp',
    validateBody(verifyOtpSchema),
    asyncHandler(authController.verifyOtp),
  );

  return router;
};
