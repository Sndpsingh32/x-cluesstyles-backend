import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { validateBody } from '../middlewares/validate.js';
import { verifyJWT, requireRole } from '../middlewares/auth.js';
import { saveStudioConfigSchema } from '../models/studioConfig.schema.js';

const adminGuard = [verifyJWT, requireRole('admin')];

/**
 * Design Studio configuration routes
 * ----------------------------------
 * GET /studio/config — public read (drives the storefront design studio)
 * PUT /studio/config — admin write (managed from the admin console)
 */
export const createStudioConfigRouter = ({ studioConfigController }) => {
  const router = Router();

  router.get('/config', asyncHandler(studioConfigController.getConfig));
  router.put(
    '/config',
    ...adminGuard,
    validateBody(saveStudioConfigSchema),
    asyncHandler(studioConfigController.saveConfig),
  );

  return router;
};
