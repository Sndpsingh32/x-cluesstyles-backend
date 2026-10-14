import { HTTP_STATUS } from '../constants/http-status.js';
import { createAppError } from '../utils/app-error.js';

export const createUserService = ({ userRepository }) =>
  Object.freeze({
    /**
     * Return the authenticated user's full profile.
     */
    getProfile: async (userId) => {
      const user = await userRepository.findById(userId);
      if (!user) throw createAppError('User not found', HTTP_STATUS.NOT_FOUND);
      return user;
    },

    /**
     * Update profile fields — any combination of:
     *   fullName, email, avatar, addressLine, city, state, pincode, country
     *
     * Guards:
     *   - If email is being changed, verify it isn't already taken by another user.
     */
    updateProfile: async (userId, fields) => {
      // Guard: email uniqueness check
      if (fields.email) {
        const taken = await userRepository.existsByEmail(fields.email, userId);
        if (taken) {
          throw createAppError('Email is already in use by another account', HTTP_STATUS.CONFLICT);
        }
      }

      const user = await userRepository.update(userId, fields);
      if (!user) throw createAppError('User not found', HTTP_STATUS.NOT_FOUND);
      return user;
    },
  });
