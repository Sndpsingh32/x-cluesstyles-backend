import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------
const phone = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number');

const otp = z
  .string()
  .trim()
  .length(6, 'OTP must be 6 digits')
  .regex(/^\d{6}$/, 'OTP must contain only digits');

const pincode = z
  .string()
  .trim()
  .regex(/^\d{4,10}$/, 'Invalid pincode');

// ---------------------------------------------------------------------------
// OTP auth schemas
// ---------------------------------------------------------------------------

/** POST /auth/send-otp  — just the phone number */
export const sendOtpSchema = z.object({
  phone,
});

/** POST /auth/verify-otp  — phone + the 6-digit OTP */
export const verifyOtpSchema = z.object({
  phone,
  otp,
});

// ---------------------------------------------------------------------------
// Profile / user schemas
// ---------------------------------------------------------------------------

/**
 * PATCH /users/profile
 * All fields optional — user can update any subset at checkout or profile page.
 */
export const updateProfileSchema = z
  .object({
    fullName:    z.string().trim().min(2).max(100),
    email:       z.string().trim().email().max(255).toLowerCase(),
    avatar:      z.string().trim().url().max(2048),
    addressLine: z.string().trim().min(3).max(255),
    city:        z.string().trim().min(2).max(100),
    state:       z.string().trim().min(2).max(100),
    pincode,
    country:     z.string().trim().min(2).max(100),
  })
  .partial()
  .refine((val) => Object.keys(val).length > 0, {
    message: 'Provide at least one field to update',
  });

// ---------------------------------------------------------------------------
// Legacy schemas (kept for backwards-compat with existing auth.routes.js)
// ---------------------------------------------------------------------------
export const registerSchema = z.object({
  name:     z.string().trim().min(2).max(100),
  email:    z.string().trim().email().max(255).toLowerCase(),
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email:    z.string().trim().email().max(255).toLowerCase(),
  password: z.string().min(1),
});

export const paginationSchema = z.object({
  page:      z.coerce.number().int().min(1).default(1),
  limit:     z.coerce.number().int().min(1).max(100).default(20),
  sortBy:    z.enum(['name', 'email', 'created_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
