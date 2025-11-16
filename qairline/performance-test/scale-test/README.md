# Scalability Test - Quick Start Guide

## 🎯 Mục đích
Chứng minh Microservices scale tốt hơn và rẻ hơn Monolithic khi có **uneven load** (tải không đều).

## 📊 Kịch bản Test

### 1. Normal Load (Tải bình thường)
- 100 RPS search + 20 RPS booking
- Cả 2 kiến trúc tương đương

### 2. Peak Search (Black Friday - Tìm kiếm cao điểm)
- 500 RPS search + 50 RPS booking  
- **Microservices thắng**: Chỉ cần scale Flight Service

### 3. Peak Booking (Flash Sale - Đặt vé cao điểm)
- 150 RPS search + 100 RPS booking
- **Microservices thắng**: Chỉ cần scale Booking Service

## 🚀 Chạy Test

```bash
cd qairline/performance-test
npm install

# Test scalability và tính chi phí
npm run test:scale
```

## 📈 Kết quả Mẫu

```
🎯 Scenario: PEAK SEARCH (Black Friday)
   Load: 500 search RPS + 50 booking RPS

   ❌ MONOLITHIC:
      Instances: 4x backend (2GB each)
      Monthly Cost: $160
      
   ✅ MICROSERVICES:
      Instances:
         - Flight Service: 3x (1GB)      ← Scale this!
         - Booking Service: 1x (1GB)     ← Keep normal
         - API Gateway: 1x (512MB)
         - User Service: 1x (512MB)
         - Offer Service: 1x (512MB)
      Monthly Cost: $90
      
   💰 COST SAVINGS:
      Microservices saves $70/month (44%)
      Annual savings: $840
```

## 🎓 Kết luận
- **Monolithic**: Phải scale toàn bộ → Lãng phí resources
- **Microservices**: Scale từng service → Tối ưu chi phí
- **Tiết kiệm**: 30-50% trong scenarios uneven load

## 📊 Visualize

Kết quả export ra `results/scalability-report.json`

Có thể visualize bằng:
1. Excel/Google Sheets
2. Chart.js / D3.js
3. Grafana dashboard

