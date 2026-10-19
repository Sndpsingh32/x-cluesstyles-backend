import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { createAuthRouter } from './auth.routes.js';
import { createUserRouter } from './user.routes.js';
import {
  createCategoryRouter,
  createSubCategoryRouter,
  createSubSubCategoryRouter,
} from './category.routes.js';
import { createProductRouter } from './product.routes.js';
import { createUploadRouter } from './upload.routes.js';
import { createContainer } from '../container.js';

let _router;

const buildRouter = () => {
  const {
    authController,
    userController,
    healthController,
    categoryController,
    subCategoryController,
    subSubCategoryController,
    productController,
  } = createContainer();

  const router = Router();

  // Health — public
  router.get('/health', asyncHandler((req, res) => healthController.check(req, res)));

  // Auth — public
  router.use('/auth', createAuthRouter({ authController }));

  // Upload — admin
  router.use('/upload', createUploadRouter());

  // Users — JWT protected
  router.use('/users', createUserRouter({ userController }));

  // Categories — public read / admin write
  router.use('/categories',       createCategoryRouter({ categoryController }));
  router.use('/subcategories',    createSubCategoryRouter({ subCategoryController }));
  router.use('/subsubcategories', createSubSubCategoryRouter({ subSubCategoryController }));
  router.use('/products',         createProductRouter({ productController }));

  return router;
};

const lazyRouter = (req, res, next) => {
  if (!_router) _router = buildRouter();
  _router(req, res, next);
};

export default lazyRouter;
