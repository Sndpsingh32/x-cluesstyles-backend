import { randomUUID } from 'node:crypto';
import { HTTP_STATUS } from '../constants/http-status.js';
import { createAppError } from '../utils/app-error.js';

// ---------------------------------------------------------------------------
// Category service (level 1)
// ---------------------------------------------------------------------------
export const createCategoryService = ({ categoryRepository }) =>
  Object.freeze({

    getTree: () => categoryRepository.findTree(),

    getAll: (filters) => categoryRepository.findAll(filters),

    getById: async (id) => {
      const cat = await categoryRepository.findById(id);
      if (!cat) throw createAppError('Category not found', HTTP_STATUS.NOT_FOUND);
      return cat;
    },

    getByIdWithChildren: async (id) => {
      const cat = await categoryRepository.findByIdWithChildren(id);
      if (!cat) throw createAppError('Category not found', HTTP_STATUS.NOT_FOUND);
      return cat;
    },

    getBySlug: async (slug) => {
      const cat = await categoryRepository.findBySlug(slug);
      if (!cat) throw createAppError('Category not found', HTTP_STATUS.NOT_FOUND);
      return cat;
    },

    create: async (data) => {
      const slugTaken = await categoryRepository.existsBySlug(data.slug);
      if (slugTaken) throw createAppError(`Slug "${data.slug}" already in use`, HTTP_STATUS.CONFLICT);
      return categoryRepository.create({ ...data, id: randomUUID() });
    },

    update: async (id, fields) => {
      const existing = await categoryRepository.findById(id);
      if (!existing) throw createAppError('Category not found', HTTP_STATUS.NOT_FOUND);
      if (fields.slug && fields.slug !== existing.slug) {
        const taken = await categoryRepository.existsBySlug(fields.slug, id);
        if (taken) throw createAppError(`Slug "${fields.slug}" already in use`, HTTP_STATUS.CONFLICT);
      }
      return categoryRepository.update(id, fields);
    },

    delete: async (id) => {
      const existing = await categoryRepository.findById(id);
      if (!existing) throw createAppError('Category not found', HTTP_STATUS.NOT_FOUND);
      await categoryRepository.delete(id);
    },
  });

// ---------------------------------------------------------------------------
// SubCategory service (level 2)
// ---------------------------------------------------------------------------
export const createSubCategoryService = ({ subCategoryRepository, categoryRepository }) =>
  Object.freeze({

    getAll: (filters) => subCategoryRepository.findAll(filters),

    getById: async (id) => {
      const sub = await subCategoryRepository.findById(id);
      if (!sub) throw createAppError('SubCategory not found', HTTP_STATUS.NOT_FOUND);
      return sub;
    },

    getByIdWithChildren: async (id) => {
      const sub = await subCategoryRepository.findByIdWithChildren(id);
      if (!sub) throw createAppError('SubCategory not found', HTTP_STATUS.NOT_FOUND);
      return sub;
    },

    getBySlug: async (slug) => {
      const sub = await subCategoryRepository.findBySlug(slug);
      if (!sub) throw createAppError('SubCategory not found', HTTP_STATUS.NOT_FOUND);
      return sub;
    },

    create: async (data) => {
      // FK check — category must exist
      const parent = await categoryRepository.findById(data.categoryId);
      if (!parent) throw createAppError('Parent category not found', HTTP_STATUS.NOT_FOUND);

      const slugTaken = await subCategoryRepository.existsBySlug(data.slug);
      if (slugTaken) throw createAppError(`Slug "${data.slug}" already in use`, HTTP_STATUS.CONFLICT);

      return subCategoryRepository.create({ ...data, id: randomUUID() });
    },

    update: async (id, fields) => {
      const existing = await subCategoryRepository.findById(id);
      if (!existing) throw createAppError('SubCategory not found', HTTP_STATUS.NOT_FOUND);
      if (fields.slug && fields.slug !== existing.slug) {
        const taken = await subCategoryRepository.existsBySlug(fields.slug, id);
        if (taken) throw createAppError(`Slug "${fields.slug}" already in use`, HTTP_STATUS.CONFLICT);
      }
      return subCategoryRepository.update(id, fields);
    },

    delete: async (id) => {
      const existing = await subCategoryRepository.findById(id);
      if (!existing) throw createAppError('SubCategory not found', HTTP_STATUS.NOT_FOUND);
      await subCategoryRepository.delete(id);
    },
  });

// ---------------------------------------------------------------------------
// SubSubCategory service (level 3)
// ---------------------------------------------------------------------------
export const createSubSubCategoryService = ({ subSubCategoryRepository, subCategoryRepository }) =>
  Object.freeze({

    getAll: (filters) => subSubCategoryRepository.findAll(filters),

    getById: async (id) => {
      const subsub = await subSubCategoryRepository.findById(id);
      if (!subsub) throw createAppError('SubSubCategory not found', HTTP_STATUS.NOT_FOUND);
      return subsub;
    },

    getBySlug: async (slug) => {
      const subsub = await subSubCategoryRepository.findBySlug(slug);
      if (!subsub) throw createAppError('SubSubCategory not found', HTTP_STATUS.NOT_FOUND);
      return subsub;
    },

    create: async (data) => {
      // FK check — subcategory must exist
      const parent = await subCategoryRepository.findById(data.subcategoryId);
      if (!parent) throw createAppError('Parent subcategory not found', HTTP_STATUS.NOT_FOUND);

      const slugTaken = await subSubCategoryRepository.existsBySlug(data.slug);
      if (slugTaken) throw createAppError(`Slug "${data.slug}" already in use`, HTTP_STATUS.CONFLICT);

      return subSubCategoryRepository.create({ ...data, id: randomUUID() });
    },

    update: async (id, fields) => {
      const existing = await subSubCategoryRepository.findById(id);
      if (!existing) throw createAppError('SubSubCategory not found', HTTP_STATUS.NOT_FOUND);
      if (fields.slug && fields.slug !== existing.slug) {
        const taken = await subSubCategoryRepository.existsBySlug(fields.slug, id);
        if (taken) throw createAppError(`Slug "${fields.slug}" already in use`, HTTP_STATUS.CONFLICT);
      }
      return subSubCategoryRepository.update(id, fields);
    },

    delete: async (id) => {
      const existing = await subSubCategoryRepository.findById(id);
      if (!existing) throw createAppError('SubSubCategory not found', HTTP_STATUS.NOT_FOUND);
      await subSubCategoryRepository.delete(id);
    },
  });
