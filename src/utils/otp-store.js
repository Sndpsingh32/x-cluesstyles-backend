/**
 * In-memory OTP store with TTL expiry.
 * Key   : phone number (string)
 * Value : { otp, expiresAt }
 *
 * In production replace this with Redis (ioredis / upstash) so it
 * survives restarts and works across multiple server instances.
 */

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const store = new Map();

/** Save a fresh OTP for a phone number, overwriting any existing one. */
export const saveOtp = (phone, otp) => {
  store.set(phone, { otp, expiresAt: Date.now() + OTP_TTL_MS });
};

/**
 * Verify the OTP for a phone number.
 * Returns true and deletes the entry on success.
 * Returns false if missing, expired, or wrong.
 */
export const verifyOtp = (phone, otp) => {
  const entry = store.get(phone);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    store.delete(phone);
    return false;
  }
  if (entry.otp !== String(otp)) return false;
  store.delete(phone);
  return true;
};

/** Generate a random 6-digit OTP string. */
export const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));
