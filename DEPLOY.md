# 🚀 HƯỚNG DẪN DEPLOY HENZO STORE LÊN RENDER (CHI TIẾT TỪNG BƯỚC)

> Tài liệu này dành cho người **chưa từng deploy lên Render**.
> Mỗi bước đều có ảnh chụp mô tả và giá trị cần điền sẵn — chỉ cần copy/paste.

**Repo đã push sẵn:** `https://github.com/23Lam03/henzo_store_fullstask`
**Commit hiện tại:** `9547252`

---

## 📚 NỘI DUNG

1. [Hiểu trước khi bắt đầu](#1-hiểu-trước-khi-bắt-đầu)
2. [Bước 0 — Đăng nhập Render](#2-bước-0--đăng-nhập-render)
3. [Bước 1 — Tạo Blueprint](#3-bước-1--tạo-blueprint)
4. [Bước 2 — Điền biến môi trường API](#4-bước-2--điền-biến-môi-trường-api)
5. [Bước 3 — Chờ API sống](#5-bước-3--chờ-api-sống)
6. [Bước 4 — Điền VITE_API_URL cho web](#6-bước-4--điền-vite_api_url-cho-web)
7. [Bước 5 — Điền CORS_ORIGINS cho API](#7-bước-5--điền-cors_origins-cho-api)
8. [Bước 6 — Kiểm tra tổng thể](#8-bước-6--kiểm-tra-tổng-thể)
9. [Bước 7 — Đăng nhập lần đầu (test thật)](#9-bước-7--đăng-nhập-lần-đầu-test-thật)
10. [Xử lý sự cố](#-xử-lý-sự-cố)
11. [Câu hỏi thường gặp](#-câu-hỏi-thường-gặp)
12. [Phụ lục — Nâng cấp plan](#-phụ-lục--nâng-cấp-plan)

---

## 1. Hiểu trước khi bắt đầu

### Hệ thống sẽ có 2 service riêng biệt

```
                    ┌──────────────────────────────┐
                    │   henzo-store-web.onrender.com│  ← Static Site (React SPA)
                    │   (frontend, CDN toàn cầu)    │
                    └───────────────┬──────────────┘
                                    │ fetch() + Authorization header
                                    │ + cookie refresh token
                                    ▼
                    ┌──────────────────────────────┐
                    │ henzo-store-api.onrender.com  │  ← Web Service (Node)
                    │   (TanStack Start + MongoDB)  │
                    └───────────────┬──────────────┘
                                    │
                                    ▼
                    ┌──────────────────────────────┐
                    │  MongoDB Atlas (cluster M0)   │
                    └──────────────────────────────┘
```

**Vì sao tách 2 service?**
- Frontend là SPA tĩnh → Render Static Site phục vụ qua CDN, **miễn phí, không sleep**, cực nhanh.
- Backend cần Node process + kết nối MongoDB → Web Service.
- Tách ra giúp CORS rõ ràng và scale độc lập.

### 4 thứ bạn cần chuẩn bị

| # | Thứ | Ghi chú |
|---|---|---|
| 1 | Tài khoản GitHub | Repo đã public, không cần quyền gì thêm |
| 2 | Tài khoản Render | Miễn phí, đăng ký bằng GitHub là xong |
| 3 | `MONGODB_URI` | Đã có trong `henzo_store_backend/.env` — xem bên dưới |
| 4 | 2 chuỗi JWT secret | Đã có sẵn trong `.env` — xem bên dưới |

### ⚠️ 3 điều cần biết trước

1. **Free plan ngủ sau 15 phút** không có người truy cập. Lần mở trang đầu tiên sau đó sẽ đợi **30–50 giây** (Render khởi động lại container). Đây là hành vi bình thường, không phải lỗi.

2. **Lần deploy đầu tiên mất 2–4 phút** vì backend tải sẵn 1.337 ảnh từ Wikimedia về cache nền (tránh Wikimedia chặn IP khi nhiều người xem cùng lúc).

3. **Database dùng chung với local.** Nếu bạn đang chạy `npm run dev` ở máy, mọi thay đổi trên Render sẽ thấy ngay ở local và ngược lại. Nên **tắt dev server local** khi đang test production.

---

## 2. Bước 0 — Đăng nhập Render

1. Mở <https://dashboard.render.com>
2. Chọn **Continue with GitHub** → cấp quyền cho Render truy cập repo
3. Nếu Render hỏi "Install Render on GitHub" → chọn **Only select repositories** → tick `henzo_store_fullstask` → **Install**

> 💡 Chỉ cấp quyền cho 1 repo này, đừng chọn "All repositories" cho an toàn.

---

## 3. Bước 1 — Tạo Blueprint

1. Click **New** (góc trên bên phải) → **Blueprint**
2. Render hiện danh sách repo của bạn → chọn **henzo_store_fullstask**
3. Render đọc file `render.yaml` ở gốc repo → hiện 2 service:

```
┌────────────────────────────────────────────────────────┐
│  henzo-store-api      type: web, runtime: node        │
│  henzo-store-web      type: web, runtime: static      │
└────────────────────────────────────────────────────────┘
```

4. Render hiển thị danh sách **Required** env vars (những cái có `sync: false`):

```
⚠ Required
  MONGODB_URI          (for henzo-store-api)
  JWT_ACCESS_SECRET    (for henzo-store-api)
  JWT_REFRESH_SECRET   (for henzo-store-api)
  CORS_ORIGINS         (for henzo-store-api)
  VITE_API_URL         (for henzo-store-web)
```

5. Nhập giá trị (xem **Bước 2** để lấy đúng nội dung) → click **Apply**

> 🎯 Blueprint tự tạo cả 2 service + gán tên domain tự động:
> - `henzo-store-api.onrender.com`
> - `henzo-store-web.onrender.com`
>
> Render có thể đổi tên nếu tên đã bị chiếm. Ghi lại tên thực tế.

---

## 4. Bước 2 — Điền biến môi trường API

### 4.1 Lấy giá trị từ file `.env` local

Mở file `henzo_store_backend/.env` (trong VS Code) — bạn sẽ thấy 3 dòng cần copy:

```
MONGODB_URI=<giá trị của bạn>
JWT_ACCESS_SECRET=<giá trị của bạn>
JWT_REFRESH_SECRET=<giá trị của bạn>
```

> 🔒 File này chứa mật khẩu database — **đừng** paste vào tài liệu, tin nhắn
> hay commit lên GitHub. Copy thẳng từ file sang ô trong Render.

### 4.2 Điền vào form Blueprint

**Lấy giá trị từ file `.env` local** (mở `henzo_store_backend/.env` bằng VS Code, copy đúng nguyên văn sau dấu `=`):

| Trường trong Render | Lấy từ dòng trong `.env` |
|---|---|
| `MONGODB_URI` | `MONGODB_URI=` → copy phần sau dấu `=` |
| `JWT_ACCESS_SECRET` | `JWT_ACCESS_SECRET=` → copy phần sau dấu `=` |
| `JWT_REFRESH_SECRET` | `JWT_REFRESH_SECRET=` → copy phần sau dấu `=` |

Còn 2 biến này điền theo domain Render:

| Trường trong Render | Giá trị |
|---|---|
| `CORS_ORIGINS` | `https://henzo-store-web.onrender.com` |
| `VITE_API_URL` | `https://henzo-store-api.onrender.com/api` |

> 🔒 **Vì sao tài liệu này không ghi sẵn giá trị thật?**
> `MONGODB_URI` chứa mật khẩu database. Nếu nó nằm trong file markdown
> được commit lên GitHub thì bất kỳ ai đọc repo cũng thấy. Hãy luôn copy
> từ `.env` local của bạn.

> ⚠️ **Nên đổi mật khẩu MongoDB** nếu bạn từng push file chứa URI lên repo
> công khai, hoặc nếu không chắc repo có public hay không:
>
> 1. MongoDB Atlas → **Database Access** → **Edit** user `leduclam2303_db_user`
> 2. Đặt mật khẩu mới → cập nhật `MONGODB_URI` trong `.env` local
> 3. Cập nhật cùng giá trị đó trong Render
>
> Tương tự, nên tạo JWT secret mới cho production:
>
> ```bash
> # Chạy 2 lần, mỗi lần cho 1 secret
> node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
> ```
>
> Nếu đổi secret, **user đang đăng nhập sẽ phải login lại** — không sao.

### 4.3 Click **Apply**

Render bắt đầu build cả 2 service song song.

---

## 5. Bước 3 — Chờ API sống

### 5.1 Theo dõi log build

Vào **henzo-store-api** → tab **Logs** → chọn build đang chạy.

Bạn sẽ thấy lần lượt:

```
📦 Installing dependencies
npm warn deprecated ...
added 312 packages in 18s

📦 Building
> henzo_store_backend@1.0.0 build
> vite build
vite v8.3.5 building client environment for production...
✓ 149 modules transformed.
vite v8.3.5 building ssr environment for production...
✓ 191 modules transformed.
✓ built in 290ms

▶ Starting
[SERVER] Henzo Store API đang chạy tại http://0.0.0.0:10000
[SERVER] CORS origins: https://henzo-store-web.onrender.com
[warmup] Sẽ tải trước ảnh nền sau 3000ms (3 luồng)...
[warmup] Cần tải 1337 ảnh.
[warmup] 100/1337 — tải mới 98, lỗi 0
```

> 💡 Render free plan có RAM 512MB. Nếu build báo **out of memory**, xem
> [mục xử lý sự cố](#build-lỗi-out-of-memory).

### 5.2 Kiểm tra API đã sống

Mở **Terminal mới** (Tab phía trên) và chạy:

```bash
curl https://henzo-store-api.onrender.com/api/health
```

Kết quả mong đợi:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "henzo-store-api",
    "database": "connected",
    "timestamp": "2026-11-06T08:20:15.123Z",
    "uptime": 42
  }
}
```

| `database` | Nghĩa là | Làm gì |
|---|---|---|
| `connected` | ✅ Tốt | Sang Bước 4 |
| `disconnected` | ⚠️ Chưa kết nối | Đợi thêm 10s rồi thử lại |
| `error` | ❌ Sai `MONGODB_URI` | Kiểm tra lại URI ở Bước 2 |

### 5.3 Test thêm vài API

```bash
# Danh sách sản phẩm
curl "https://henzo-store-api.onrender.com/api/products?pageSize=2"

# Danh mục
curl https://henzo-store-api.onrender.com/api/categories

# Tỉnh/thị xã
curl https://henzo-store-api.onrender.com/api/locations/provinces
```

Tất cả phải trả JSON có `"success": true`.

---

## 6. Bước 4 — Điền `VITE_API_URL` cho web

> **Tại sao cần bước này?** `VITE_API_URL` được **inline vào lúc build**
> (Vite thay thế chuỗi trong code lúc bundle). Sửa env sau khi build không
> có tác dụng — phải **build lại**.

**Cách 1 — qua Dashboard (nhanh hơn nếu đã tạo Blueprint):**

1. Vào **henzo-store-web** → **Environment**
2. Kiểm tra `VITE_API_URL` đã có sẵn từ Blueprint → nếu sai thì sửa
3. `VITE_BASE_PATH` phải là `/`
4. Click **Save Changes**
5. Vào tab **Events** → tìm dòng deploy gần nhất → click **Deploy** (manual deploy)

**Cách 2 — sửa trong `render.yaml` rồi push (bền vững hơn):**

Sửa file `render.yaml` tại gốc repo:

```yaml
      - key: VITE_API_URL
        value: https://henzo-store-api.onrender.com/api
```

```bash
cd /Users/leduclam/Documents/henzo_store_fullstask
git add render.yaml
git commit -m "chore: khai bao VITE_API_URL"
git push
```

> 💡 **Nên làm Cả 2**: đặt trong `render.yaml` để lần deploy sau không bị mất,
> và set trong Dashboard để áp dụng ngay.

### 6.1 Kiểm tra web đã build lại

Mở tab **Logs** của `henzo-store-web`, tìm dòng build mới nhất. Lần này
`VITE_API_URL` sẽ được đưa vào bundle.

```bash
# Kiểm tra từ máy local
curl -s https://henzo-store-web.onrender.com | grep -o 'src="[^"]*index[^"]*"'
```

---

## 7. Bước 5 — Điền `CORS_ORIGINS` cho API

> **Tại sao cần?** Backend chỉ trả header CORS cho origin nằm trong danh
> sách này. Không có nó → trình duyệt chặn mọi request từ web.

**Cách 1 — Dashboard:**

1. Vào **henzo-store-api** → **Environment**
2. Sửa `CORS_ORIGINS`:
   ```
   https://henzo-store-web.onrender.com
   ```
   Nhiều domain thì phân tách bằng dấu phẩy:
   ```
   https://henzo-store-web.onrender.com,https://www.henzo.vn,https://henzo.vn
   ```
3. Click **Save Changes** → tab **Events** → **Deploy**

**Cách 2 — `render.yaml`:**

```yaml
      - key: CORS_ORIGINS
        value: https://henzo-store-web.onrender.com
```

```bash
git add render.yaml && git commit -m "chore: khai bao CORS_ORIGINS" && git push
```

### ⚠️ Nếu bạn dùng tên domain KHÁC

Ví dụ Render đặt tên service là `henzo-store-web-xyz`:

| Biến | Giá trị phải là |
|---|---|
| `CORS_ORIGINS` | `https://henzo-store-web-xyz.onrender.com` |
| `VITE_API_URL` | `https://henzo-store-api-abc.onrender.com/api` |

**Luôn copy chính xác tên domain Render hiển thị**, không tự đoán.

---

## 8. Bước 6 — Kiểm tra tổng thể

Chạy checklist này từ terminal local:

```bash
API=https://henzo-store-api.onrender.com
WEB=https://henzo-store-web.onrender.com

echo "── 1. API health"
curl -s $API/api/health | head -c 120; echo

echo "── 2. API products"
curl -s "$API/api/products?pageSize=1" | head -c 80; echo

echo "── 3. Web trả HTML"
curl -s -o /dev/null -w "HTTP %{http_code}\n" $WEB

echo "── 4. SPA route sâu (phải 200, KHÔNG 404)"
curl -s -o /dev/null -w "HTTP %{http_code}\n" $WEB/products
curl -s -o /dev/null -w "HTTP %{http_code}\n" $WEB/admin/dashboard

echo "── 5. CORS preflight từ domain web"
curl -s -i -X OPTIONS $API/api/auth/login \
  -H "Origin: $WEB" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  | grep -i "access-control-allow-origin"

echo "── 6. Image proxy"
curl -s -o /dev/null -w "HTTP %{http_code}, %{size_download} bytes\n" \
  "$API/api/image?url=https%3A%2F%2Fthumb.wikimedia.org%2Fwikipedia%2Fcommons%2Fthumb%2F1%2F19%2FApple_iPhone_15_Pro.jpg%2F960px-Apple_iPhone_15_Pro.jpg"
```

**Kết quả mong đợi:**

```
── 1. API health
{"success":true,"data":{"status":"ok","service":"henzo-store-api","database":"connected",...
── 2. API products
{"success":true,"data":[{"id":"6adb8ba93580891111cf0937","name":"iPhone 15 Pro Max 256GB",...
── 3. Web trả HTML
HTTP 200
── 4. SPA route sâu (phải 200, KHÔNG 404)
HTTP 200
HTTP 200
── 5. CORS preflight từ domain web
access-control-allow-origin: https://henzo-store-web.onrender.com
── 6. Image proxy
HTTP 200, 133747 bytes
```

> 🔴 Nếu mục 4 trả **404** → thiếu rewrite rule trong `render.yaml`.
> Xem [mục xử lý sự cố](#f5-trên-đường-dẫn-sâu-bị-404-khi-f5).

---

## 9. Bước 7 — Đăng nhập lần đầu (test thật)

1. Mở `https://henzo-store-web.onrender.com`
2. Click **Đăng nhập** → tab **Khách hàng**
3. Tài khoản test:

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Khách hàng | `customer@henzo.com` | `123456` |
| Admin | `admin@henzo.com` | `admin123` |
| Chủ shop | `shop@henzo.com` | `123456` |

4. Sau khi login, mở **DevTools → Application → Cookies** → kiểm tra:

```
✔ henzo_refresh_token   có HttpOnly
✔ SameSite = None
✔ Secure = ✓
```

5. **Test quan trọng nhất — đăng nhập được nhưng refresh token hoạt động không:**
   - Login → đợi 15 phút (access token hết hạn) → hoặc dùng DevTools để xoá `accessToken` khỏi localStorage → reload trang
   - Nếu **vẫn đăng nhập** → refresh token hoạt động chuẩn ✅
   - Nếu **bị logout** → xem [mục xử lý sự cố](#bị-logout-ngay-khi-refresh-token-hết-hạn)

---

## 🔧 Xử lý sự cố

### API trả `{"database":"error"}`

**Nguyên nhân:** `MONGODB_URI` sai, hoặc MongoDB Atlas chưa cho phép IP của Render.

**Cách 1 — Kiểm tra URI (chạy trong thư mục backend, đọc URI từ `.env`):**
```bash
cd henzo_store_backend
node --env-file=.env -e "
  const m = require('mongoose');
  m.connect(process.env.MONGODB_URI)
   .then(() => { console.log('✅ URI OK'); process.exit(0); })
   .catch(e => { console.log('❌', e.message); process.exit(1); });
"
```

> Dòng `node --env-file=.env` nạp biến từ file `.env` — không cần copy URI
> ra terminal (tránh lọt vào lịch sử shell).

**Cách 2 — Mở IP cho Render:**

1. Vào [MongoDB Atlas](https://cloud.mongodb.com) → project của bạn → **Network Access**
2. Click **Add IP Address** → **Allow access from anywhere** (`0.0.0.0/0`)
3. Đợi 1–2 phút rồi deploy lại API

> ⚠️ "Allow from anywhere" là cần thiết vì Render dùng IP động. Đây là
> thiết lập chuẩn cho app trên PaaS, nhưng nhớ bật **Authentication** trong
> Atlas để không ai đoán được mật khẩu.

---

### Build lỗi "Out of memory"

Free plan chỉ có 512MB RAM. Sửa `henzo_store_backend/package.json`:

```json
"build": "vite build",
```

Thêm `NODE_OPTIONS` trong `render.yaml` (phần `envVars` của API):

```yaml
      - key: NODE_OPTIONS
        value: --max-old-space-size=460
```

Deploy lại. Nếu vẫn lỗi → nâng plan lên `starter` (xem [phụ lục](#-phụ-lục--nâng-cấp-plan)).

---

### Build lỗi `npm ci` — lockfile không khớp

```bash
cd henzo_store_fullstask/henzo_store_backend
npm install
git add package-lock.json
git commit -m "fix: dong bo package-lock.json"
git push
```

---

### Website gọi API bị lỗi CORS

Trong DevTools → Console sẽ thấy:

```
Access to fetch at 'https://henzo-store-api.onrender.com/api/products'
from origin 'https://henzo-store-web.onrender.com' has been blocked by CORS policy
```

**Checklist:**

| # | Kiểm tra | Sai thế nào |
|---|---|---|
| 1 | `CORS_ORIGINS` của API có **đúng** domain web? | Thiếu `https://`, có `/` ở cuối, hoặc sai tên |
| 2 | `VITE_API_URL` của web có đúng `/api` ở cuối? | Thiếu `/api` |
| 3 | API đã **deploy lại** sau khi sửa `CORS_ORIGINS`? | Env cần deploy mới mới có hiệu lực |
| 4 | Web đã **build lại** sau khi sửa `VITE_API_URL`? | Env Vite phải inline lúc build |
| 5 | Domain có dùng `http` thay vì `https`? | Render chỉ cấp `https` |

**Test nhanh CORS:**
```bash
curl -s -i -X OPTIONS https://henzo-store-api.onrender.com/api/auth/login \
  -H "Origin: https://henzo-store-web.onrender.com" \
  -H "Access-Control-Request-Method: POST" \
  | grep -i "access-control-allow-origin"
# Phải trả về đúng domain web của bạn
```

---

### Bị logout ngay khi refresh token hết hạn

**Nguyên nhân:** Cookie refresh token không được gửi cross-site.

**Fix:** Trong `henzo-store-api` → **Environment**:

```
COOKIE_SAME_SITE = None
COOKIE_SECURE     = true
```

Deploy lại. Kiểm tra lại cookie trong DevTools → Application → Cookies.

> ⚠️ `SameSite=None` **bắt buộc** phải có `Secure`, nếu không trình duyệt sẽ
> từ chối cookie hoàn toàn.

---

### F5 trên đường dẫn sâu bị 404

Ví dụ vào `/products/iphone-15-pro-max-256gb` rồi F5 → 404.

**Nguyên nhân:** Thiếu SPA rewrite rule (Render CDN không tự biết serve `index.html`).

**Fix 1 — Dashboard:**
1. `henzo-store-web` → **Settings** → **Redirects/Rewrites**
2. **Add Rule**:
   - Source Path: `/*`
   - Destination Path: `/index.html`
   - Action: **Rewrite**
3. Save

**Fix 2 — `render.yaml`** (để không bị mất khi deploy lại):

```yaml
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

```bash
git add render.yaml && git commit -m "fix: them SPA rewrite rule" && git push
```

---

### Ảnh vỡ / hiện lỗi ảnh

**Triệu chứng:** ảnh trên trang chủ bị vỡ hoặc hiện `429`.

**Nguyên nhân:** Cache ảnh bị xoá khi container restart (Render free plan có disk ephemeral). Warm up đang tải lại.

**Cách xử lý:**
1. Đợi 2–5 phút → warm up tự tải lại 1.337 ảnh
2. Kiểm tra log:
   ```
   [warmup] 300/1337 — tải mới 298, lỗi 0
   [warmup] Xong: tải mới 1337, lỗi 0
   ```
3. Nếu vẫn lỗi → kiểm tra `IMAGE_WARMUP` có bằng `on` không

**Tối ưu lâu dài:** dùng Render Persistent Disk (có phí) hoặc chuyển ảnh sang Cloudinary/S3.

---

### Deploy mất quá lâu (>10 phút)

Free plan có giới hạn 30 phút build. Thường do warm up ảnh chạy lâu.

**Tắt warm up** (nếu chấp nhận ảnh tải chậm lúc đầu):
```yaml
      - key: IMAGE_WARMUP
        value: 'off'
```

**Hoặc giảm số ảnh tải song song:**
```yaml
      - key: IMAGE_WARMUP_CONCURRENCY
        value: '2'
```

---

### Deploy lại xoá mất ảnh đã upload

Đây là **hành vi đúng** và đã được xử lý: ảnh upload được lưu trong MongoDB
(model `UploadedImage`), không phụ thuộc disk. Deploy lại vẫn còn.

Kiểm tra:
```bash
curl -s https://henzo-store-api.onrender.com/api/uploads/<tên-file> -o /tmp/x.png -w "%{http_code}\n"
```

---

## ❓ Câu hỏi thường gặp

### Tôi có cần sửa gì trong code không?

**Không.** Tất cả đã sẵn sàng. Repo đã push ở commit `9547252`.

### `render.yaml` nằm ở đâu?

Gốc repo: `henzo_store_fullstask/render.yaml`.

### Sau này sửa code thì deploy lại bằng cách nào?

```bash
cd /Users/leduclam/Documents/henzo_store_fullstask
git add -A && git commit -m "fix: sua loi" && git push
```

Render tự động build lại (`autoDeploy: true`).

### Mỗi lần deploy lại có mất dữ liệu không?

**Không** — dữ liệu nằm trong MongoDB Atlas. Chỉ cache ảnh trên disk bị mất
(warm up tải lại trong ~2 phút).

### Tôi muốn đổi tên service thì sao?

Đổi tên trong Dashboard → Render sẽ đổi domain → **phải cập nhật cả 2 biến**:

```bash
# API
CORS_ORIGINS = https://<tên-web-mới>.onrender.com
# Web
VITE_API_URL = https://<tên-api-mới>.onrender.com/api
```

### Free plan có đủ dùng không?

| Hạng mục | Giới hạn free | Henzo dùng |
|---|---|---|
| RAM | 512MB | ~250MB (Node) + ~400MB cache ảnh → **gần chạm** |
| Disk | ~1GB ephemeral | Đã giới hạn cache 400MB |
| Sleep | 15 phút | OK cho demo |
| Bandwidth | 100GB/tháng | OK |
| Build time | 30 phút | Mất ~2–4 phút |

Nếu traffic thật, nên nâng lên `starter` ($7/tháng).

### Làm sao xem log đầy đủ?

- **henzo-store-api** → tab **Logs** (log runtime) hoặc **Events** (log build)
- **henzo-store-web** → tab **Logs** (chỉ có log build)

### Có thể deploy frontend chung với backend không?

Có, nhưng **không khuyến nghị** — sẽ mất lợi thế CDN của Static Site và
phải tự viết logic serve file tĩnh. Cách hiện tại (2 service) là chuẩn.

---

## 📎 Phụ lục — Nâng cấp plan

### Render Starter ($7/tháng, khuyến nghị khi lên production thật)

**Dashboard:**
1. Vào service → **Settings** → **Upgrade Plan** → chọn `Starter`

**Hoặc sửa `render.yaml`:**
```yaml
  - type: web
    name: henzo-store-api
    runtime: node
    plan: starter        # đổi từ free
```

Lợi ích:
- Không sleep → không còn cold start 30–50 giây
- RAM 512MB → 512MB (vẫn vậy) nhưng ổn định hơn
- Bandwidth cao hơn

### Render Persistent Disk ($0.50/GB/tháng) — tùy chọn

Giữ cho cache ảnh sống dai qua các lần deploy:

**Dashboard:**
1. Vào `henzo-store-api` → **Disks** → **Add Disk**
2. Name: `image-cache`, Mount Path: `/opt/render/project/src/henzo_store_backend/storage`
3. Size: 1GB

**Hoặc `render.yaml`:**
```yaml
    disk:
      name: image-cache
      mountPath: /opt/render/project/src/henzo_store_backend/storage
      sizeGB: 1
```

> 💡 Nếu dùng Persistent Disk, nhớ set `IMAGE_CACHE_DIR` trỏ đúng vào mount path.

---

## ✅ Checklist hoàn tất

- [ ] Đăng nhập Render bằng GitHub
- [ ] Tạo Blueprint từ repo `henzo_store_fullstask`
- [ ] Điền 5 biến bắt buộc
- [ ] API build xong, `/api/health` trả `database: connected`
- [ ] `VITE_API_URL` đã set và web đã build lại
- [ ] `CORS_ORIGINS` đã set và API đã deploy lại
- [ ] CORS preflight trả đúng origin
- [ ] F5 trên `/products` không bị 404
- [ ] Đăng nhập được, cookie có `SameSite=None` + `Secure`
- [ ] Refresh token hoạt động (không bị logout)
- [ ] Ảnh hiển thị đúng trên trang chủ
