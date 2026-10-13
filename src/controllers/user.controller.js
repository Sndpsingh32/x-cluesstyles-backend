import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { createAppError } from '../utils/app-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { User } from '../models/user.model.js';
import { createAccessToken } from '../utils/token.js';

const required = (value, name) => {
  if (!value?.trim()) throw createAppError(`${name} is required`, 400);
  return value.trim();
};

const registerUser = asyncHandler(async (req, res) => {
  const fullName = required(req.body.fullName, 'Full name');
  const username = required(req.body.username, 'Username').toLowerCase();
  const email = required(req.body.email, 'Email').toLowerCase();
  const password = required(req.body.password, 'Password');
  if (password.length < 8) throw createAppError('Password must be at least 8 characters', 400);
  if (await User.findByEmailOrUsername(email, username)) throw createAppError('User with this email or username already exists', 409);
  const user = await User.create({ id: randomUUID(), fullName, username, email, passwordHash: await bcrypt.hash(password, 12) });
  return res.status(201).json(new ApiResponse(201, user, 'User registered successfully'));
});

const loginUser = asyncHandler(async (req, res) => {
  const login = required(req.body.email || req.body.username, 'Email or username').toLowerCase();
  const password = required(req.body.password, 'Password');
  const user = await User.findByLogin(login);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw createAppError('Invalid user credentials', 401);
  const accessToken = createAccessToken(user);
  const safeUser = { id: user.id, fullName: user.fullName, username: user.username, email: user.email, avatar: user.avatar };
  return res.status(200).json(new ApiResponse(200, { user: safeUser, accessToken }, 'User logged in successfully'));
});

const getCurrentUser = asyncHandler(async (req, res) => res.status(200).json(new ApiResponse(200, req.user, 'User fetched successfully')));

const updateAccountDetails = asyncHandler(async (req, res) => {
  const fields = {};
  if (req.body.fullName !== undefined) fields.fullName = required(req.body.fullName, 'Full name');
  if (req.body.email !== undefined) {
    const email = required(req.body.email, 'Email').toLowerCase();
    const existing = await User.findByEmail(email);
    if (existing && existing.id !== req.user.id) throw createAppError('Email already exists', 409);
    fields.email = email;
  }
  if (!Object.keys(fields).length) throw createAppError('Provide fullName or email', 400);
  const user = await User.update(req.user.id, fields);
  return res.status(200).json(new ApiResponse(200, user, 'Account details updated successfully'));
});

export { registerUser, loginUser, getCurrentUser, updateAccountDetails };
