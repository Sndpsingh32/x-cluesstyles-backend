import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255).toLowerCase(),
});

export const updateUserSchema = createUserSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: 'Provide at least one field to update',
});
export const registerSchema = createUserSchema.extend({ password: z.string().min(8).max(72) });
export const loginSchema = z.object({
  email: z.string().trim().email().max(255).toLowerCase(),
  password: z.string().min(1),
});
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'email', 'created_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
