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
import { createProductRepository } from './repositories/product.repository.js';
import { createProductService } from './services/product.service.js';
import { createProductController } from './controllers/product.controller.js';
import { createOrderRepository } from './repositories/order.repository.js';
import { createOrderService } from './services/order.service.js';
import { createOrderController } from './controllers/order.controller.js';

export const createContainer = ({ db = getDatabase() } = {}) => {
  // --- Repositories ---
  const userRepository           = createUserRepository({ db });
  const categoryRepository       = createCategoryRepository({ db });
  const subCategoryRepository    = createSubCategoryRepository({ db });
  const subSubCategoryRepository = createSubSubCategoryRepository({ db });
  const productRepository        = createProductRepository({ db });
  const orderRepository         = createOrderRepository({ db });

  // --- Services ---
  const userService           = createUserService({ userRepository });
  const authService           = createAuthService({ userRepository });
  const healthService         = createHealthService({ db });
  const categoryService       = createCategoryService({ categoryRepository });
  const subCategoryService    = createSubCategoryService({ subCategoryRepository, categoryRepository });
  const subSubCategoryService = createSubSubCategoryService({ subSubCategoryRepository, subCategoryRepository });
  const productService        = createProductService({ productRepository });
  const orderService          = createOrderService({ orderRepository });

  // --- Controllers ---
  const userController           = createUserController({ userService });
  const authController           = createAuthController({ authService });
  const healthController         = createHealthController({ healthService });
  const categoryController       = createCategoryController({ categoryService });
  const subCategoryController    = createSubCategoryController({ subCategoryService });
  const subSubCategoryController = createSubSubCategoryController({ subSubCategoryService });
  const productController        = createProductController({ productService });
  const orderController          = createOrderController({ orderService });

  return Object.freeze({
    userRepository, categoryRepository, subCategoryRepository, subSubCategoryRepository, productRepository, orderRepository,
    userService, authService, healthService, categoryService, subCategoryService, subSubCategoryService, productService, orderService,
    userController, authController, healthController, categoryController, subCategoryController, subSubCategoryController, productController, orderController,
  });
};
