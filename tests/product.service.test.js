import test from 'node:test';
import assert from 'node:assert/strict';
import { createProductService } from '../src/services/product.service.js';
import { createAuthService } from '../src/services/auth.service.js';
import { parseJsonField } from '../src/db/adapters/mysql.adapter.js';
import { createProductSchema } from '../src/models/product.schema.js';
import { createSubCategorySchema } from '../src/models/category.schema.js';


test('product service validates duplicate slugs before creating', async () => {
  const service = createProductService({
    productRepository: {
      existsBySlug: async () => true,
      create: async () => ({ id: 'p-1' }),
    },
  });

  await assert.rejects(
    () => service.create({ name: 'Test Product', slug: 'test-product' }),
    { message: 'Slug "test-product" already in use' },
  );
});

test('legacy plain-text product values do not crash JSON parsing', () => {
  assert.deepEqual(parseJsonField('Best Seller', []), []);
  assert.deepEqual(parseJsonField('["Red","Blue"]', []), ['Red', 'Blue']);
  assert.deepEqual(parseJsonField('{"fit":"regular"}', {}), { fit: 'regular' });
});

test('product schema rejects feature text longer than 120 chars', () => {
  const longFeature = 'A'.repeat(121);
  assert.throws(() => {
    createProductSchema.parse({
      name: 'Test Product',
      category: 'Apparel',
      slug: 'test-product',
      features: [longFeature],
      tags: [],
      colors: [],
      sizes: [],
      images: [],
      specifications: [],
      variants: [],
      active: true,
      featured: false,
      price: 100,
      stock: 10,
    });
  }, /features/);
});

test('product schema accepts a sub-subcategory and preserves it in payloads', () => {
  const parsed = createProductSchema.parse({
    name: 'Classic Polo',
    category: 'Apparel',
    subcategory: 'Polo T-shirt',
    subsubcategory: 'Solid Polo Neck Collar',
    slug: 'classic-polo',
    tags: [],
    colors: ['Black'],
    sizes: ['M'],
    images: [],
    specifications: [],
    variants: [],
    active: true,
    featured: false,
    price: 1200,
    stock: 20,
  });

  assert.equal(parsed.subsubcategory, 'Solid Polo Neck Collar');
});

test('subcategory schema accepts a long cloudinary image URL', () => {
  const longUrl = `https://res.cloudinary.com/demo/image/upload/${'a'.repeat(3000)}.webp`;
  const parsed = createSubCategorySchema.parse({
    name: 'Full Sleeve Shirt',
    categoryId: '8c6471f6-2c24-4048-aa63-fbae81844f7f',
    slug: 'full-sleeve-shirt',
    image: longUrl,
    description: 'test',
    sortOrder: 0,
    isActive: true,
  });

  assert.equal(parsed.image, longUrl);
});

test('auth service keeps the admin role when a known admin user signs in', async () => {
  let saved;
  const service = createAuthService({
    userRepository: {
      findByPhone: async () => ({ id: 'u-1', phone: '9999999999', role: 'admin', fullName: 'Admin User' }),
      create: async (payload) => {
        saved = payload;
        return { ...payload, role: payload.role || 'user', fullName: null };
      },
    },
  });

  const result = await service.verifyOtp({ phone: '9999999999', otp: '123456' });

  assert.equal(result.user.role, 'admin');
  assert.equal(result.accessToken.length > 0, true);
  assert.equal(saved, undefined);
});
