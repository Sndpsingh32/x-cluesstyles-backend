import { HTTP_STATUS } from '../constants/http-status.js';
import { sendSuccess } from '../utils/api-response.js';

export const createUserController = ({ userService }) =>
  Object.freeze({
    /**
     * GET /users/profile
     * Returns the full profile of the currently authenticated user.
     */
    getProfile: async (req, res) => {
      const user = await userService.getProfile(req.user.id);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Profile fetched successfully',
        data: { user },
      });
    },

    /**
     * PATCH /users/profile
     * Body: any subset of { fullName, email, avatar, addressLine, city, state, pincode, country }
     *
     * Used both from:
     *   - The profile/settings page
     *   - The checkout page (to save delivery address on the fly)
     */
    updateProfile: async (req, res) => {
      const user = await userService.updateProfile(req.user.id, req.body);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Profile updated successfully',
        data: { user },
      });
    },
  });
