import { HTTP_STATUS } from '../constants/http-status.js';
import { sendSuccess } from '../utils/api-response.js';

export const createOrderController = ({ orderService }) =>
  Object.freeze({
    getAll: async (req, res) => {
      const orders = await orderService.getAll(req.query);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Orders fetched successfully',
        data: { orders },
      });
    },

    getById: async (req, res) => {
      const order = await orderService.getById(req.params.id);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Order fetched successfully',
        data: { order },
      });
    },

    create: async (req, res) => {
      const order = await orderService.create(req.body);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.CREATED,
        message: 'Order created successfully',
        data: { order },
      });
    },

    update: async (req, res) => {
      const order = await orderService.update(req.params.id, req.body);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Order updated successfully',
        data: { order },
      });
    },

    delete: async (req, res) => {
      await orderService.delete(req.params.id);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Order deleted successfully',
        data: null,
      });
    },
  });
