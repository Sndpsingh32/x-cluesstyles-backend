import { HTTP_STATUS } from '../constants/http-status.js';
import { sendSuccess } from '../utils/api-response.js';

// ---------------------------------------------------------------------------
// Category controller (level 1)
// ---------------------------------------------------------------------------
export const createCategoryController = ({ categoryService }) =>
  Object.freeze({

    /** GET /categories/tree — full nested tree */
    getTree: async (req, res) => {
      const categories = await categoryService.getTree();
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Category tree fetched successfully',
        data: { categories },
      });
    },

    /** GET /categories */
    getAll: async (req, res) => {
      const categories = await categoryService.getAll(req.query);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Categories fetched successfully',
        data: { categories },
      });
    },

    /** GET /categories/:id — with nested subcategories + subsubcategories */
    getById: async (req, res) => {
      const category = await categoryService.getByIdWithChildren(req.params.id);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Category fetched successfully',
        data: { category },
      });
    },

    /** GET /categories/slug/:slug */
    getBySlug: async (req, res) => {
      const category = await categoryService.getBySlug(req.params.slug);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Category fetched successfully',
        data: { category },
      });
    },

    /** POST /categories  (admin) */
    create: async (req, res) => {
      const category = await categoryService.create(req.body);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.CREATED,
        message: 'Category created successfully',
        data: { category },
      });
    },

    /** PATCH /categories/:id  (admin) */
    update: async (req, res) => {
      const category = await categoryService.update(req.params.id, req.body);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Category updated successfully',
        data: { category },
      });
    },

    /** DELETE /categories/:id  (admin) — cascades subcategories + subsubcategories */
    delete: async (req, res) => {
      await categoryService.delete(req.params.id);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Category and all its subcategories deleted successfully',
        data: null,
      });
    },
  });

// ---------------------------------------------------------------------------
// SubCategory controller (level 2)
// ---------------------------------------------------------------------------
export const createSubCategoryController = ({ subCategoryService }) =>
  Object.freeze({

    /** GET /subcategories?categoryId=&isActive= */
    getAll: async (req, res) => {
      const subcategories = await subCategoryService.getAll(req.query);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'SubCategories fetched successfully',
        data: { subcategories },
      });
    },

    /** GET /subcategories/:id — with nested subsubcategories */
    getById: async (req, res) => {
      const subcategory = await subCategoryService.getByIdWithChildren(req.params.id);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'SubCategory fetched successfully',
        data: { subcategory },
      });
    },

    /** GET /subcategories/slug/:slug */
    getBySlug: async (req, res) => {
      const subcategory = await subCategoryService.getBySlug(req.params.slug);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'SubCategory fetched successfully',
        data: { subcategory },
      });
    },

    /** POST /subcategories  (admin) */
    create: async (req, res) => {
      const subcategory = await subCategoryService.create(req.body);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.CREATED,
        message: 'SubCategory created successfully',
        data: { subcategory },
      });
    },

    /** PATCH /subcategories/:id  (admin) */
    update: async (req, res) => {
      const subcategory = await subCategoryService.update(req.params.id, req.body);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'SubCategory updated successfully',
        data: { subcategory },
      });
    },

    /** DELETE /subcategories/:id  (admin) — cascades subsubcategories */
    delete: async (req, res) => {
      await subCategoryService.delete(req.params.id);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'SubCategory and all its subsubcategories deleted successfully',
        data: null,
      });
    },
  });

// ---------------------------------------------------------------------------
// SubSubCategory controller (level 3)
// ---------------------------------------------------------------------------
export const createSubSubCategoryController = ({ subSubCategoryService }) =>
  Object.freeze({

    /** GET /subsubcategories?subcategoryId=&isActive= */
    getAll: async (req, res) => {
      const subsubcategories = await subSubCategoryService.getAll(req.query);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'SubSubCategories fetched successfully',
        data: { subsubcategories },
      });
    },

    /** GET /subsubcategories/:id */
    getById: async (req, res) => {
      const subsubcategory = await subSubCategoryService.getById(req.params.id);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'SubSubCategory fetched successfully',
        data: { subsubcategory },
      });
    },

    /** GET /subsubcategories/slug/:slug */
    getBySlug: async (req, res) => {
      const subsubcategory = await subSubCategoryService.getBySlug(req.params.slug);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'SubSubCategory fetched successfully',
        data: { subsubcategory },
      });
    },

    /** POST /subsubcategories  (admin) */
    create: async (req, res) => {
      const subsubcategory = await subSubCategoryService.create(req.body);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.CREATED,
        message: 'SubSubCategory created successfully',
        data: { subsubcategory },
      });
    },

    /** PATCH /subsubcategories/:id  (admin) */
    update: async (req, res) => {
      const subsubcategory = await subSubCategoryService.update(req.params.id, req.body);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'SubSubCategory updated successfully',
        data: { subsubcategory },
      });
    },

    /** DELETE /subsubcategories/:id  (admin) */
    delete: async (req, res) => {
      await subSubCategoryService.delete(req.params.id);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'SubSubCategory deleted successfully',
        data: null,
      });
    },
  });
