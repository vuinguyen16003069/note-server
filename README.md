# 📝 Note Server (v2.0.0 — SPA Edition)

Ứng dụng ghi chú online hiện đại với giao diện chuyên nghiệp lấy cảm hứng từ VS Code. Được xây dựng theo kiến trúc Single Page Application (SPA) tối ưu, hỗ trợ lưu trữ đám mây qua Upstash Redis và triển khai cực nhanh trên Vercel.

## ✨ Tính năng nổi bật

- **Kiến trúc SPA Hoàn thiện**: Chuyển đổi mượt mà giữa trang chủ và trình chỉnh sửa mà không bao giờ phải load lại trang.
- **Client-Side UUID**: Tạo ghi chú mới tức thì trên trình duyệt bằng `crypto.randomUUID()`, đảm bảo tính duy nhất và hiệu suất tối đa.
- **Giao diện Glassmorphism**: Thiết kế cao cấp với hiệu ứng mờ nhám, gradient động và các vòng tròn orb trôi nổi mượt mà.
- **Chế độ Dark/Light**: Hỗ trợ chuyển đổi theme thông minh, lưu lựa chọn vào LocalStorage.
- **Trình chỉnh sửa VS Code**: Số dòng (line numbers), highlight dòng đang chọn, tab indentation (4 spaces), và phím tắt chuyên nghiệp.
- **Đồng bộ Đám mây (Auto Save)**: Tự động lưu nội dung sau 1 giây khi ngừng gõ, kèm theo cơ chế retry thông minh nếu mất kết nối.
- **Phát hiện Online/Offline**: Cảnh báo trạng thái kết nối ngay trên thanh công cụ.
- **Text Raw Mode**: Truy cập nội dung thuần của ghi chú qua tham số `?raw=true` hoặc qua các công cụ CLI (curl, axios, wget, etc.).
- **Tối ưu hóa Vercel**: Cấu hình rewrite và caching assets tối ưu cho môi trường serverless.

## 🚀 Bắt đầu nhanh

### 1. Cài đặt
```bash
npm install
```

### 2. Cấu hình
Sao chép file mẫu và điền thông tin Upstash Redis của bạn:
```bash
cp .env.example .env
```

Để lấy thông tin Upstash Redis:
1. Truy cập [Upstash Console](https://console.upstash.com/) và đăng ký.
2. Tạo một database **Redis** mới.
3. Trong tab **Details**, cuộn xuống mục **REST API**.
4. Sao chép giá trị `UPSTASH_REDIS_REST_URL` và `UPSTASH_REDIS_REST_TOKEN` vào file `.env`.

Nội dung file `.env`:
```env
UPSTASH_REDIS_REST_URL="https://your-db-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-secret-token"
PORT=3000
```

### 3. Phát triển
```bash
# Chạy môi trường phát triển (với nodemon)
npm run dev

# Kiểm tra lỗi code (Linter)
npm run lint

# Tự động format code
npm run format
```

## 📁 Cấu trúc dự án

```text
├── api/
│   └── index.js      # Backend API (Express + Serverless)
├── public/
│   ├── css/
│   │   └── style.css # Giao diện (Vanilla CSS + Orbs Animation)
│   ├── js/
│   │   └── script.js # Logic SPA & Client-side Editor
│   └── index.html    # File HTML chính duy nhất
├── .env.example      # File mẫu cấu hình môi trường
├── biome.json        # Cấu hình Biome (Linter & Formatter)
├── vercel.json       # Cấu hình deployment Vercel
└── index.js          # Entry point cho môi trường local
```

## ⌨️ Phím tắt (Shortcuts)

- `Ctrl + S`: Lưu ghi chú thủ công ngay lập tức.
- `Ctrl + N`: Tạo một ghi chú mới trắng.
- `Tab`: Thêm khoảng cách thụt đầu dòng (4 spaces).

## 🌍 Triển khai (Deployment)

1. Đẩy mã nguồn lên GitHub/GitLab.
2. Kết nối repository với **Vercel**.
3. Cấu hình Environment Variables: `UPSTASH_REDIS_REST_URL` và `UPSTASH_REDIS_REST_TOKEN`.
4. Vercel sẽ tự động build và cung cấp URL production.

---

## 🛠️ Yêu cầu hệ thống

- **Node.js**: 18.x hoặc mới hơn.
- **Cơ sở dữ liệu**: Upstash Redis (REST API enabled).
- **Linter**: Biome (khuyến nghị dùng extension trên VS Code).

---
*Phát triển bởi Vuiz — 2026*
