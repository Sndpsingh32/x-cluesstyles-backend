import test from 'node:test';
import assert from 'node:assert/strict';
import { categoryQuerySchema, subCategoryQuerySchema, subSubCategoryQuerySchema } from '../src/models/category.schema.js';

test('catalog query schemas accept backend-driven search, sort, and pagination params', () => {
  const category = categoryQuerySchema.parse({
    search: 'bags',
    sortBy: 'name',
    sortDir: 'desc',
    page: '2',
    limit: '20',
  });

  const subcategory = subCategoryQuerySchema.parse({
    categoryId: '8c6471f6-2c24-4048-aa63-fbae81844f7f',
    isActive: 'true',
    search: 'travel',
    sortBy: 'created',
    sortDir: 'desc',
    page: '1',
    limit: '10',
  });

  assert.equal(category.search, 'bags');
  assert.equal(category.sortBy, 'name');
  assert.equal(category.sortDir, 'desc');
  assert.equal(category.page, 2);
  assert.equal(category.limit, 20);

  assert.equal(subcategory.categoryId, '8c6471f6-2c24-4048-aa63-fbae81844f7f');
  assert.equal(subcategory.search, 'travel');
  assert.equal(subcategory.sortBy, 'created');
  assert.equal(subcategory.sortDir, 'desc');
  assert.equal(subcategory.page, 1);
  assert.equal(subcategory.limit, 10);

  const subSub = subSubCategoryQuerySchema.parse({
    subcategoryId: '8c6471f6-2c24-4048-aa63-fbae81844f7f',
    search: 'winter',
    sortBy: 'status',
    sortDir: 'asc',
    page: '3',
    limit: '5',
  });

  assert.equal(subSub.subcategoryId, '8c6471f6-2c24-4048-aa63-fbae81844f7f');
  assert.equal(subSub.search, 'winter');
  assert.equal(subSub.sortBy, 'status');
  assert.equal(subSub.sortDir, 'asc');
  assert.equal(subSub.page, 3);
  assert.equal(subSub.limit, 5);
});
