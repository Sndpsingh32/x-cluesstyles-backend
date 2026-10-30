import { z } from 'zod';

const customizationSchema = z.object({
  text: z.string().trim().max(200).optional().nullable(),
  note: z.string().trim().max(500).optional().nullable(),
  placement: z.string().trim().max(80).optional().nullable(),
  position: z.string().trim().max(80).optional().nullable(),
  designType: z.string().trim().max(80).optional().nullable(),
  color: z.string().trim().max(80).optional().nullable(),
  fileUrl: z.string().trim().max(2048).optional().nullable(),
  previewImage: z.string().trim().max(2048).optional().nullable(),
  printSlots: z.array(z.any()).optional().default([]),
  // Multi-view / multi-layer customization payloads (loosely typed JSON blobs,
  // persisted verbatim in the Mixed/JSON customization column).
  printingType: z.string().trim().max(80).optional().nullable(),
  texts: z.record(z.any()).optional().nullable(),
  textStyles: z.record(z.any()).optional().nullable(),
  textLayers: z.record(z.any()).optional().nullable(),
  logos: z.record(z.any()).optional().nullable(),
  viewDesigns: z.record(z.any()).optional().nullable(),
  views: z.record(z.any()).optional().nullable(),
  elements: z.array(z.any()).optional().nullable(),
  extra: z.record(z.any()).optional().default({}),
}).passthrough().default({});

const baseOrderSchema = z.object({
  productId: z.string().trim().min(1, 'Product is required'),
  productName: z.string().trim().min(1, 'Product name is required'),
  slug: z.string().trim().max(200).optional().nullable(),
  category: z.string().trim().max(80).optional().nullable(),
  subcategory: z.string().trim().max(80).optional().nullable(),
  color: z.string().trim().min(1, 'Color is required').max(80),
  size: z.string().trim().min(1, 'Size is required').max(40),
  quantity: z.coerce.number().int().min(1).default(1),
  orderType: z.enum(['plain', 'customize', 'bulk']).default('plain'),
  quantityMode: z.enum(['single', 'bulk']).optional().nullable(),
  unitPrice: z.coerce.number().min(0).default(0),
  totalPrice: z.coerce.number().min(0).default(0),
  status: z.string().trim().max(40).optional().nullable().default('pending'),
  source: z.string().trim().max(40).optional().nullable().default('frontend'),
  customerName: z.string().trim().max(120).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  customization: customizationSchema.optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const createOrderSchema = baseOrderSchema.transform((value) => ({
  ...value,
  orderType: value.orderType ?? 'plain',
  quantityMode: value.quantityMode ?? (value.orderType === 'bulk' ? 'bulk' : 'single'),
  totalPrice: Number(value.totalPrice ?? (Number(value.unitPrice ?? 0) * Number(value.quantity ?? 1))),
}));

export const updateOrderSchema = baseOrderSchema.partial();
