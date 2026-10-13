import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const createAccessToken = (user) => jwt.sign({ sub: user.id, username: user.username, email: user.email }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
export const verifyAccessToken = (token) => jwt.verify(token, env.JWT_SECRET);
