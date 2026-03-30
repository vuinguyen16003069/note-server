# 📝 Note Server

Ứng dụng ghi chú online với giao diện giả lập VS Code Editor. Mỗi ghi chú có URL riêng, tự động lưu, không cần đăng ký tài khoản.

## Tính năng

- Truy cập trang web → tự động sinh UUID và chuyển đến editor mới
- Giao diện giống VS Code (dark/light theme, line numbers, status bar)
- Tự động lưu sau 1 giây khi ngừng gõ
- Chia sẻ ghi chú qua URL
- Lấy nội dung thuần text qua `?raw=true`
- Ghi chú được lưu trong 30 ngày

## Cài đặt

```bash
npm install
```

## Cấu hình

Tạo file `.env` ở thư mục gốc:

```env
REDIS_URL=redis://localhost:6379
PORT=3000
```

> Nếu dùng Redis Cloud (Upstash, RedisLabs...), thay bằng URL kết nối tương ứng.

## Chạy local

```bash
npm start
```

Mở trình duyệt tại: [http://localhost:3000](http://localhost:3000)

## API

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| `GET` | `/` | Tạo UUID mới, redirect đến editor |
| `GET` | `/note/:id` | Mở editor với ghi chú theo ID |
| `GET` | `/note/:id?raw=true` | Lấy nội dung thuần text |
| `PUT` | `/note/:id` | Lưu nội dung ghi chú |
| `POST` | `/api/create` | Tạo UUID mới, redirect đến editor |

## Cấu trúc dự án

```
├── index.js          # Entry point, khởi động server
├── api/
│   └── index.js      # Express app, routes, kết nối Redis
├── public/
│   ├── index.html    # Landing page
│   └── editor.html   # Giao diện VS Code editor
└── .env              # Biến môi trường (không commit)
```

## Lấy REDIS_URL miễn phí (Upstash)

1. Truy cập [https://upstash.com](https://upstash.com) → **Sign Up** (đăng ký bằng GitHub/Google)
2. Vào **Console** → chọn **Redis** → nhấn **Create Database**
3. Điền tên DB, chọn region gần nhất (ví dụ: `ap-southeast-1` cho Đông Nam Á)
4. Sau khi tạo xong, vào tab **Details** → copy dòng **UPSTASH_REDIS_REST_URL** hoặc cuộn xuống phần **Connect** → chọn tab **Node.js** → copy `REDIS_URL`
5. Dán vào file `.env`:
   ```env
   REDIS_URL=rediss://default:<password>@<host>.upstash.io:<port>
   ```

> Upstash free tier: 10.000 lệnh/ngày, đủ dùng cho dự án cá nhân.

---

## Deploy lên Vercel

> Yêu cầu đã có `REDIS_URL` từ bước trên.

1. Truy cập [https://vercel.com](https://vercel.com) → **Sign Up** bằng GitHub
2. Push code lên GitHub (đảm bảo `.env` có trong `.gitignore`)
3. Trên Vercel → **Add New Project** → Import repo vừa push
4. Trước khi deploy, vào **Environment Variables** → thêm:
   - Key: `REDIS_URL` — Value: URL từ Upstash
5. Nhấn **Deploy**

**Thêm file `vercel.json`** vào thư mục gốc để Vercel định tuyến đúng:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/api/index.js" }]
}
```

Sau khi deploy xong, Vercel cấp tên miền dạng `https://<tên-project>.vercel.app`.

---

## Yêu cầu

- Node.js 18+
- Redis (local hoặc cloud)
