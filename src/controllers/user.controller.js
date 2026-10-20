import bcrypt from 'bcryptjs';
import { HTTP_STATUS } from '../constants/http-status.js';
import { sendSuccess } from '../utils/api-response.js';
import { getDatabase } from '../db/index.js';

export const registerUser = async (req, res, next) => {
  try {
    const db = getDatabase();
    const { fullName, username, email, password } = req.body ?? {};

    if (!fullName || !username || !email || !password) {
      return res.status(400).json({ statusCode: 400, message: 'Missing required registration fields' });
    }

    const normalizedName = fullName.trim();
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await db.users.findByEmailOrUsername?.(normalizedUsername, normalizedEmail)
      ?? await db.users.findByEmail?.(normalizedEmail)
      ?? await db.users.findByUsername?.(normalizedUsername);

    if (existing) {
      const error = new Error('User with this email or username already exists');
      if (typeof next === 'function') {
        return next(error);
      }
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.users.create({
      id: crypto?.randomUUID?.() ?? String(Date.now()),
      fullName: normalizedName,
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
    });

    return res.status(201).json({
      statusCode: 201,
      message: 'User registered successfully',
      data: {
        id: user.id,
        fullName: user.fullName ?? normalizedName,
        username: user.username ?? normalizedUsername,
        email: user.email ?? normalizedEmail,
      },
    });
  } catch (error) {
    return next(error);
  }
};

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

    getCustomizations: async (req, res) => {
      const customizations = await userService.getCustomizations(req.user.id);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Saved customizations fetched successfully',
        data: { customizations },
      });
    },

    saveCustomization: async (req, res) => {
      const customizations = await userService.saveCustomization(req.user.id, req.body);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.CREATED,
        message: 'Customization saved successfully',
        data: { customizations },
      });
    },

    getCustomizationById: async (req, res) => {
      const customization = await userService.getCustomizationById(req.user.id, req.params.customizationId);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Customization fetched successfully',
        data: { customization },
      });
    },

    updateCustomization: async (req, res) => {
      const customization = await userService.updateCustomization(req.user.id, req.params.customizationId, req.body);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Customization updated successfully',
        data: { customization },
      });
    },

    deleteCustomization: async (req, res) => {
      const customizations = await userService.deleteCustomization(req.user.id, req.params.customizationId);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Customization deleted successfully',
        data: { customizations },
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
