import { Router } from 'express';
import { upload } from '../middlewares/upload.js';
import { verifyJWT } from '../middlewares/auth.js';
import { uploadSingleImage, uploadMultipleImages } from '../services/upload.service.js';
import { createAppError } from '../utils/app-error.js';
import { HTTP_STATUS } from '../constants/http-status.js';
import { sendSuccess } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { env } from '../config/env.js';

/**
 * In development, allow testing upload endpoints freely.
 * In production or when Authorization header is supplied, enforce JWT authentication.
 */
const optionalAuthInDev = (req, res, next) => {
  if (req.headers.authorization) {
    return verifyJWT(req, res, next);
  }
  if (env.NODE_ENV !== 'production') {
    return next();
  }
  return verifyJWT(req, res, next);
};

export const createUploadRouter = () => {
  const router = Router();

  // ---------------------------------------------------------------------------
  // 1. Single Image Upload
  //    POST /api/v1/upload/single
  //    POST /api/v1/upload/image  (alias)
  //    Form field: 'image' or 'file'
  // ---------------------------------------------------------------------------
  const singleUploadHandler = asyncHandler(async (req, res) => {
    // Extract file from either 'image' or 'file' field
    const file =
      req.file ||
      req.files?.image?.[0] ||
      req.files?.file?.[0] ||
      (Array.isArray(req.files) ? req.files[0] : null);

    if (!file) {
      throw createAppError(
        'No image file provided. Please send an image in the form field "image" or "file".',
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const folder = req.body.folder || 'xcluesstyles/uploads';
    const result = await uploadSingleImage(file, { folder, req });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Image uploaded successfully',
      data: result,
    });
  });

  const singleUploadMiddleware = [
    optionalAuthInDev,
    upload.fields([
      { name: 'image', maxCount: 1 },
      { name: 'file',  maxCount: 1 },
    ]),
  ];

  router.post('/single', ...singleUploadMiddleware, singleUploadHandler);
  router.post('/image',  ...singleUploadMiddleware, singleUploadHandler);

  // ---------------------------------------------------------------------------
  // 2. Multiple Images Upload
  //    POST /api/v1/upload/multiple
  //    POST /api/v1/upload/images  (alias)
  //    Form field: 'images' or 'files' (up to 10 files)
  // ---------------------------------------------------------------------------
  const multipleUploadHandler = asyncHandler(async (req, res) => {
    // Collect all uploaded files from 'images' or 'files' fields
    let files = [];
    if (Array.isArray(req.files)) {
      files = req.files;
    } else if (req.files) {
      files = [
        ...(req.files.images || []),
        ...(req.files.files || []),
      ];
    }

    if (!files || files.length === 0) {
      throw createAppError(
        'No image files provided. Please send images in the form field "images" or "files".',
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const folder = req.body.folder || 'xcluesstyles/uploads';
    const uploadedImages = await uploadMultipleImages(files, { folder, req });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: `${uploadedImages.length} images uploaded successfully`,
      data: {
        count:  uploadedImages.length,
        images: uploadedImages,
      },
    });
  });

  const multipleUploadMiddleware = [
    optionalAuthInDev,
    upload.fields([
      { name: 'images', maxCount: 10 },
      { name: 'files',  maxCount: 10 },
    ]),
  ];

  router.post('/multiple', ...multipleUploadMiddleware, multipleUploadHandler);
  router.post('/images',   ...multipleUploadMiddleware, multipleUploadHandler);

  return router;
};
