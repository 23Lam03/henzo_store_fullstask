import { AppError } from './errors';
import { fail } from './response';
import { ZodError } from 'zod';

export type ApiHandler = (
  ctx: any,
) => Response | Promise<Response>;

export function withErrorHandling(handler: ApiHandler): ApiHandler {
  return async (ctx: any) => {
    try {
      return await handler(ctx);
    } catch (err) {
      if (err instanceof AppError) {
        return fail(err.message, err.status, err.code, err.details);
      }
      if (err instanceof ZodError) {
        return fail(
          'Dữ liệu gửi lên không hợp lệ',
          422,
          'VALIDATION_ERROR',
          err.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        );
      }

      const anyErr = err as any;
      if (anyErr?.code === 11000) {
        return fail(
          'Dữ liệu đã tồn tại',
          409,
          'CONFLICT',
          anyErr?.keyValue,
        );
      }

      if (
        anyErr?.name === 'BSONError' ||
        anyErr?.name === 'CastError' ||
        /invalid ObjectId/i.test(String(anyErr?.message ?? ''))
      ) {
        return fail('Không tìm thấy dữ liệu', 404, 'NOT_FOUND');
      }

      console.error('[API ERROR]', err);
      return fail(
        'Đã xảy ra lỗi. Vui lòng thử lại!',
        500,
        'INTERNAL_ERROR',
      );
    }
  };
}
