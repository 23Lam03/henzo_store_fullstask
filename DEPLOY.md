# 🚀 HƯỚNG DẪN DEPLOY HENZO STORE LÊN RENDER

Tài liệu này hướng dẫn deploy **2 service** lên Render:

| Service | Loại | Nhiệm vụ |
|---|---|---|
| `henzo-store-api` | Web Service (Node) | Backend TanStack Start + MongoDB |
| `henzo-store-web` | Static Site | Frontend React (Vite) |

---

## 📋 Trước khi bắt đầu

### 1. Đẩy code lên GitHub

```bash
cd /Users/leduclam/Documents/henzo_store_fullstask
git init                      # nếu chưa có repo
git add .
git commit -m "feat: chuan bi deploy Render"
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

> ⚠️ Kiểm tra `.gitignore` — file `.env` (chứa `MONGODB_URI` và JWT secrets)
> **không được** commit lên GitHub. `.gitignore` hiện tại đã loại `.env`.

### 2. Chuẩn bị giá trị cho biến môi trường

Lấy từ file `henzo_store_backend/.env` (file local của bạn):

```
MONGODB_URI         = mongodb+srv://...        (giữ nguyên, dùng chung DB)
JWT_ACCESS_SECRET   = <chuỗi bí mật ≥16 ký tự>
JWT_REFRESH_SECRET  = <chuỗi bí mật khác ≥16 ký tự>
```

---

## 🚀 Deploy

### Bước 1 — Tạo Blueprint

1. Vào [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**
2. Chọn repo GitHub vừa push → Render tự đọc file `render.yaml` ở gốc repo
3. Render hiển thị 2 service, các biến `sync: false` được đánh dấu **Required**
4. Nhập giá trị cho:
   - `MONGODB_URI`
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `CORS_ORIGINS` → tạm để trống, sẽ set ở Bước 4
   - `VITE_API_URL` → tạm để trống, sẽ set ở Bước 3
5. **Apply** → Render bắt đầu build cả 2 service

### Bước 2 — Chờ API sống và lấy domain API

Theo dõi log build của `henzo-store-api`. Khi deploy xong, domain sẽ có dạng:

```
https://henzo-store-api.onrender.com
```

Kiểm tra:
```bash
curl https://henzo-store-api.onrender.com/api/health
# {"success":true,"data":{"status":"ok","database":"connected",...}}
```

> 💡 **Lần deploy đầu tiên sẽ mất ~2–4 phút** vì Render cài dependency + build
> Vite + tải ảnh Wikimedia về cache nền.
>
> ℹ️ Free plan **sleep sau 15 phút** không có traffic. Lần request đầu tiên sẽ
> mất ~30–50 giây (Render khởi động lại container). Đó là hành vi bình thường.

### Bước 3 — Đặt `VITE_API_URL` cho frontend

Vào **henzo-store-web → Environment** → thêm:
```
VITE_API_URL = https://henzo-store-api.onrender.com/api
```

Rồi **Save** và **trigger deploy** (Manual Deploy → Deploy latest commit).

### Bước 4 — Đặt `CORS_ORIGINS` cho API

Vào **henzo-store-api → Environment** → sửa `CORS_ORIGINS`:
```
CORS_ORIGINS = https://henzo-store-web.onrender.com
```

> 📌 Domain frontend có dạng `https://henzo-store-web.onrender.com`.
> Nếu bạn đổi tên service thì dùng đúng domain mới.
>
> Nhiều domain: phân tách bằng dấu phẩy
> `CORS_ORIGINS = https://henzo-store-web.onrender.com,https://www.henzo.vn`

Rồi **Save** → **trigger deploy** lại API.

### Bước 5 — Kiểm tra

| Kiểm tra | URL | Kỳ vọng |
|---|---|---|
| API health | `https://henzo-store-api.onrender.com/api/health` | `status: ok` |
| API products | `https://henzo-store-api.onrender.com/api/products` | danh sách JSON |
| Website | `https://henzo-store-web.onrender.com` | trang chủ |
| Route sâu (SPA) | `https://henzo-store-web.onrender.com/products` | không 404 |
| Login | Mở DevTools → Application → Cookies | thấy `henzo_refresh_token` |

---

## ⚙️ Biến môi trường đầy đủ

### API (`henzo-store-api`)

| Biến | Giá trị | Ghi chú |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://...` | **Bắt buộc** — dùng chung DB với local |
| `JWT_ACCESS_SECRET` | random ≥16 ký tự | **Bắt buộc** |
| `JWT_REFRESH_SECRET` | random ≥16 ký tự | **Bắt buộc** |
| `CORS_ORIGINS` | `https://henzo-store-web.onrender.com` | **Bắt buộc** — domain frontend |
| `NODE_ENV` | `production` | Render đã set sẵn |
| `COOKIE_SECURE` | `true` | Bắt buộc khi deploy tách domain |
| `COOKIE_SAME_SITE` | `None` | Bắt buộc khi deploy tách domain |
| `COOKIE_NAME` | `henzo_refresh_token` | |
| `JWT_ACCESS_EXPIRES` | `15m` | |
| `JWT_REFRESH_EXPIRES` | `7d` | |
| `UPLOAD_STORE` | `mongo` | Lưu ảnh trong MongoDB (disk Render là ephemeral) |
| `UPLOAD_DIR` | `storage/uploads` | |
| `UPLOAD_MAX_SIZE` | `5242880` | 5MB |
| `UPLOAD_PUBLIC_PATH` | `/api/uploads` | |
| `IMAGE_CACHE_DIR` | `storage/image-cache` | |
| `IMAGE_CACHE_MAX_BYTES` | `419430400` | 400MB — Render free chỉ có ~1GB disk |
| `IMAGE_WARMUP` | `on` | Tải trước ảnh khi khởi động |
| `IMAGE_WARMUP_CONCURRENCY` | `3` | |

> Render tự sinh `PORT` — **đừng** set thủ công (nếu set sai, container không
> nhận traffic).

### Web (`henzo-store-web`)

| Biến | Giá trị | Ghi chú |
|---|---|---|
| `VITE_API_URL` | `https://henzo-store-api.onrender.com/api` | **Bắt buộc** |
| `VITE_BASE_PATH` | `/` | Render phục vụ ở domain gốc |

---

## 🔧 Những gì đã được xử lý sẵn cho production

### Backend

| Vấn đề | Cách xử lý |
|---|---|
| Render gán port động | `server.mjs` đọc `process.env.PORT`, bind `0.0.0.0` |
| Không có Node server cho TanStack Start | Thêm `server.mjs` bọc `dist/server/server.js` bằng `srvx/node` |
| CORS | Middleware ở tầng server + `corsMiddleware` của TanStack Start |
| Cookie cross-domain | `COOKIE_SAME_SITE=None` + `Secure` (mới thêm) |
| Disk ephemeral mất ảnh upload | Lưu ảnh trong MongoDB (`UploadedImage` model) |
| Disk ephemeral mất cache ảnh | `IMAGE_WARMUP` tải trước ảnh nền khi khởi động |
| Disk 1GB bị đầy | `IMAGE_CACHE_MAX_BYTES` tự dọn file cũ nhất |
| `SIGTERM` khi Render restart | Graceful shutdown trong `server.mjs` |
| Health check | `GET /api/health` → `{ status, database }` |

### Frontend

| Vấn đề | Cách xử lý |
|---|---|
| Base path cố định `/henzo_store/` | `VITE_BASE_PATH` env, mặc định dev vẫn giữ nguyên |
| F5 trên route sâu → 404 | Render `routes: rewrite /* -> /index.html` |
| Cache asset cũ | Header `Cache-Control: immutable` cho `/assets/*`, `no-cache` cho `/*` |
| Domain API khác domain | `VITE_API_URL` env |

---

## 🐛 Xử lý sự cố

### `MONGODB_URI` không kết nối được

Render có IP động → MongoDB Atlas cần cho phép `0.0.0.0/0` trong
**Network Access**, hoặc dùng **Allow access from anywhere**.

### Website gọi API bị lỗi CORS

- Kiểm tra `CORS_ORIGINS` của API có **đúng** domain frontend (có `https://`, không có `/` cuối)
- Kiểm tra `VITE_API_URL` của web có đúng `/api` ở cuối
- Trigger deploy lại cả 2 service sau khi sửa env

### Đăng nhập được nhưng refresh lại bị logout

`COOKIE_SAME_SITE` phải là `None` **và** `COOKIE_SECURE=true`.
Kiểm tra tab Application → Cookies trong DevTools.

### Ảnh hiển thị lỗi / bị 429

Cache ảnh bị xoá khi container restart (Render free plan). Warm up sẽ tự
tải lại trong vài phút. Nếu vẫn lỗi, tắt tạm `IMAGE_WARMUP` và kiểm tra log.

### Deploy API chậm / timeout

Free plan có 512MB RAM. Build Vite + SSR bundle (~3.6MB) hơi nặng nhưng vẫn
được. Nếu timeout, nâng lên `plan: starter`.

### Muốn deploy bằng Docker thay vì Blueprint

Không cần — `render.yaml` đã đủ. Nếu vẫn muốn, thêm `Dockerfile` vào
`henzo_store_backend/` với `CMD ["node", "server.mjs"]` và `EXPOSE $PORT`.

---

## 📊 Tài nguyên (Render Free Plan)

| Hạng mục | Giới hạn | Ảnh hưởng |
|---|---|---|
| RAM | 512MB | Ảnh 361MB cache + Node ≈ 250MB → cần quota cache |
| Disk | ~1GB (ephemeral) | Đã giới hạn cache 400MB |
| Sleep | 15 phút không traffic | Cold start ~30–50s |
| Build time | 30 phút | Build mất ~2–4 phút |
| Bandwidth | 100GB/tháng | |

---

## 🔄 Deploy lại sau khi sửa code

```bash
git add -A
git commit -m "fix: sua loi"
git push
```

Render tự động build lại (autoDeploy: true).

> 🔴 **Lưu ý:** mỗi lần deploy lại sẽ **xoá cache ảnh** (disk ephemeral).
> Lần truy cập đầu tiên sau deploy có thể chậm hơn một chút — warm up sẽ
> xử lý.
