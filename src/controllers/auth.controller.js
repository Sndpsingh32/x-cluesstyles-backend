import { HTTP_STATUS } from '../constants/http-status.js';
import { sendSuccess } from '../utils/api-response.js';
import { env } from '../config/env.js';

export const createAuthController = ({ authService }) =>
  Object.freeze({
    /**
     * POST /auth/send-otp
     * Body: { phone }
     *
     * Dev:  returns the OTP in the response so you can test without SMS.
     * Prod: only returns a success message — OTP goes via SMS.
     */
    sendOtp: async (req, res) => {
      const { otp } = await authService.sendOtp(req.body);

      const data =
        env.NODE_ENV !== 'production'
          ? { message: 'OTP sent successfully', otp } // visible in dev/test
          : { message: 'OTP sent successfully' };     // hidden in production

      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'OTP sent successfully',
        data,
      });
    },

    /**
     * POST /auth/verify-otp
     * Body: { phone, otp }
     *
     * Verifies the OTP, auto-registers the user if first visit,
     * and returns a JWT access token.
     */
    verifyOtp: async (req, res) => {
      const result = await authService.verifyOtp(req.body);

      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: result.isNewUser
          ? 'Login successful. Please complete your profile.'
          : 'Login successful',
        data: {
          user:        result.user,
          accessToken: result.accessToken,
          tokenType:   result.tokenType,
          isNewUser:   result.isNewUser,
        },
      });
    },
  });
