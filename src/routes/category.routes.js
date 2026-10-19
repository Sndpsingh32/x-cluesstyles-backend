import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { validateBody, validateQuery } from '../middlewares/validate.js';
import { verifyJWT, requireRole } from '../middlewares/auth.js';
import { upload, handleImageUpload } from '../middlewares/upload.js';
import {
  createCategorySchema,
  updateCategorySchema,
  createSubCategorySchema,
  updateSubCategorySchema,
  createSubSubCategorySchema,
  updateSubSubCategorySchema,
  categoryQuerySchema,
  subCategoryQuerySchema,
  subSubCategoryQuerySchema,
} from '../models/category.schema.js';

const adminGuard = [verifyJWT, requireRole('admin')];

// ---------------------------------------------------------------------------
// /categories
// ---------------------------------------------------------------------------
export const createCategoryRouter = ({ categoryController }) => {
  const router = Router();

  router.get('/tree',          asyncHandler(categoryController.getTree));
  router.get('/slug/:slug',    asyncHandler(categoryController.getBySlug));
  router.get('/:id',           asyncHandler(categoryController.getById));
  router.get('/',              validateQuery(categoryQuerySchema), asyncHandler(categoryController.getAll));
  router.post(
    '/',
    ...adminGuard,
    upload.single('image'),
    handleImageUpload('xcluesstyles/categories'),
    validateBody(createCategorySchema),
    asyncHandler(categoryController.create),
  );
  router.patch(
    '/:id',
    ...adminGuard,
    upload.single('image'),
    handleImageUpload('xcluesstyles/categories'),
    validateBody(updateCategorySchema),
    asyncHandler(categoryController.update),
  );
  router.delete('/:id',        ...adminGuard, asyncHandler(categoryController.delete));

  return router;
};

// ---------------------------------------------------------------------------
// /subcategories
// ---------------------------------------------------------------------------
export const createSubCategoryRouter = ({ subCategoryController }) => {
  const router = Router();

  router.get('/slug/:slug',    asyncHandler(subCategoryController.getBySlug));
  router.get('/:id',           asyncHandler(subCategoryController.getById));
  router.get('/',              validateQuery(subCategoryQuerySchema), asyncHandler(subCategoryController.getAll));
  router.post(
    '/',
    ...adminGuard,
    upload.single('image'),
    handleImageUpload('xcluesstyles/subcategories'),
    validateBody(createSubCategorySchema),
    asyncHandler(subCategoryController.create),
  );
  router.patch(
    '/:id',
    ...adminGuard,
    upload.single('image'),
    handleImageUpload('xcluesstyles/subcategories'),
    validateBody(updateSubCategorySchema),
    asyncHandler(subCategoryController.update),
  );
  router.delete('/:id',        ...adminGuard, asyncHandler(subCategoryController.delete));

  return router;
};

// ---------------------------------------------------------------------------
// /subsubcategories
// ---------------------------------------------------------------------------
export const createSubSubCategoryRouter = ({ subSubCategoryController }) => {
  const router = Router();

  router.get('/slug/:slug',    asyncHandler(subSubCategoryController.getBySlug));
  router.get('/:id',           asyncHandler(subSubCategoryController.getById));
  router.get('/',              validateQuery(subSubCategoryQuerySchema), asyncHandler(subSubCategoryController.getAll));
  router.post(
    '/',
    ...adminGuard,
    upload.single('image'),
    handleImageUpload('xcluesstyles/subsubcategories'),
    validateBody(createSubSubCategorySchema),
    asyncHandler(subSubCategoryController.create),
  );
  router.patch(
    '/:id',
    ...adminGuard,
    upload.single('image'),
    handleImageUpload('xcluesstyles/subsubcategories'),
    validateBody(updateSubSubCategorySchema),
    asyncHandler(subSubCategoryController.update),
  );
  router.delete('/:id',        ...adminGuard, asyncHandler(subSubCategoryController.delete));

  return router;
};
