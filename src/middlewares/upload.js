import multer from 'multer';
import { createAppError } from '../utils/app-error.js';
import { HTTP_STATUS } from '../constants/http-status.js';
import { uploadSingleImage } from '../services/upload.service.js';

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      createAppError(
        `Invalid file type (${file.mimetype}). Only JPEG, PNG, WEBP, GIF, and SVG images are allowed.`,
        HTTP_STATUS.BAD_REQUEST,
      ),
      false,
    );
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max per file
  fileFilter,
});

/**
 * Intercepts uploaded file in 'image' field, uploads it to Cloudinary (or local fallback),
 * and sets req.body.image to the URL.
 */
export const handleImageUpload = (folder = 'xcluesstyles/categories') => async (req, _res, next) => {
  try {
    if (req.body && req.body.image === '') {
      req.body.image = null;
    }

    if (req.file) {
      const uploadResult = await uploadSingleImage(req.file, { folder, req });
      req.body.image = uploadResult.url;
    }

    next();
  } catch (error) {
    next(error);
  }
};
