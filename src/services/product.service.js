import { randomUUID } from 'node:crypto';
import { HTTP_STATUS } from '../constants/http-status.js';
import { createAppError } from '../utils/app-error.js';

export const createProductService = ({ productRepository }) =>
  Object.freeze({
    getAll: (filters = {}) => productRepository.findAll(filters),

    getById: async (id) => {
      const product = await productRepository.findById(id);
      if (!product) throw createAppError('Product not found', HTTP_STATUS.NOT_FOUND);
      return product;
    },

    getBySlug: async (slug) => {
      const product = await productRepository.findBySlug(slug);
      if (!product) throw createAppError('Product not found', HTTP_STATUS.NOT_FOUND);
      return product;
    },

    create: async (data) => {
      const slug = (data.slug ?? data.name).toLowerCase().trim();
      if (!slug) throw createAppError('Product slug is required', HTTP_STATUS.BAD_REQUEST);
      const taken = await productRepository.existsBySlug(slug);
      if (taken) throw createAppError(`Slug "${slug}" already in use`, HTTP_STATUS.CONFLICT);
      return productRepository.create({ ...data, id: randomUUID(), slug });
    },

    update: async (id, fields) => {
      const existing = await productRepository.findById(id);
      if (!existing) throw createAppError('Product not found', HTTP_STATUS.NOT_FOUND);
      if (fields.slug && fields.slug !== existing.slug) {
        const taken = await productRepository.existsBySlug(fields.slug, id);
        if (taken) throw createAppError(`Slug "${fields.slug}" already in use`, HTTP_STATUS.CONFLICT);
      }
      return productRepository.update(id, fields);
    },

    delete: async (id) => {
      const existing = await productRepository.findById(id);
      if (!existing) throw createAppError('Product not found', HTTP_STATUS.NOT_FOUND);
      await productRepository.delete(id);
    },
  });
