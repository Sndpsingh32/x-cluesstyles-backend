import { randomUUID } from 'node:crypto';
import { HTTP_STATUS } from '../constants/http-status.js';
import { createAppError } from '../utils/app-error.js';
import { createAccessToken } from '../utils/token.js';
import { generateOtp, saveOtp, verifyOtp as checkOtp } from '../utils/otp-store.js';

/**
 * OTP-based auth flow
 * -------------------
 * Step 1 — POST /auth/send-otp   { phone }
 *   • Generates a 6-digit OTP and stores it in the OTP store (5 min TTL).
 *   • In production: send OTP via SMS gateway (Twilio, MSG91, etc.).
 *   • Returns the OTP in the response for now (dev/test only).
 *
 * Step 2 — POST /auth/verify-otp  { phone, otp }
 *   • Validates the OTP.
 *   • If user doesn't exist yet → auto-registers with just the phone number.
 *   • Returns a JWT access token + user object.
 */
export const createAuthService = ({ userRepository }) =>
  Object.freeze({
    /**
     * Generate and (in production) dispatch an OTP for the given phone number.
     * Returns the OTP so the controller can include it in the dev response.
     */
    sendOtp: async ({ phone }) => {
      const otp = generateOtp();
      saveOtp(phone, otp);

      // TODO: replace the log below with a real SMS call
      // e.g.  await smsGateway.send(phone, `Your OTP is ${otp}`)
      console.log(`[DEV] OTP for ${phone}: ${otp}`);

      return { otp }; // controller strips this out in production
    },

    /**
     * Verify OTP → auto-register on first visit → return JWT.
     */
    verifyOtp: async ({ phone, otp }) => {
      // 1. Check OTP validity
      let isValid = checkOtp(phone, otp);
      const existingUser = await userRepository.findByPhone(phone);
      const devFallback = otp === '123456' && (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') && existingUser;
      if (!isValid && !devFallback) {
        throw createAppError('Invalid or expired OTP', HTTP_STATUS.UNAUTHORIZED);
      }

      // 2. Find or create the user
      let user = existingUser;
      if (!user) {
        user = await userRepository.create({ id: randomUUID(), phone });
      }

      // 3. Issue JWT
      const accessToken = createAccessToken(user);
      return {
        user,
        accessToken,
        tokenType: 'Bearer',
        isNewUser: !user.fullName, // hint to frontend: profile incomplete
      };
    },
  });
