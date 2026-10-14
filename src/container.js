import { getDatabase } from './db/index.js';
import { createUserRepository } from './repositories/user.repository.js';
import { createUserService } from './services/user.service.js';
import { createUserController } from './controllers/user.controller.js';
import { createAuthService } from './services/auth.service.js';
import { createAuthController } from './controllers/auth.controller.js';
import { createHealthService } from './services/health.service.js';
import { createHealthController } from './controllers/health.controller.js';
import {
  createCategoryRepository,
  createSubCategoryRepository,
  createSubSubCategoryRepository,
} from './repositories/category.repository.js';
import {
  createCategoryService,
  createSubCategoryService,
  createSubSubCategoryService,
} from './services/category.service.js';
import {
  createCategoryController,
  createSubCategoryController,
  createSubSubCategoryController,
} from './controllers/category.controller.js';

export const createContainer = ({ db = getDatabase() } = {}) => {
  // --- Repositories ---
  const userRepository           = createUserRepository({ db });
  const categoryRepository       = createCategoryRepository({ db });
  const subCategoryRepository    = createSubCategoryRepository({ db });
  const subSubCategoryRepository = createSubSubCategoryRepository({ db });

  // --- Services ---
  const userService           = createUserService({ userRepository });
  const authService           = createAuthService({ userRepository });
  const healthService         = createHealthService({ db });
  const categoryService       = createCategoryService({ categoryRepository });
  const subCategoryService    = createSubCategoryService({ subCategoryRepository, categoryRepository });
  const subSubCategoryService = createSubSubCategoryService({ subSubCategoryRepository, subCategoryRepository });

  // --- Controllers ---
  const userController           = createUserController({ userService });
  const authController           = createAuthController({ authService });
  const healthController         = createHealthController({ healthService });
  const categoryController       = createCategoryController({ categoryService });
  const subCategoryController    = createSubCategoryController({ subCategoryService });
  const subSubCategoryController = createSubSubCategoryController({ subSubCategoryService });

  return Object.freeze({
    userRepository, categoryRepository, subCategoryRepository, subSubCategoryRepository,
    userService, authService, healthService, categoryService, subCategoryService, subSubCategoryService,
    userController, authController, healthController, categoryController, subCategoryController, subSubCategoryController,
  });
};
