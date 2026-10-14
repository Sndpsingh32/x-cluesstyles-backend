import { sendSuccess } from '../utils/api-response.js';
import { HTTP_STATUS } from '../constants/http-status.js';

export const createHealthController = ({ healthService }) =>
  Object.freeze({
    check: async (_req, res) => {
      const data = await healthService.check();
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Server is healthy',
        data,
      });
    },
  });
