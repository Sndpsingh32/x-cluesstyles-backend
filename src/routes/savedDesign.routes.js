import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { verifyJWT } from '../middlewares/auth.js';

/**
 * Saved Design routes — all JWT-protected
 * -----------------------------------------
 * GET    /designs            — list user's designs (pagination, filter, search)
 * GET    /designs/count      — count user's designs
 * GET    /designs/:designId  — get single design
 * POST   /designs            — save a new design
 * PATCH  /designs/:designId  — update design
 * DELETE /designs/:designId  — soft-delete design
 * POST   /designs/:designId/duplicate — duplicate as new design
 */
export const createSavedDesignRouter = ({ savedDesignController }) => {
  const router = Router();

  // All routes require authentication
  router.use(verifyJWT);

  router.get('/count',              asyncHandler(savedDesignController.countDesigns));
  router.get('/',                   asyncHandler(savedDesignController.getDesigns));
  router.get('/:designId',          asyncHandler(savedDesignController.getDesignById));
  router.post('/',                  asyncHandler(savedDesignController.createDesign));
  router.patch('/:designId',        asyncHandler(savedDesignController.updateDesign));
  router.put('/:designId',          asyncHandler(savedDesignController.updateDesign));
  router.delete('/:designId',       asyncHandler(savedDesignController.deleteDesign));
  router.post('/:designId/duplicate', asyncHandler(savedDesignController.duplicateDesign));

  return router;
};
