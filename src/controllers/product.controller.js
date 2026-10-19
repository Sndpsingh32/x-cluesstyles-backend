import { HTTP_STATUS } from '../constants/http-status.js';
import { sendSuccess } from '../utils/api-response.js';

export const createProductController = ({ productService }) =>
  Object.freeze({
    getAll: async (req, res) => {
      const products = await productService.getAll(req.query);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Products fetched successfully',
        data: { products },
      });
    },

    getById: async (req, res) => {
      const product = await productService.getById(req.params.id);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Product fetched successfully',
        data: { product },
      });
    },

    getBySlug: async (req, res) => {
      const product = await productService.getBySlug(req.params.slug);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Product fetched successfully',
        data: { product },
      });
    },

    create: async (req, res) => {
      const product = await productService.create(req.body);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.CREATED,
        message: 'Product created successfully',
        data: { product },
      });
    },

    update: async (req, res) => {
      const product = await productService.update(req.params.id, req.body);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Product updated successfully',
        data: { product },
      });
    },

    delete: async (req, res) => {
      await productService.delete(req.params.id);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Product deleted successfully',
        data: null,
      });
    },
  });
