import { HTTP_STATUS } from '../constants/http-status.js';
import { createAppError } from '../utils/app-error.js';

export const createUserService = ({ userRepository }) =>
  Object.freeze({
    /**
     * Create a user record for legacy flows and admin bootstrapping.
     */
    create: async (userData = {}) => {
      const { email, username, ...rest } = userData;
      const normalizedEmail = email?.trim().toLowerCase();
      const normalizedUsername = username?.trim().toLowerCase();

      if (normalizedEmail && userRepository.findByEmail) {
        const existingEmail = await userRepository.findByEmail(normalizedEmail);
        if (existingEmail) {
          throw createAppError('User with this email already exists', HTTP_STATUS.CONFLICT);
        }
      }

      if (normalizedUsername && userRepository.findByUsername) {
        const existingUser = await userRepository.findByUsername(normalizedUsername);
        if (existingUser) {
          throw createAppError('User with this username already exists', HTTP_STATUS.CONFLICT);
        }
      }

      const created = await userRepository.create({
        ...rest,
        email: normalizedEmail,
        username: normalizedUsername,
      });

      return created;
    },

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
