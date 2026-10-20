import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/async-handler.js';
import { validateBody, validateQuery } from '../middlewares/validate.js';
import { verifyJWT, requireRole } from '../middlewares/auth.js';
import { createOrderSchema, updateOrderSchema } from '../models/order.schema.js';

const adminGuard = [verifyJWT, requireRole('admin')];

export const createOrderRouter = ({ orderController }) => {
  const router = Router();

  router.get('/', validateQuery(z.object({}).passthrough().optional()), asyncHandler(orderController.getAll));
  router.get('/:id', asyncHandler(orderController.getById));
  router.post('/', validateBody(createOrderSchema), asyncHandler(orderController.create));
  router.patch('/:id', ...adminGuard, validateBody(updateOrderSchema), asyncHandler(orderController.update));
  router.delete('/:id', ...adminGuard, asyncHandler(orderController.delete));

  return router;
};
