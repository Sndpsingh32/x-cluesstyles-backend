import { HTTP_STATUS } from '../constants/http-status.js';
import { sendSuccess } from '../utils/api-response.js';

export const createSavedDesignController = ({ savedDesignService }) =>
  Object.freeze({
    /**
     * GET /designs?page=1&limit=20&status=saved&search=polo&sortBy=updatedAt&sortOrder=desc
     */
    getDesigns: async (req, res) => {
      const result = await savedDesignService.getDesigns(req.user.id, req.query);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Saved designs fetched successfully',
        data: result,
      });
    },

    /**
     * GET /designs/:designId
     */
    getDesignById: async (req, res) => {
      const design = await savedDesignService.getDesignById(req.user.id, req.params.designId);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Design fetched successfully',
        data: { design },
      });
    },

    /**
     * POST /designs
     */
    createDesign: async (req, res) => {
      const design = await savedDesignService.createDesign(req.user.id, req.body);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.CREATED,
        message: 'Design saved successfully',
        data: { design },
      });
    },

    /**
     * PATCH /designs/:designId
     */
    updateDesign: async (req, res) => {
      const design = await savedDesignService.updateDesign(req.user.id, req.params.designId, req.body);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Design updated successfully',
        data: { design },
      });
    },

    /**
     * DELETE /designs/:designId
     */
    deleteDesign: async (req, res) => {
      const result = await savedDesignService.deleteDesign(req.user.id, req.params.designId);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Design deleted successfully',
        data: result,
      });
    },

    /**
     * POST /designs/:designId/duplicate
     * "Save as New Design" — creates a fresh copy of an existing design
     */
    duplicateDesign: async (req, res) => {
      const design = await savedDesignService.duplicateDesign(req.user.id, req.params.designId, req.body);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.CREATED,
        message: 'Design duplicated as new design',
        data: { design },
      });
    },

    /**
     * GET /designs/count
     */
    countDesigns: async (req, res) => {
      const count = await savedDesignService.countDesigns(req.user.id);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Design count fetched',
        data: { count },
      });
    },
  });
