import { randomUUID } from 'node:crypto';
import { HTTP_STATUS } from '../constants/http-status.js';
import { createAppError } from '../utils/app-error.js';

const normalizeCustomizations = (customizations = []) =>
  Array.isArray(customizations) ? customizations : [];

const buildCustomizationEntry = (payload = {}) => {
  const next = { ...payload };
  if (!next.id) next.id = randomUUID();
  if (!next.savedAt) next.savedAt = new Date().toISOString();
  if (next.quantity === undefined || next.quantity === null) next.quantity = 1;
  if (!next.customization || typeof next.customization !== 'object') next.customization = {};
  if (!next.previewImage && next.customization.previewImage) next.previewImage = next.customization.previewImage;
  if (!next.price && next.price !== 0) next.price = Number(next.price ?? 0);
  if (!next.totalPrice && next.totalPrice !== 0) next.totalPrice = Number(next.totalPrice ?? Number(next.price ?? 0) * Number(next.quantity ?? 1));
  return next;
};

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

    getCustomizations: async (userId) => {
      const user = await userRepository.findById(userId);
      if (!user) throw createAppError('User not found', HTTP_STATUS.NOT_FOUND);
      return normalizeCustomizations(user.customizations);
    },

    saveCustomization: async (userId, payload = {}) => {
      const user = await userRepository.findById(userId);
      if (!user) throw createAppError('User not found', HTTP_STATUS.NOT_FOUND);

      const customizations = normalizeCustomizations(user.customizations);
      const entry = buildCustomizationEntry(payload);
      const next = [entry, ...customizations.filter((item) => item.id !== entry.id)];

      const updatedUser = await userRepository.update(userId, { customizations: next });
      return normalizeCustomizations(updatedUser.customizations);
    },

    getCustomizationById: async (userId, customizationId) => {
      const user = await userRepository.findById(userId);
      if (!user) throw createAppError('User not found', HTTP_STATUS.NOT_FOUND);

      const customization = normalizeCustomizations(user.customizations)
        .find((item) => item.id === customizationId);

      if (!customization) throw createAppError('Customization not found', HTTP_STATUS.NOT_FOUND);
      return customization;
    },

    updateCustomization: async (userId, customizationId, fields = {}) => {
      const user = await userRepository.findById(userId);
      if (!user) throw createAppError('User not found', HTTP_STATUS.NOT_FOUND);

      const customizations = normalizeCustomizations(user.customizations);
      const index = customizations.findIndex((item) => item.id === customizationId);
      if (index === -1) throw createAppError('Customization not found', HTTP_STATUS.NOT_FOUND);

      const nextItem = buildCustomizationEntry({
        ...customizations[index],
        ...fields,
        customization: {
          ...(customizations[index].customization ?? {}),
          ...(fields.customization ?? {}),
        },
        savedAt: new Date().toISOString(),
      });

      const nextCustomizations = customizations.map((item) => (item.id === customizationId ? nextItem : item));
      const updatedUser = await userRepository.update(userId, { customizations: nextCustomizations });
      return normalizeCustomizations(updatedUser.customizations).find((item) => item.id === customizationId);
    },

    deleteCustomization: async (userId, customizationId) => {
      const user = await userRepository.findById(userId);
      if (!user) throw createAppError('User not found', HTTP_STATUS.NOT_FOUND);

      const customizations = normalizeCustomizations(user.customizations).filter((item) => item.id !== customizationId);
      const updatedUser = await userRepository.update(userId, { customizations });
      return normalizeCustomizations(updatedUser.customizations);
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
