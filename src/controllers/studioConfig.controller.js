import { HTTP_STATUS } from '../constants/http-status.js';
import { sendSuccess } from '../utils/api-response.js';

export const createStudioConfigController = ({ studioConfigService }) =>
  Object.freeze({
    /** GET /studio/config — public */
    getConfig: async (req, res) => {
      const config = await studioConfigService.getConfig();
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Studio configuration fetched successfully',
        data: { config },
      });
    },

    /** PUT /studio/config — admin */
    saveConfig: async (req, res) => {
      const config = await studioConfigService.saveConfig(req.body);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Studio configuration saved successfully',
        data: { config },
      });
    },
  });
