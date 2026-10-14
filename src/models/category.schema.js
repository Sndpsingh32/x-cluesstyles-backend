import { z } from 'zod';

const slugify = (str) =>
  str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const slugField = z
  .string().trim().toLowerCase()
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens')
  .max(120)
  .optional();

const baseFields = {
  name:        z.string().trim().min(2).max(100),
  slug:        slugField,
  description: z.string().trim().max(500).optional().nullable(),
  image:       z.string().trim().url().max(2048).optional().nullable(),
  sortOrder:   z.coerce.number().int().min(0).default(0),
};

const baseUpdateFields = {
  name:        z.string().trim().min(2).max(100),
  slug:        z.string().trim().toLowerCase()
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens')
    .max(120),
  description: z.string().trim().max(500).nullable(),
  image:       z.string().trim().url().max(2048).nullable(),
  isActive:    z.boolean(),
  sortOrder:   z.coerce.number().int().min(0),
};

// ---------------------------------------------------------------------------
// Category (level 1)
// ---------------------------------------------------------------------------
export const createCategorySchema = z
  .object(baseFields)
  .transform((v) => ({ ...v, slug: v.slug ?? slugify(v.name) }));

export const updateCategorySchema = z
  .object(baseUpdateFields)
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field to update' });

// ---------------------------------------------------------------------------
// SubCategory (level 2) — requires categoryId
// ---------------------------------------------------------------------------
export const createSubCategorySchema = z
  .object({ ...baseFields, categoryId: z.string().uuid('categoryId must be a valid UUID') })
  .transform((v) => ({ ...v, slug: v.slug ?? slugify(v.name) }));

export const updateSubCategorySchema = z
  .object(baseUpdateFields)
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field to update' });

// ---------------------------------------------------------------------------
// SubSubCategory (level 3) — requires subcategoryId
// ---------------------------------------------------------------------------
export const createSubSubCategorySchema = z
  .object({ ...baseFields, subcategoryId: z.string().uuid('subcategoryId must be a valid UUID') })
  .transform((v) => ({ ...v, slug: v.slug ?? slugify(v.name) }));

export const updateSubSubCategorySchema = z
  .object(baseUpdateFields)
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field to update' });

// ---------------------------------------------------------------------------
// Query params
// ---------------------------------------------------------------------------
export const categoryQuerySchema = z.object({
  isActive: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
});

export const subCategoryQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
  isActive:   z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
});

export const subSubCategoryQuerySchema = z.object({
  subcategoryId: z.string().uuid().optional(),
  isActive:      z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
});
