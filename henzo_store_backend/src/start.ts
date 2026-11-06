import { createStart } from '@tanstack/react-start';

export const startInstance = createStart(() => ({
  // Global request middleware — áp dụng cho MỌI request (SSR + server routes)
  requestMiddleware: [],
  functionMiddleware: [],
}));
