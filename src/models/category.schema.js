import { z } from 'zod';

const slugify = (str) =>
  str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const slugField = z
  .string().trim().toLowerCase()
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens')
  .max(120)
  .optional();

const MAX_IMAGE_URL_LENGTH = 8192;

const imageField = z
  .string()
  .trim()
  .max(MAX_IMAGE_URL_LENGTH)
  .optional()
  .nullable()
  .transform((v) => (v === '' ? null : v));

const booleanField = z.preprocess(
  (v) => (v === 'true' || v === '1' || v === 1 ? true : v === 'false' || v === '0' || v === 0 ? false : v),
  z.boolean(),
);

const baseFields = {
  name:      z.string().trim().min(2).max(100),
  slug:      slugField,
  description: z.string().trim().max(500).optional().nullable(),
  image:     imageField,
  sortOrder: z.coerce.number().int().min(0).default(0),
};

const baseUpdateFields = {
  name:      z.string().trim().min(2).max(100),
  slug:      z.string().trim().toLowerCase()
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens')
    .max(120),
  description: z.string().trim().max(500).nullable(),
  image:     imageField,
  isActive:  booleanField,
  sortOrder: z.coerce.number().int().min(0),
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
const SORT_FIELDS = ['name', 'created', 'status', 'active', 'category', 'products'];
const SORT_DIRECTIONS = ['asc', 'desc'];

const paginatedQuerySchema = z.object({
  search: z.string().trim().optional(),
  q: z.string().trim().optional(),
  sortBy: z.enum(SORT_FIELDS).optional(),
  sort: z.enum(SORT_FIELDS).optional(),
  sortDir: z.enum(SORT_DIRECTIONS).optional(),
  dir: z.enum(SORT_DIRECTIONS).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  isActive: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  state: z.enum(['all', 'live', 'hidden']).optional(),
});

export const categoryQuerySchema = paginatedQuerySchema;

export const subCategoryQuerySchema = paginatedQuerySchema.extend({
  categoryId: z.string().uuid().optional(),
  dept: z.string().optional(),
});

export const subSubCategoryQuerySchema = paginatedQuerySchema.extend({
  subcategoryId: z.string().uuid().optional(),
  parent: z.string().optional(),
});
