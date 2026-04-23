# Google OAuth Authentication Flow & Logic

Tài liệu này mô tả chi tiết luồng xử lý đăng nhập bằng Google OAuth trong hệ thống LexiLearn.

## 1. Tổng quan luồng (Overview)

Hệ thống sử dụng mô hình **FE-initiated Authorization Code / ID Token Flow**:
1. **Frontend**: Sử dụng thư viện `@react-oauth/google` để hiển thị nút đăng nhập Google và nhận về `ID Token`.
2. **Backend**: Nhận `ID Token` từ Frontend, xác thực với Google, sau đó tạo `JWT Access Token` nội bộ để quản lý phiên làm việc.

## 2. Các bước chi tiết (Detailed Steps)

### Bước 1: Login tại Frontend
- User click vào nút "Sign in with Google".
- Google hiển thị popup chọn tài khoản.
- Sau khi chọn, Google trả về một `credential` (ID Token - một JWT được ký bởi Google).
- Frontend gọi API `POST /api/v1/auth/google` kèm theo `id_token` này.

### Bước 2: Xác thực tại Backend (`auth_routes.py`)
- Backend nhận `id_token`.
- Sử dụng `authlib` để tải Public Keys từ Google (`https://www.googleapis.com/oauth2/v3/certs`).
- Xác thực chữ ký của `id_token` để đảm bảo nó thực sự từ Google.
- Kiểm tra các claims:
    - `iss` (Issuer): Phải là `https://accounts.google.com` hoặc `accounts.google.com`.
    - `aud` (Audience): Phải khớp với `GOOGLE_CLIENT_ID` của hệ thống.
    - `exp` (Expiration): Token còn hạn.

### Bước 3: Quản lý User trong Database
- Trích xuất `sub` (Google User ID unique), `email`, `name`, `picture` từ token.
- Kiểm tra xem User đã tồn tại trong bảng `users` chưa (dùng `id` = `google_sub`).
- **Nếu chưa có**: Tạo user mới.
- **Nếu đã có**: Cập nhật thông tin `full_name` và `avatar_url`.
- Lưu thay đổi vào Azure SQL Database.

### Bước 4: Tạo Session nội bộ
- Backend tạo một JWT riêng (`LexiLearn JWT`) chứa `sub` (user_id).
- Trả về cho Frontend: `{ access_token, token_type: "bearer", user: { ... } }`.

### Bước 5: Lưu trữ và Điều hướng tại Frontend
- Frontend lưu `access_token` vào `localStorage`.
- Cập nhật `AuthContext` state.
- React Router phát hiện `isAuthenticated = true` và chuyển hướng user vào `Dashboard`.

## 3. Các điểm cần lưu ý (Logic Gaps & Fixes)

| Vấn đề | Trạng thái | Giải pháp |
| :--- | :--- | :--- |
| **Bảo mật** | ⚠️ Cần config `GOOGLE_CLIENT_ID` | Nếu thiếu Client ID, hệ thống sẽ bỏ qua bước check signature (chỉ dùng cho Dev). Phải bật bắt buộc trong Production. |
| **IP Whitelisting** | ❌ Chặn bởi Azure Firewall | Hiện tại mỗi máy Dev/Server truy cập database cần được whitelist IP IPv4 trên Azure Portal. |
| **Thư viện JWT** | 🛠️ Inconsistency | Đang dùng cả `python-jose` và `authlib`. Nên thống nhất hoặc phân tách rõ ràng nhiệm vụ. |
| **Refresh Token** | ⏳ Chưa có | Hiện tại chỉ dùng Access Token ngắn hạn (24h). Hết hạn user cần login lại. |

## 4. Cách xử lý lỗi IP Address (Azure DB)

Nếu bạn gặp lỗi `Client with IP address 'X.X.X.X' is not allowed`, hãy thực hiện:
1. Truy cập [Azure Portal](https://portal.azure.com).
2. Tìm đến resource **Azure SQL Server** (`speakingsystem`).
3. Chọn mục **Security -> Networking**.
4. Thêm IP `X.X.X.X` vào danh sách **Firewall rules**.
5. Save và đợi ~1-2 phút.
