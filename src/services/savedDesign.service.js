import { HTTP_STATUS } from '../constants/http-status.js';
import { createAppError } from '../utils/app-error.js';

const PAGE_LIMIT = 20;

export const createSavedDesignService = ({ savedDesignRepository }) =>
  Object.freeze({
    /**
     * Get paginated saved designs for a user.
     */
    getDesigns: async (userId, query = {}) => {
      const page     = Math.max(1, Number(query.page)  || 1);
      const limit    = Math.min(100, Math.max(1, Number(query.limit) || PAGE_LIMIT));
      const status   = query.status   || undefined;
      const productId= query.productId|| undefined;
      const category = query.category || undefined;
      const printingMethod = query.printingMethod || undefined;
      const search   = query.search   || undefined;
      const sortBy   = ['updatedAt', 'createdAt', 'designName', 'productName'].includes(query.sortBy)
        ? query.sortBy : 'updatedAt';
      const sortOrder= query.sortOrder === 'asc' ? 'asc' : 'desc';

      const { items, total } = await savedDesignRepository.findAllByUser(userId, {
        page, limit, status, productId, category, printingMethod, search, sortBy, sortOrder,
      });

      return {
        designs: items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      };
    },

    /**
     * Get a single design — verifies ownership.
     */
    getDesignById: async (userId, designId) => {
      const design = await savedDesignRepository.findById(designId);
      if (!design) throw createAppError('Design not found', HTTP_STATUS.NOT_FOUND);
      if (design.userId !== userId)
        throw createAppError('Forbidden — this design belongs to another user', HTTP_STATUS.FORBIDDEN);
      return design;
    },

    /**
     * Create a new saved design.
     */
    createDesign: async (userId, payload = {}) => {
      const data = {
        userId,
        designName:    payload.designName    || 'My Design',
        status:        payload.status        || 'saved',
        productId:     payload.productId,
        productName:   payload.productName,
        productSlug:   payload.productSlug   || payload.slug || null,
        category:      payload.category      || null,
        subcategory:   payload.subcategory   || null,
        color:         payload.color         || null,
        size:          payload.size          || null,
        quantity:      Number(payload.quantity || 1),
        orderType:     payload.orderType     || 'customize',
        printingMethod:payload.printingMethod|| null,
        price:         Number(payload.price  || 0),
        totalPrice:    Number(payload.totalPrice || 0),
        editorConfig:  payload.editorConfig  || {},
        customization: payload.customization || {},
        viewImages:    payload.viewImages    || {},
        previewImage:  payload.previewImage  || payload.customization?.previewImage || null,
        notes:         payload.notes         || null,
      };

      if (!data.productId || !data.productName) {
        throw createAppError('productId and productName are required', HTTP_STATUS.BAD_REQUEST);
      }

      return savedDesignRepository.create(data);
    },

    /**
     * Update an existing saved design — verifies ownership.
     */
    updateDesign: async (userId, designId, fields = {}) => {
      const existing = await savedDesignRepository.findById(designId);
      if (!existing) throw createAppError('Design not found', HTTP_STATUS.NOT_FOUND);
      if (existing.userId !== userId)
        throw createAppError('Forbidden', HTTP_STATUS.FORBIDDEN);

      // Merge nested objects instead of replacing
      const updatePayload = { ...fields };
      if (fields.editorConfig) {
        updatePayload.editorConfig = { ...existing.editorConfig, ...fields.editorConfig };
      }
      if (fields.customization) {
        updatePayload.customization = { ...existing.customization, ...fields.customization };
      }
      if (fields.viewImages) {
        updatePayload.viewImages = { ...existing.viewImages, ...fields.viewImages };
      }

      return savedDesignRepository.update(designId, updatePayload);
    },

    /**
     * Soft-delete a saved design — verifies ownership.
     */
    deleteDesign: async (userId, designId) => {
      const existing = await savedDesignRepository.findById(designId);
      if (!existing) throw createAppError('Design not found', HTTP_STATUS.NOT_FOUND);
      if (existing.userId !== userId)
        throw createAppError('Forbidden', HTTP_STATUS.FORBIDDEN);
      await savedDesignRepository.softDelete(designId);
      return { deleted: true, id: designId };
    },

    /**
     * Count total saved designs for a user.
     */
    countDesigns: async (userId) => savedDesignRepository.countByUser(userId),

    /**
     * Duplicate a design as a new separate record ("Save as New").
     */
    duplicateDesign: async (userId, designId, overrides = {}) => {
      const existing = await savedDesignRepository.findById(designId);
      if (!existing) throw createAppError('Design not found', HTTP_STATUS.NOT_FOUND);
      if (existing.userId !== userId)
        throw createAppError('Forbidden', HTTP_STATUS.FORBIDDEN);

      const { id, createdAt, updatedAt, ...rest } = existing;
      return savedDesignRepository.create({
        ...rest,
        userId,
        designName: overrides.designName || `${rest.designName} (copy)`,
        status: 'saved',
        ...overrides,
      });
    },
  });
