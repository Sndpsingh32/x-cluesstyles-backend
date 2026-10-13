import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { HTTP_STATUS } from '../constants/http-status.js';
import { createAppError } from '../utils/app-error.js';
import { createAccessToken } from '../utils/token.js';

const credentials = (user) => ({ user, accessToken: createAccessToken(user), tokenType: 'Bearer' });

export const createAuthService = ({ userRepository }) => Object.freeze({
  register: async ({ name, email, password }) => {
    if (await userRepository.findByEmail(email)) throw createAppError('Email already exists', HTTP_STATUS.CONFLICT);
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await userRepository.create({ id: randomUUID(), name, email, passwordHash });
    return credentials(user);
  },
  login: async ({ email, password }) => {
    const user = await userRepository.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw createAppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
    }
    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    return credentials(safeUser);
  },
});
