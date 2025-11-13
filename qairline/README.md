# QAirline - Microservices Architecture

## 🎯 Tổng quan

Dự án QAirline được xây dựng theo kiến trúc microservices, bao gồm:

- **API Gateway**: Điểm truy cập duy nhất, định tuyến requests đến các services
- **Booking Service**: Quản lý đặt vé
- **Flight Service**: Quản lý chuyến bay
- **Offer Service**: Quản lý khuyến mãi
- **User Service**: Quản lý người dùng

## 📁 Cấu trúc dự án

```
qairline/
├── api-gateway/              # API Gateway - cổng vào chính
│   ├── src/
│   │   └── index.ts         # Entry point
│   ├── .env                 # Environment variables
│   ├── package.json
│   └── tsconfig.json
│
├── services/                 # Các microservices
│   ├── booking-service/     # Service quản lý đặt vé
│   │   ├── src/
│   │   │   ├── controllers/ # Xử lý logic nghiệp vụ
│   │   │   ├── database/    # Kết nối DB
│   │   │   ├── routes/      # Định nghĩa routes
│   │   │   ├── types/       # TypeScript types
│   │   │   └── index.ts     # Entry point
│   │   ├── tests/           # Unit tests
│   │   ├── .env            # Environment variables
│   │   ├── jest.config.js
│   │   └── package.json
│   │
│   ├── flight-service/      # Service quản lý chuyến bay
│   │   ├── src/
│   │   ├── tests/
│   │   ├── .env
│   │   └── package.json
│   │
│   ├── offer-service/       # Service quản lý khuyến mãi
│   │   ├── src/
│   │   ├── tests/
│   │   ├── .env
│   │   └── package.json
│   │
│   └── user-service/        # Service quản lý người dùng
│       ├── src/
│       ├── tests/
│       ├── .env
│       └── package.json
│
├── frontend/                # Next.js frontend (port 3000)
├── SETUP-DATABASE.sql       # Script tạo database (chạy 1 lần duy nhất)
├── start-app.bat            # Shortcut để chạy tất cả services
└── package.json             # Root workspace config
```

## 🛠️ Công nghệ sử dụng

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MySQL
- **Testing**: Jest + Supertest
- **Dev Tools**: ts-node-dev (hot reload)

## 📦 Cài đặt nhanh (không dùng Docker)

Từ thư mục `qairline/` (root monorepo):

```powershell
npm install

# Chạy tất cả services + API Gateway (hot reload)
npm run dev

# Hoặc chỉ chạy API Gateway
npm run dev:gateway
```

Ghi chú:
- API Gateway mặc định chạy ở `http://localhost:3001`
- Các service chạy ở cổng nội bộ 4001-4004 (gateway proxy nên frontend vẫn gọi qua gateway như cũ)

---

## 📦 Cài đặt thủ công

### 1. Cài đặt dependencies cho tất cả services

```bash
# Cài đặt API Gateway
cd api-gateway
npm install

# Cài đặt từng service
cd .../services/booking-service
npm install

cd .../flight-service
npm install

cd .../offer-service
npm install

cd .../user-service
npm install
```

### 2. Cấu hình Database

**Bước 1: Tạo database**

Chạy file `SETUP-DATABASE.sql` trong DataGrip hoặc phpMyAdmin **1 LẦN DUY NHẤT**:
- Mở DataGrip, kết nối MySQL (root, no password)
- Execute file `SETUP-DATABASE.sql`
- Database `Flight` sẽ được tạo với đầy đủ tables và sample data

**Bước 2: Cấu hình .env cho các services**

Mỗi service cần file `.env` (đã có sẵn):

```env
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_NAME=Flight
PORT=500X
```

**Lưu ý**: Mỗi service chạy trên port khác nhau:
- User Service: `5001`
- Flight Service: `5002`
- Booking Service: `5003`
- Offer Service: `5004`
- API Gateway: `3001`
- Frontend: `3000`

## 🚀 Chạy dự án

### Cách đơn giản nhất (khuyến nghị)

```bash
# Từ thư mục qairline/
npm run dev

# Hoặc double-click file start-app.bat
```

Lệnh này sẽ chạy **tất cả** các services cùng lúc:
- Frontend (Next.js) - http://localhost:3000
- API Gateway - http://localhost:3001
- User Service - http://localhost:5001
- Flight Service - http://localhost:5002
- Booking Service - http://localhost:5003
- Offer Service - http://localhost:5004

### Chạy từng service riêng lẻ (Development mode)

Chỉ dùng khi debug một service cụ thể:

```bash
# Chạy API Gateway
cd api-gateway
npm run dev

# Chạy Booking Service
cd services/booking-service
npm run dev

# Chạy Flight Service
cd services/flight-service
npm run dev

# Chạy Offer Service
cd services/offer-service
npm run dev

# Chạy User Service
cd services/user-service
npm run dev

# Chạy Frontend
cd frontend
npm run dev
```

### Build cho production

```bash
# Build từng service
cd services/booking-service
npm run build
npm start

# Tương tự cho các service khác...
```

## 🧪 Chạy test

### Chạy test cho tất cả services

```bash
# Test Booking Service
cd services/booking-service
npm test

# Test Flight Service
cd services/flight-service
npm test

# Test Offer Service
cd services/offer-service
npm test

# Test User Service
cd services/user-service
npm test
```

### Chạy test ở chế độ watch (tự động chạy lại khi có thay đổi)

```bash
cd services/booking-service
npm run test:watch
```

### Chạy test với coverage

```bash
cd services/booking-service
npm test -- --coverage
```

## 🌐 API Endpoints

Tất cả requests đi qua API Gateway tại `http://localhost:3001`

### Booking Service (giữ nguyên bề mặt cũ)
- `GET /api/Bookings` - Lấy danh sách đặt vé
- `GET /api/Bookings/:id` - Lấy chi tiết đặt vé
- `POST /api/Bookings` - Tạo đặt vé mới
- `PUT /api/Bookings/:id` - Cập nhật đặt vé
- `DELETE /api/Bookings/:id` - Xóa đặt vé
- `POST /api/Flights/GetUserFlights` - Lấy chuyến bay theo người dùng (route đặc biệt cũ)

### Flight Service (giữ nguyên bề mặt cũ)
- `GET /api/Flights` - Lấy danh sách chuyến bay
- `GET /api/Flights/:id` - Lấy chi tiết chuyến bay
- `POST /api/Flights` - Tạo chuyến bay mới
- `PUT /api/Flights/:id` - Cập nhật chuyến bay
- `DELETE /api/Flights/:id` - Xóa chuyến bay

### Offer Service (giữ nguyên bề mặt cũ)
- `GET /api/Offers` - Lấy danh sách khuyến mãi
- `GET /api/Offers/:id` - Lấy chi tiết khuyến mãi
- `POST /api/Offers` - Tạo khuyến mãi mới
- `PUT /api/Offers/:id` - Cập nhật khuyến mãi
- `DELETE /api/Offers/:id` - Xóa khuyến mãi

### User Service (giữ nguyên bề mặt cũ)
- Auth:
	- `POST /api/auth/signin`
	- `POST /api/auth/signup`
- Quản lý người dùng:
	- `GET /api/User/GetAllUser`
	- `POST /api/User/DeleteUser`

### Health Check
- `GET /health` - Kiểm tra trạng thái API Gateway

## 📝 Ghi chú quan trọng

1. **Khởi động nhanh**: Chỉ cần chạy `npm run dev` tại thư mục `qairline/` hoặc double-click `start-app.bat`
2. **Database**: 
   - Chạy `SETUP-DATABASE.sql` trong DataGrip **1 lần duy nhất** trước khi khởi động
   - Database name: `Flight` (không phải `qairline_db`)
3. **Port conflicts**: Đảm bảo các port 3000, 3001, 5001-5004 không bị chiếm
4. **Hot reload**: Code thay đổi sẽ tự động reload, không cần restart
5. **Frontend**: Luôn gọi API qua Gateway (localhost:3001), không gọi trực tiếp vào services

## 🎯 So với kiến trúc cũ

### Điểm giống (Backward Compatible):
✅ Frontend không cần sửa gì  
✅ API endpoints giữ nguyên 100%  
✅ Response format giữ nguyên  
✅ Database schema giữ nguyên  
✅ Port 3001 vẫn là entry point  

### Điểm khác (Cải tiến):
🚀 Tách thành 4 microservices độc lập  
🚀 Dễ scale từng service riêng  
🚀 Code rõ ràng, dễ maintain hơn  
🚀 Test riêng từng service  
🚀 Deploy độc lập không ảnh hưởng toàn bộ  

4. **Environment variables**: Nhớ tạo file `.env` cho từng service và `api-gateway/.env`

## 🐛 Debug

Nếu gặp lỗi:

1. Kiểm tra console log của service bị lỗi
2. Kiểm tra kết nối database
3. Kiểm tra port đã được sử dụng chưa
4. Xem API Gateway logs để biết request được route đến đâu