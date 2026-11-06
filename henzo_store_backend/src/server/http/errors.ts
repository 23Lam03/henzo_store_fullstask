
export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    message: string,
    status = 400,
    code = 'BAD_REQUEST',
    details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError(message, 400, 'BAD_REQUEST', details);

export const unauthorized = (message = 'Chưa đăng nhập') =>
  new AppError(message, 401, 'UNAUTHORIZED');

export const forbidden = (message = 'Không có quyền truy cập') =>
  new AppError(message, 403, 'FORBIDDEN');

export const notFound = (message = 'Không tìm thấy dữ liệu') =>
  new AppError(message, 404, 'NOT_FOUND');

export const conflict = (message: string) =>
  new AppError(message, 409, 'CONFLICT');

export const unprocessable = (message: string, details?: unknown) =>
  new AppError(message, 422, 'UNPROCESSABLE', details);

export const tooManyRequests = (message = 'Quá nhiều yêu cầu') =>
  new AppError(message, 429, 'TOO_MANY_REQUESTS');

export const internal = (message = 'Đã xảy ra lỗi. Vui lòng thử lại!') =>
  new AppError(message, 500, 'INTERNAL_ERROR');
