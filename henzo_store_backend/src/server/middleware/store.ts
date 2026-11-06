import { createMiddleware } from '@tanstack/react-start';
import { UserModel } from '../models/User';
import { StoreModel } from '../models/Store';
import { forbidden } from '../http/errors';

export const requireStoreOwner = createMiddleware().server(async ({ next, context, request }) => {
  const auth = (context as any)?.auth as
    | { userId: string; role: string; storeId?: string }
    | undefined;

  if (!auth) {
    return Response.json(
      {
        success: false,
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Chưa đăng nhập' },
      },
      { status: 401 },
    );
  }

  if (auth.role !== 'SHOP' && auth.role !== 'ADMIN') {
    return Response.json(
      {
        success: false,
        data: null,
        error: { code: 'FORBIDDEN', message: 'Chỉ cửa hàng mới được truy cập' },
      },
      { status: 403 },
    );
  }

  if (auth.role === 'ADMIN') {
    const url = new URL(request.url);
    const requested = url.searchParams.get('storeId')?.trim();
    const storeId = requested || undefined;

    if (storeId) {
      const store = await StoreModel.findById(storeId)
        .select('status name')
        .lean();

      if (!store) {
        return Response.json(
          {
            success: false,
            data: null,
            error: { code: 'NOT_FOUND', message: 'Không tìm thấy cửa hàng' },
          },
          { status: 404 },
        );
      }
    }

    return next({
      context: { storeScope: storeId } as any,
    });
  }

  if (!auth.storeId) {
    return Response.json(
      {
        success: false,
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'Tài khoản chưa được liên kết với cửa hàng',
        },
      },
      { status: 403 },
    );
  }

  const store = await StoreModel.findById(auth.storeId)
    .select('status name')
    .lean();

  if (!store) {
    return Response.json(
      {
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Không tìm thấy cửa hàng' },
      },
      { status: 404 },
    );
  }

  if (store.status !== 'active') {
    return Response.json(
      {
        success: false,
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: `Cửa hàng "${store.name}" đang tạm ngưng. Vui lòng liên hệ quản trị viên.`,
        },
      },
      { status: 403 },
    );
  }

  return next({
    context: { storeScope: auth.storeId } as any,
  });
});
