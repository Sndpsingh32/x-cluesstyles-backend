import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Sign a JWT for the given user.
 * Payload carries: sub (userId), phone, role.
 */
export const createAccessToken = (user) =>
  jwt.sign(
    { sub: user.id, phone: user.phone, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN },
  );

export const verifyAccessToken = (token) => jwt.verify(token, env.JWT_SECRET);
