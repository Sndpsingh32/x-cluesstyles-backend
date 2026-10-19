import { z } from 'zod';

const FEATURE_TEXT_MAX = 120;
const SPEC_KEY_MAX = 80;
const SPEC_VALUE_MAX = 200;
const IMAGE_URL_MAX = 8192;

const slugify = (str) =>
  str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const slugField = z
  .string().trim().toLowerCase()
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens')
  .max(120)
  .optional();

const imageField = z
  .string().trim().max(IMAGE_URL_MAX).optional().nullable().transform((v) => (v === '' ? null : v));

const booleanField = z.preprocess(
  (v) => (v === 'true' || v === '1' || v === 1 ? true : v === 'false' || v === '0' || v === 0 ? false : v),
  z.boolean(),
);

const tagsField = z.array(z.string().trim().min(1).max(50)).default([]);
const jsonField = z.any().optional().nullable();

const productImageSchema = z.object({
  id: z.string().trim().optional(),
  url: z.string().trim().min(1).max(IMAGE_URL_MAX),
  alt: z.string().trim().max(200).optional().nullable(),
  isMain: z.boolean().optional().default(false),
});

const productVariantSizeSchema = z.object({
  id: z.string().trim().optional(),
  size: z.string().trim().min(1).max(40),
  sku: z.string().trim().max(80).optional().nullable(),
  regularPrice: z.coerce.number().min(0).optional().nullable(),
  salePrice: z.coerce.number().min(0).optional().nullable(),
  stock: z.coerce.number().int().min(0).optional().nullable(),
  active: z.boolean().optional().default(true),
});

const productVariantViewImageSchema = z.object({
  id: z.string().trim().optional(),
  label: z.string().trim().min(1).max(80),
  url: z.string().trim().min(1).max(IMAGE_URL_MAX),
});

const productVariantSchema = z.object({
  id: z.string().trim().optional(),
  color: z.string().trim().min(1).max(80),
  hex: z.string().trim().max(20).optional().nullable(),
  active: z.boolean().optional().default(true),
  images: z.array(z.string().trim().max(IMAGE_URL_MAX)).optional().default([]),
  viewImages: z.array(productVariantViewImageSchema).optional().default([]),
  sizes: z.array(productVariantSizeSchema).optional().default([]),
});

const bulkPricingTierSchema = z.object({
  id: z.string().trim().optional(),
  min: z.coerce.number().int().min(1).default(1),
  max: z.coerce.number().int().min(1).default(10),
  discount: z.coerce.number().min(0).max(100).default(0),
  price: z.coerce.number().min(0).default(0),
}).catchall(z.any());

const productCustomizationSchema = z.object({
  enabled: z.boolean().optional().default(true),
  bulkPricingTiers: z.array(bulkPricingTierSchema).optional().default([]),
  purchaseOptions: z.array(z.string().trim().max(80)).optional().default([]),
  supportedMethods: z.array(z.string().trim().max(80)).optional().default([]),
  placements: z.array(z.string().trim().max(80)).optional().default([]),
  allowedFileTypes: z.array(z.string().trim().max(50)).optional().default([]),
  maxUploadSizeMb: z.coerce.number().min(1).optional().nullable(),
  instructionField: z.boolean().optional().default(false),
  referenceImage: z.boolean().optional().default(false),
  previewConfig: z.string().trim().max(200).optional().nullable(),
  minimumOrderQty: z.coerce.number().int().min(1).optional().nullable(),
  pricing: z.record(z.any()).optional().nullable(),
}).catchall(z.any());

const productSpecificationSchema = z.object({
  id: z.string().trim().optional(),
  key: z.string().trim().min(1).max(SPEC_KEY_MAX),
  value: z.string().trim().max(SPEC_VALUE_MAX).optional().nullable(),
  type: z.string().trim().max(40).optional().nullable(),
  enabled: z.boolean().optional().default(true),
});

const productSeoSchema = z.object({
  seoTitle: z.string().trim().max(200).optional().nullable(),
  metaDescription: z.string().trim().max(500).optional().nullable(),
  keywords: z.string().trim().max(300).optional().nullable(),
  canonicalUrl: z.string().trim().max(500).optional().nullable(),
  visibility: z.string().trim().max(100).optional().nullable(),
  publishStatus: z.string().trim().max(60).optional().nullable(),
  scheduledAt: z.string().trim().max(60).optional().nullable(),
}).optional().nullable();

const baseFields = {
  name: z.string().trim().min(2).max(120),
  sku: z.string().trim().min(1).max(80).optional().nullable(),
  slug: slugField,
  category: z.string().trim().min(1).max(80),
  subcategory: z.string().trim().min(1).max(80).optional().nullable(),
  subsubcategory: z.string().trim().min(1).max(80).optional().nullable(),
  brand: z.string().trim().max(120).optional().nullable(),
  shortDescription: z.string().trim().max(500).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  type: z.string().trim().max(60).optional().nullable(),
  status: z.string().trim().max(40).optional().nullable(),
  image: imageField,
  thumbnail: z.string().trim().max(IMAGE_URL_MAX).optional().nullable(),
  price: z.coerce.number().min(0).default(0),
  compareAtPrice: z.coerce.number().min(0).optional().nullable(),
  salePrice: z.coerce.number().min(0).optional().nullable(),
  costPrice: z.coerce.number().min(0).optional().nullable(),
  taxCategory: z.string().trim().max(80).optional().nullable(),
  minOrderQty: z.coerce.number().int().min(0).optional().nullable(),
  stockManaged: z.boolean().optional().default(true),
  stock: z.coerce.number().int().min(0).default(0),
  backorder: z.boolean().optional().default(false),
  availability: z.string().trim().max(80).optional().nullable(),
  shippingWeight: z.string().trim().max(80).optional().nullable(),
  dimensions: z.string().trim().max(120).optional().nullable(),
  bulkPricing: z.string().trim().max(200).optional().nullable(),
  quantityDiscount: z.string().trim().max(200).optional().nullable(),
  couponEligible: z.boolean().optional().default(false),
  active: booleanField.default(true),
  featured: booleanField.default(false),
  tags: tagsField,
  colors: tagsField,
  sizes: tagsField,
  images: z.array(productImageSchema).optional().default([]),
  specifications: z.array(productSpecificationSchema).optional().default([]),
  features: z.array(z.string().trim().min(1).max(FEATURE_TEXT_MAX)).optional().default([]),
  variants: z.array(productVariantSchema).optional().default([]),
  attributes: jsonField,
  customization: productCustomizationSchema.optional().nullable(),
  seo: productSeoSchema,
  updatedAt: z.string().trim().max(40).optional().nullable(),
};

export const createProductSchema = z
  .object(baseFields)
  .transform((v) => ({ ...v, slug: v.slug ?? slugify(v.name) }));

export const updateProductSchema = z
  .object({
    ...baseFields,
    name: z.string().trim().min(2).max(120).optional(),
    category: z.string().trim().min(1).max(80).optional(),
    subcategory: z.string().trim().min(1).max(80).nullable().optional(),
    subsubcategory: z.string().trim().min(1).max(80).nullable().optional(),
    slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens').max(120),
    description: z.string().trim().max(2000).nullable().optional(),
    price: z.coerce.number().min(0),
    compareAtPrice: z.coerce.number().min(0).nullable().optional(),
    stock: z.coerce.number().int().min(0),
    active: booleanField,
    featured: booleanField,
    tags: tagsField,
    colors: tagsField,
    sizes: tagsField,
    attributes: jsonField,
    customization: productCustomizationSchema.optional().nullable(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field to update' });

export const productQuerySchema = z.object({
  active: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  featured: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  category: z.string().trim().optional(),
  subcategory: z.string().trim().optional(),
});
