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
    avatar:      z.union([z.string().trim().url().max(8192), z.literal('')]).optional(),
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

export const savedCustomizationSchema = z.object({
  id: z.string().trim().uuid().optional(),
  productId: z.string().trim().min(1, 'Product is required').max(200),
  productName: z.string().trim().min(1, 'Product name is required').max(200),
  slug: z.string().trim().max(200).optional().nullable(),
  category: z.string().trim().max(120).optional().nullable(),
  subcategory: z.string().trim().max(120).optional().nullable(),
  color: z.string().trim().max(80).optional().nullable(),
  size: z.string().trim().max(40).optional().nullable(),
  quantity: z.coerce.number().int().min(1).default(1),
  orderType: z.enum(['plain', 'customize', 'bulk']).default('customize'),
  price: z.coerce.number().min(0).optional().default(0),
  totalPrice: z.coerce.number().min(0).optional().default(0),
  customization: z.object({
    text: z.string().trim().max(200).optional().nullable(),
    note: z.string().trim().max(500).optional().nullable(),
    placement: z.string().trim().max(80).optional().nullable(),
    position: z.string().trim().max(80).optional().nullable(),
    designType: z.string().trim().max(80).optional().nullable(),
    color: z.string().trim().max(80).optional().nullable(),
    fileUrl: z.string().trim().max(2048).optional().nullable(),
    previewImage: z.string().trim().max(2048).optional().nullable(),
    printSlots: z.array(z.any()).optional().default([]),
    // Multi-view / multi-layer customization payloads (loosely typed JSON blobs).
    printingType: z.string().trim().max(80).optional().nullable(),
    texts: z.record(z.any()).optional().nullable(),
    textStyles: z.record(z.any()).optional().nullable(),
    textLayers: z.record(z.any()).optional().nullable(),
    logos: z.record(z.any()).optional().nullable(),
    viewDesigns: z.record(z.any()).optional().nullable(),
    views: z.record(z.any()).optional().nullable(),
    elements: z.array(z.any()).optional().nullable(),
    extra: z.record(z.any()).optional().default({}),
  }).passthrough().default({}),
  notes: z.string().trim().max(1000).optional().nullable(),
  previewImage: z.string().trim().max(2048).optional().nullable(),
  savedAt: z.string().trim().datetime().optional(),
}).passthrough();

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
