# 🚀 QAirline Performance & Scalability Testing

## Mục tiêu
So sánh hiệu năng và khả năng scale giữa:
- ❌ **Kiến trúc CŨ**: Monolithic backend
- ✅ **Kiến trúc MỚI**: Microservices

## Tools sử dụng

### 1. K6 (Khuyên dùng - Open source, mạnh mẽ)
```bash
# Install k6
choco install k6  # Windows
# hoặc tải từ: https://k6.io/docs/get-started/installation/

# Run tests
npm run test:load
npm run test:stress
```

### 2. Artillery (Dễ dùng, config YAML)
```bash
npm install
npm run artillery:flight
npm run artillery:booking
```

### 3. Autocannon (Node.js native, nhanh)
```bash
npm install
node autocannon-tests/quick-test.js
```

## Kịch bản Test

### 📊 1. Load Test (Tải thông thường)
- **Mục đích**: Test hiệu năng ở tải bình thường
- **VUs**: 50-100 users đồng thời
- **Duration**: 5-10 phút
- **Scenarios**:
  - Search flights (tìm chuyến bay)
  - View flight details
  - Make booking

### 🔥 2. Stress Test (Tải cao)
- **Mục đích**: Tìm breaking point
- **VUs**: Tăng dần 100 → 500 → 1000 users
- **Duration**: 15 phút
- **Metric**: Tìm điểm service bắt đầu lỗi

### ⚡ 3. Spike Test (Tải đột biến)
- **Mục đích**: Test Black Friday, Flash sale
- **VUs**: 0 → 1000 users trong 30s
- **Duration**: 5 phút
- **Scenario**: Mọi người đồng loạt search/book

### 🎯 4. Scalability Test (Scale theo service)
- **Mục đích**: Chứng minh scale riêng lẻ tốt hơn
- **Test case**:
  - Peak search (80% traffic) → scale flight-service
  - Peak booking (20% traffic) → không cần scale booking-service
  - So sánh chi phí

## Metrics quan trọng

### Response Time
- ✅ **p50**: < 200ms
- ✅ **p95**: < 500ms
- ✅ **p99**: < 1000ms

### Throughput
- ✅ **RPS**: Requests per second
- Target: > 500 RPS cho search

### Error Rate
- ✅ Target: < 1% errors

### Resource Usage
- CPU, Memory, Network
- Chi phí infrastructure

## So sánh Scaling

### ❌ Monolithic (CŨ)
```
Peak Search (1000 users) → Scale toàn bộ backend
- 3 instances × 2GB RAM × $50/month = $150/month
- Waste: Booking logic cũng scale (không cần thiết)
```

### ✅ Microservices (MỚI)
```
Peak Search (800 users) → Scale ONLY flight-service
- flight-service: 3 instances × 1GB = $75/month
- booking-service: 1 instance × 1GB = $25/month
Total: $100/month
Tiết kiệm: 33%
```

## Chạy Tests

### Quick Start
```bash
cd qairline/performance-test
npm install

# Test monolithic backend (OLD)
npm run test:load -- --env OLD_BACKEND=http://localhost:5000

# Test microservices (NEW)
npm run test:load -- --env API_GATEWAY=http://localhost:3000

# Generate report
npm run report
```

### Test riêng từng service
```bash
# Flight search only
k6 run --vus 100 --duration 5m load-tests/search-flight-load.js

# Booking only
k6 run --vus 50 --duration 5m load-tests/booking-stress.js
```

## Kết quả mong đợi

### Old Architecture (Monolithic)
- ❌ Response time tăng khi load cao
- ❌ Phải scale toàn bộ app
- ❌ Chi phí cao hơn
- ❌ 1 service chậm → toàn bộ chậm

### New Architecture (Microservices)
- ✅ Response time ổn định
- ✅ Scale riêng service cần thiết
- ✅ Chi phí tối ưu
- ✅ Fault isolation (1 service lỗi, các service khác OK)

## Visualize Results

Kết quả test sẽ export ra:
- `results/load-test-summary.json`
- `results/comparison-chart.html`
- `results/cost-analysis.csv`

Mở `comparison-chart.html` trong browser để xem biểu đồ so sánh!
