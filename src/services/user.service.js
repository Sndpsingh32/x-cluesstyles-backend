import { randomUUID } from 'node:crypto';
import { HTTP_STATUS } from '../constants/http-status.js';
import { createAppError } from '../utils/app-error.js';
import { createPageMeta, createPagination } from '../utils/pagination.js';

const requireUser = async (userRepository, id) => {
  const user = await userRepository.findById(id);
  if (!user) throw createAppError('User not found', HTTP_STATUS.NOT_FOUND);
  return user;
};

export const createUserService = ({ userRepository }) => Object.freeze({
  list: async (query) => {
    const pagination = createPagination(query, ['name', 'email', 'created_at']);
    const [users, total] = await Promise.all([userRepository.findAll(pagination), userRepository.count()]);
    return { users, meta: createPageMeta({ ...pagination, total }) };
  },
  getById: async (id) => {
    const user = await userRepository.findById(id);
    if (!user) throw createAppError('User not found', HTTP_STATUS.NOT_FOUND);
    return user;
  },
  create: async (input) => {
    if (await userRepository.findByEmail(input.email)) {
      throw createAppError('Email already exists', HTTP_STATUS.CONFLICT);
    }
    return userRepository.create({ id: randomUUID(), ...input });
  },
  update: async (id, input) => {
    await requireUser(userRepository, id);
    if (input.email) {
      const existing = await userRepository.findByEmail(input.email);
      if (existing && existing.id !== id) throw createAppError('Email already exists', HTTP_STATUS.CONFLICT);
    }
    return userRepository.update(id, input);
  },
  remove: async (id) => {
    await requireUser(userRepository, id);
    await userRepository.remove(id);
  },
});
