export class ApiResponse {
  constructor(statusCode, data, message = 'Success', meta) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
    if (meta) this.meta = meta;
  }
}

export const sendSuccess = (res, { statusCode = 200, data = null, message = 'Success', meta } = {}) => res.status(statusCode).json(new ApiResponse(statusCode, data, message, meta));
