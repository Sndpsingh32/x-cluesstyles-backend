import { HTTP_STATUS } from '../constants/http-status.js';
import { sendSuccess } from '../utils/api-response.js';

export const createAuthController = ({ authService }) => Object.freeze({
  register: async (req, res) => sendSuccess(res, { statusCode: HTTP_STATUS.CREATED, message: 'Registration successful', data: await authService.register(req.body) }),
  login: async (req, res) => sendSuccess(res, { message: 'Login successful', data: await authService.login(req.body) }),
});
