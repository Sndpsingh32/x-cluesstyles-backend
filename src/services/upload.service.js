import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { uploadBufferToCloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

const ensureUploadsDir = async () => {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch {
    // Directory already exists
  }
};

/**
 * Upload a single image file buffer:
 * - Uses Cloudinary if configured.
 * - Automatically falls back to local disk (/uploads/) if Cloudinary is not configured yet.
 */
export const uploadSingleImage = async (file, { folder = 'xcluesstyles/uploads', req } = {}) => {
  if (isCloudinaryConfigured()) {
    const result = await uploadBufferToCloudinary(file.buffer, { folder });
    return {
      storage:      'cloudinary',
      url:          result.secure_url,
      publicId:     result.public_id,
      format:       result.format,
      width:        result.width,
      height:       result.height,
      bytes:        result.bytes,
      originalName: file.originalname,
    };
  }

  // Local fallback for smooth development without requiring Cloudinary setup immediately
  await ensureUploadsDir();
  const ext = path.extname(file.originalname) || '.jpg';
  const filename = `${randomUUID()}${ext}`;
  const filePath = path.join(UPLOADS_DIR, filename);
  await fs.writeFile(filePath, file.buffer);

  const baseUrl = req ? `${req.protocol}://${req.get('host')}` : 'http://localhost:3000';
  const url = `${baseUrl}/uploads/${filename}`;

  return {
    storage:      'local',
    url,
    filename,
    bytes:        file.size,
    originalName: file.originalname,
    mimetype:     file.mimetype,
    note:         'Uploaded locally. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env for direct Cloudinary storage.',
  };
};

/**
 * Upload multiple image files concurrently
 */
export const uploadMultipleImages = async (files, options = {}) => {
  return Promise.all(files.map((file) => uploadSingleImage(file, options)));
};
