import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { validateBody, validateQuery } from '../middlewares/validate.js';
import { verifyJWT, requireRole } from '../middlewares/auth.js';
import { createProductSchema, updateProductSchema, productQuerySchema } from '../models/product.schema.js';

const adminGuard = [verifyJWT, requireRole('admin')];

export const createProductRouter = ({ productController }) => {
  const router = Router();

  router.get('/slug/:slug', asyncHandler(productController.getBySlug));
  router.get('/:id', asyncHandler(productController.getById));
  router.get('/', validateQuery(productQuerySchema), asyncHandler(productController.getAll));
  router.post('/', ...adminGuard, validateBody(createProductSchema), asyncHandler(productController.create));
  router.patch('/:id', ...adminGuard, validateBody(updateProductSchema), asyncHandler(productController.update));
  router.delete('/:id', ...adminGuard, asyncHandler(productController.delete));

  return router;
};
