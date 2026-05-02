# 📝 Note Server (SPA Edition)

Ứng dụng ghi chú online với giao diện giả lập VS Code Editor, được xây dựng theo kiến trúc Single Page Application (SPA). Mỗi ghi chú có URL riêng, tự động lưu, không cần đăng ký tài khoản.

## Tính năng

- **SPA Architecture**: Chuyển đổi mượt mà giữa trang chủ và trình chỉnh sửa không cần load lại trang.
- **VS Code Interface**: Giao diện chuyên nghiệp với Dark/Light mode, số dòng (line numbers), thanh trạng thái (status bar).
- **Auto Save**: Tự động lưu nội dung sau 1 giây khi ngừng gõ.
- **Serverless Ready**: Tối ưu hóa hoàn toàn cho Vercel và Upstash Redis.
- **Text Raw Mode**: Lấy nội dung thuần qua tham số `?raw=true`.
- **Biome Tooling**: Sử dụng Biome để lint và format code cực nhanh.

## Cài đặt

```bash
npm install
```

## Cấu hình

Tạo file `.env` ở thư mục gốc:

```env
UPSTASH_REDIS_REST_URL="https://your-db-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-secret-token"
PORT=3000
```

## Phát triển & Kiểm tra

```bash
# Chạy local
npm run dev

# Lint code
npm run lint

# Format code
npm run format

# Kiểm tra và sửa lỗi tự động
npm run check
```

## Cấu trúc dự án

```
├── api/
│   └── index.js      # Express app (Serverless Function)
├── public/
│   ├── css/
│   │   └── style.css # Unified Styles
│   ├── js/
│   │   └── app.js   # SPA Logic & Editor
│   └── index.html    # Master HTML file
├── biome.json        # Biome configuration
├── vercel.json       # Vercel deployment config
└── .env              # Environment variables
```

## Triển khai lên Vercel

1. Kết nối repository của bạn với Vercel.
2. Thêm các biến môi trường: `UPSTASH_REDIS_REST_URL` và `UPSTASH_REDIS_REST_TOKEN`.
3. Vercel sẽ tự động nhận diện cấu hình và deploy.

---

## Yêu cầu

- Node.js 18+
- Tài khoản Upstash (cho Redis REST API)
