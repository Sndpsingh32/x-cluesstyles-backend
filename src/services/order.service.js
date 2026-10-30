import { randomUUID } from 'node:crypto';
import { HTTP_STATUS } from '../constants/http-status.js';
import { createAppError } from '../utils/app-error.js';

export const createOrderService = ({ orderRepository }) =>
  Object.freeze({
    getAll: (filters = {}) => orderRepository.findAll(filters),

    getById: async (id) => {
      const order = await orderRepository.findById(id);
      if (!order) throw createAppError('Order not found', HTTP_STATUS.NOT_FOUND);
      return order;
    },

    create: async (data) => {
      const payload = {
        ...data,
        id: randomUUID(),
        slug: data.slug ?? null,
        category: data.category ?? null,
        subcategory: data.subcategory ?? null,
        customerName: data.customerName ?? null,
        phone: data.phone ?? null,
        notes: data.notes ?? null,
        orderType: data.orderType ?? 'plain',
        quantityMode: data.quantityMode ?? (data.orderType === 'bulk' ? 'bulk' : 'single'),
        quantity: Number(data.quantity ?? 1),
        unitPrice: Number(data.unitPrice ?? 0),
        totalPrice: Number(data.totalPrice ?? (Number(data.unitPrice ?? 0) * Number(data.quantity ?? 1))),
        status: data.status ?? 'pending',
        source: data.source ?? 'frontend',
        customization: data.customization ?? {},
      };

      if (!payload.productId || !payload.productName || !payload.color || !payload.size) {
        throw createAppError('Product, color and size are required', HTTP_STATUS.BAD_REQUEST);
      }

      if (payload.quantity < 1) {
        throw createAppError('Quantity must be at least 1', HTTP_STATUS.BAD_REQUEST);
      }

      if (!['plain', 'customize', 'bulk'].includes(payload.orderType)) {
        throw createAppError('Order type must be plain, customize or bulk', HTTP_STATUS.BAD_REQUEST);
      }

      return orderRepository.create(payload);
    },

    update: async (id, fields) => {
      const existing = await orderRepository.findById(id);
      if (!existing) throw createAppError('Order not found', HTTP_STATUS.NOT_FOUND);
      return orderRepository.update(id, fields);
    },

    delete: async (id) => {
      const existing = await orderRepository.findById(id);
      if (!existing) throw createAppError('Order not found', HTTP_STATUS.NOT_FOUND);
      await orderRepository.delete(id);
    },
  });
