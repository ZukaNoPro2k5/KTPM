# 🎯 Database Per Service - True Microservices Setup

## ✨ Điểm Khác Biệt Quan Trọng

### ❌ Cách CŨ (Shared Database Anti-pattern)
```
All Services → Flight Database
├── Users
├── Aircrafts
├── Flights
├── Bookings
├── Payments
└── Offers
```
**Vấn đề:** Tight coupling, không scale được độc lập

### ✅ Cách MỚI (Database Per Service - TRUE Microservices)
```
User Service    → user_service_db    (Users)
Flight Service  → flight_service_db  (Aircrafts, Flights)
Booking Service → booking_service_db (Bookings, Payments)
Offer Service   → offer_service_db   (Offers)
```
**Ưu điểm:** Loose coupling, scale độc lập, fault isolation

## 🚀 Quick Start

### Bước 1: Tạo 4 Databases Riêng Biệt
```bash
# Chạy script
mysql -u root -p < SETUP-SEPARATE-DATABASES.sql
```

### Bước 2: Update .env cho TỪNG Service

#### User Service (.env)
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=user_service_db  # ✅ Database riêng
PORT=5001
JWT_SECRET=secret_key
```

#### Flight Service (.env)
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=flight_service_db  # ✅ Database riêng
PORT=5002
```

#### Booking Service (.env)
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=booking_service_db  # ✅ Database riêng
PORT=5003

# ⚠️ QUAN TRỌNG: URL của services khác để gọi API
USER_SERVICE_URL=http://localhost:5001
FLIGHT_SERVICE_URL=http://localhost:5002
```

#### Offer Service (.env)
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=offer_service_db  # ✅ Database riêng
PORT=5004

# ⚠️ QUAN TRỌNG: URL của services khác để gọi API
USER_SERVICE_URL=http://localhost:5001

# Email config
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Bước 3: Verify Databases
```sql
-- Kiểm tra tất cả databases đã được tạo
SHOW DATABASES;
-- Kết quả phải có:
-- user_service_db
-- flight_service_db
-- booking_service_db
-- offer_service_db

-- Kiểm tra từng database
USE user_service_db;
SHOW TABLES;  -- Users

USE flight_service_db;
SHOW TABLES;  -- Aircrafts, Flights

USE booking_service_db;
SHOW TABLES;  -- Bookings, Payments

USE offer_service_db;
SHOW TABLES;  -- Offers
```

## 🔄 Thay Đổi Cần Thiết Trong Code

### 1. User Service - Expose API để services khác gọi

Tạo `services/user-service/src/routes/userRoutes.ts`:
```typescript
import express from 'express';
import { UserController } from '../controllers/UserController';

const router = express.Router();
const userController = new UserController();

// API cho services khác gọi (internal APIs)
router.get('/:userId', userController.getUserById.bind(userController));
router.get('/:userId/role', userController.getUserRole.bind(userController));

// API lấy tất cả emails (cho Offer Service)
router.get('/emails/all', userController.getAllEmails.bind(userController));

export default router;
```

Thêm vào `UserController.ts`:
```typescript
// API mới: Lấy user by ID (cho services khác)
getUserById(req: Request, res: Response) {
  const { userId } = req.params;
  
  connection.execute('SELECT UserID, Name, Username, Email, Role FROM Users WHERE UserID = ?', 
    [userId], 
    (err, results: any) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching user' });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(results[0]);
    }
  );
}

// API mới: Lấy role của user (cho services khác check admin)
getUserRole(req: Request, res: Response) {
  const { userId } = req.params;
  
  connection.execute('SELECT Role FROM Users WHERE UserID = ?', 
    [userId], 
    (err, results: any) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching user role' });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ role: results[0].Role });
    }
  );
}

// API mới: Lấy tất cả emails (cho Offer Service)
getAllEmails(req: Request, res: Response) {
  connection.query('SELECT Email FROM Users WHERE Email IS NOT NULL', 
    (err, results: any) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching emails' });
      }
      const emails = results.map((user: any) => user.Email);
      res.json({ emails });
    }
  );
}
```

Update `index.ts`:
```typescript
import userRoutes from './routes/userRoutes';

// Existing auth routes
app.post('/api/auth/signin', userController.signIn.bind(userController));
app.post('/api/auth/signup', userController.signUp.bind(userController));

// User management routes
app.get('/api/User/GetAllUser', userController.getAllUsers.bind(userController));
app.post('/api/User/DeleteUser', userController.deleteUser.bind(userController));

// ✅ NEW: Internal APIs cho services khác
app.use('/api/users', userRoutes);
```

### 2. Flight Service - Gọi User Service thay vì query trực tiếp

Update `FlightController.ts`:
```typescript
import axios from 'axios';

export class FlightController {
  private userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:5001';

  async createFlight(req: Request, res: Response) {
    const { model, departure, arrival, departureTime, arrivalTime, price, seatsAvailable, status, userID, aircraftTypeId } = req.body;

    if (!departure || !arrival || !departureTime || !arrivalTime || !price || seatsAvailable == null || !userID) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    try {
      // ✅ MỚI: Gọi User Service API thay vì query trực tiếp
      const userRoleResponse = await axios.get(`${this.userServiceUrl}/api/users/${userID}/role`);
      
      if (userRoleResponse.data.role !== 'Admin') {
        res.status(403).json({ message: 'Permission denied: User is not an admin' });
        return;
      }

      // Tiếp tục logic tạo flight...
      if (model && !aircraftTypeId) {
        const getAircraftQuery = 'SELECT AircraftID FROM Aircrafts WHERE Model = ?';
        connection.query(getAircraftQuery, [model], (err, results: any) => {
          if (err) {
            res.status(500).json({ message: 'Error fetching aircraft', error: err.message });
            return;
          }
          if (results.length === 0) {
            res.status(404).json({ message: 'Aircraft model not found' });
            return;
          }
          const aircraftTypeIdFromModel = results[0].AircraftID;
          this.insertFlight(res, aircraftTypeIdFromModel, departure, arrival, departureTime, arrivalTime, price, seatsAvailable, status);
        });
      } else {
        this.insertFlight(res, aircraftTypeId, departure, arrival, departureTime, arrivalTime, price, seatsAvailable, status);
      }

    } catch (error) {
      console.error('Error calling User Service:', error);
      res.status(500).json({ message: 'Error verifying user permissions' });
    }
  }

  // Tương tự cho updateFlightStatus, deleteFlight...
}
```

### 3. Flight Service - Expose API để Booking Service gọi

Tạo `services/flight-service/src/routes/flightRoutes.ts`:
```typescript
// Thêm endpoint mới
router.get('/:flightId', flightController.getFlightById.bind(flightController));
router.post('/:flightId/reserve-seat', flightController.reserveSeat.bind(flightController));
router.post('/:flightId/release-seat', flightController.releaseSeat.bind(flightController));
```

Thêm vào `FlightController.ts`:
```typescript
// API mới: Lấy flight by ID (cho Booking Service)
getFlightById(req: Request, res: Response) {
  const { flightId } = req.params;
  
  const query = `
    SELECT f.*, a.Model AS AircraftModel, a.Capacity
    FROM Flights f
    JOIN Aircrafts a ON f.AircraftTypeID = a.AircraftID
    WHERE f.FlightID = ?
  `;
  
  connection.execute(query, [flightId], (err, results: any) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching flight' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Flight not found' });
    }
    res.json(results[0]);
  });
}

// API mới: Đặt ghế (giảm SeatsAvailable)
reserveSeat(req: Request, res: Response) {
  const { flightId } = req.params;
  
  connection.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ message: 'Transaction error' });
    }

    // Kiểm tra còn ghế không
    connection.execute(
      'SELECT SeatsAvailable FROM Flights WHERE FlightID = ? FOR UPDATE',
      [flightId],
      (err, results: any) => {
        if (err) {
          return connection.rollback(() => {
            res.status(500).json({ message: 'Error checking seats' });
          });
        }

        if (results.length === 0) {
          return connection.rollback(() => {
            res.status(404).json({ message: 'Flight not found' });
          });
        }

        if (results[0].SeatsAvailable <= 0) {
          return connection.rollback(() => {
            res.status(400).json({ message: 'No seats available' });
          });
        }

        // Giảm số ghế
        connection.execute(
          'UPDATE Flights SET SeatsAvailable = SeatsAvailable - 1 WHERE FlightID = ?',
          [flightId],
          (err) => {
            if (err) {
              return connection.rollback(() => {
                res.status(500).json({ message: 'Error reserving seat' });
              });
            }

            connection.commit((err) => {
              if (err) {
                return connection.rollback(() => {
                  res.status(500).json({ message: 'Commit error' });
                });
              }
              res.json({ message: 'Seat reserved successfully' });
            });
          }
        );
      }
    );
  });
}

// API mới: Hủy ghế (tăng SeatsAvailable)
releaseSeat(req: Request, res: Response) {
  const { flightId } = req.params;
  
  connection.execute(
    'UPDATE Flights SET SeatsAvailable = SeatsAvailable + 1 WHERE FlightID = ?',
    [flightId],
    (err, result: any) => {
      if (err) {
        return res.status(500).json({ message: 'Error releasing seat' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Flight not found' });
      }
      res.json({ message: 'Seat released successfully' });
    }
  );
}
```

### 4. Booking Service - Gọi User Service và Flight Service

Update `BookingController.ts`:
```typescript
import axios from 'axios';

export class BookingController {
  private userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:5001';
  private flightServiceUrl = process.env.FLIGHT_SERVICE_URL || 'http://localhost:5002';

  async createBooking(req: Request, res: Response) {
    const { userID, flightID } = req.body;

    if (!userID || !flightID) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    try {
      // ✅ Gọi User Service để verify user tồn tại
      const userResponse = await axios.get(`${this.userServiceUrl}/api/users/${userID}`);
      
      if (!userResponse.data) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      // ✅ Gọi Flight Service để verify flight tồn tại và có ghế
      const flightResponse = await axios.get(`${this.flightServiceUrl}/api/Flights/${flightID}`);
      
      if (!flightResponse.data) {
        res.status(404).json({ message: 'Flight not found' });
        return;
      }

      if (flightResponse.data.SeatsAvailable <= 0) {
        res.status(400).json({ message: 'No seats available' });
        return;
      }

      // Tạo booking trong database riêng
      const query = 'INSERT INTO Bookings (UserID, FlightID, BookingStatus, PaymentStatus) VALUES (?, ?, ?, ?)';
      
      connection.execute(query, [userID, flightID, 'pending', 'unpaid'], async (err, result: any) => {
        if (err) {
          console.error('Error creating booking:', err);
          res.status(500).json({ message: 'Error creating booking', error: err.message });
          return;
        }

        // ✅ Gọi Flight Service để reserve seat
        try {
          await axios.post(`${this.flightServiceUrl}/api/Flights/${flightID}/reserve-seat`);
        } catch (error) {
          console.error('Error reserving seat:', error);
          // Rollback booking nếu không reserve được seat
          connection.execute('DELETE FROM Bookings WHERE BookingID = ?', [result.insertId]);
          res.status(500).json({ message: 'Error reserving seat' });
          return;
        }

        res.status(201).json({
          message: 'Booking created successfully',
          bookingId: result.insertId
        });
      });

    } catch (error: any) {
      console.error('Service communication error:', error);
      res.status(500).json({ 
        message: 'Error communicating with other services',
        error: error.message 
      });
    }
  }

  async cancelBooking(req: Request, res: Response) {
    const { bookingId } = req.body;

    if (!bookingId) {
      res.status(400).json({ message: 'Missing booking ID' });
      return;
    }

    // Lấy thông tin booking
    const getBookingQuery = 'SELECT FlightID, BookingStatus FROM Bookings WHERE BookingID = ?';
    connection.query(getBookingQuery, [bookingId], async (err, results: any) => {
      if (err) {
        res.status(500).json({ message: 'Error fetching booking', error: err.message });
        return;
      }

      if (results.length === 0) {
        res.status(404).json({ message: 'Booking not found' });
        return;
      }

      if (results[0].BookingStatus === 'cancelled') {
        res.status(400).json({ message: 'Booking is already cancelled' });
        return;
      }

      const flightId = results[0].FlightID;

      // Update booking status
      const updateQuery = 'UPDATE Bookings SET BookingStatus = ? WHERE BookingID = ?';
      connection.execute(updateQuery, ['cancelled', bookingId], async (err, result: any) => {
        if (err) {
          res.status(500).json({ message: 'Error cancelling booking', error: err.message });
          return;
        }

        // ✅ Gọi Flight Service để release seat
        try {
          await axios.post(`${this.flightServiceUrl}/api/Flights/${flightId}/release-seat`);
        } catch (error) {
          console.error('Error releasing seat:', error);
          // Vẫn trả về success vì booking đã bị cancel
        }

        res.status(200).json({ message: 'Booking cancelled successfully' });
      });
    });
  }
}
```

### 5. Offer Service - Gọi User Service để lấy emails

Update `OfferController.ts`:
```typescript
import axios from 'axios';

export class OfferController {
  private userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:5001';

  async createOffer(req: Request, res: Response) {
    const { title, content, userID } = req.body;

    if (!title || !content || !userID) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    try {
      // ✅ Gọi User Service để check admin
      const userRoleResponse = await axios.get(`${this.userServiceUrl}/api/users/${userID}/role`);
      
      if (userRoleResponse.data.role !== 'Admin') {
        res.status(403).json({ message: 'Permission denied: User is not an admin' });
        return;
      }

      // Tạo offer
      const insertQuery = 'INSERT INTO Offers (Title, Content) VALUES (?, ?)';
      connection.query(insertQuery, [title, content], async (err) => {
        if (err) {
          console.error('Error inserting offer:', err);
          res.status(500).json({ message: 'Failed to create Offer' });
          return;
        }

        // ✅ Gọi User Service để lấy tất cả emails
        try {
          const emailsResponse = await axios.get(`${this.userServiceUrl}/api/users/emails/all`);
          const emails = emailsResponse.data.emails;

          // Gửi email
          await Promise.all(
            emails.map((email: string) =>
              sendEmail(
                email,
                `New Offer: ${title}`,
                `Hello,\n\nWe have a new offer for you:\n\n${content}\n\nBest regards,\nQAirline Team`
              ).catch((error) => {
                console.error(`Failed to send email to ${email}:`, error);
              })
            )
          );

          res.status(201).json({
            message: 'Offer created successfully and notifications sent',
            timestamp: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
          });
        } catch (error) {
          console.error('Error getting emails or sending notifications:', error);
          res.status(201).json({ 
            message: 'Offer created but failed to send notifications' 
          });
        }
      });

    } catch (error: any) {
      console.error('Error calling User Service:', error);
      res.status(500).json({ 
        message: 'Error verifying user permissions',
        error: error.message 
      });
    }
  }
}
```

## 📊 Data Flow Example

### Example: User đặt vé

```
┌─────────┐  1. POST /api/Bookings/CreateBooking  ┌──────────────────┐
│ Client  │────────────────────────────────────────>│ Booking Service  │
└─────────┘                                         └──────────────────┘
                                                            │
                                   ┌────────────────────────┴────────────────────┐
                                   │                                             │
                          2. GET /api/users/1              3. GET /api/Flights/5 │
                                   ▼                                             ▼
                            ┌──────────────┐                          ┌──────────────┐
                            │ User Service │                          │Flight Service│
                            └──────────────┘                          └──────────────┘
                                   │                                             │
                            user_service_db                              flight_service_db
                                   │                                             │
                         Return user info              Return flight info + check seats
                                   │                                             │
                                   └────────────────────────┬────────────────────┘
                                                            ▼
                                                  ┌──────────────────┐
                                            4. Insert Booking into  │
                                                  booking_service_db │
                                                  └──────────────────┘
                                                            │
                                     5. POST /api/Flights/5/reserve-seat
                                                            ▼
                                                  ┌──────────────────┐
                                                  │ Flight Service   │
                                                  │ Update seats     │
                                                  └──────────────────┘
```

## ⚠️ Quan Trọng - Data Consistency

### Vấn đề: Distributed Transactions

Khi booking service tạo booking và gọi flight service để reserve seat, nếu reserve seat FAIL thì phải rollback booking. Đây là **Saga Pattern**.

### Giải pháp: Compensating Transactions

```typescript
async createBooking(req: Request, res: Response) {
  let bookingId: number;
  
  try {
    // 1. Tạo booking
    const result = await this.createBookingRecord(userID, flightID);
    bookingId = result.insertId;
    
    // 2. Reserve seat
    await axios.post(`${this.flightServiceUrl}/api/Flights/${flightID}/reserve-seat`);
    
    res.status(201).json({ bookingId });
    
  } catch (error) {
    // 3. Compensating transaction: Xóa booking nếu reserve seat fail
    if (bookingId) {
      await this.deleteBookingRecord(bookingId);
    }
    res.status(500).json({ message: 'Booking failed' });
  }
}
```

## 🎯 Benefits của Database Per Service

✅ **Independence**: Mỗi service hoàn toàn độc lập
✅ **Scalability**: Scale từng service riêng theo nhu cầu
✅ **Technology Freedom**: Có thể dùng MongoDB cho một service, PostgreSQL cho service khác
✅ **Fault Isolation**: 1 database down không ảnh hưởng tất cả
✅ **Clear Ownership**: Rõ ràng service nào owns data nào

## 📝 Checklist Migration

- [ ] Chạy `SETUP-SEPARATE-DATABASES.sql` 
- [ ] Update .env cho tất cả 4 services
- [ ] Thêm USER_SERVICE_URL, FLIGHT_SERVICE_URL vào .env
- [ ] Install axios: `npm install axios` trong tất cả services
- [ ] Update UserController: thêm getUserById, getUserRole, getAllEmails
- [ ] Update FlightController: thay query Users bằng axios call
- [ ] Update FlightController: thêm getFlightById, reserveSeat, releaseSeat
- [ ] Update BookingController: thay query Users/Flights bằng axios call
- [ ] Update OfferController: thay query Users bằng axios call
- [ ] Test từng endpoint
- [ ] Implement error handling cho service communication
- [ ] Implement retry logic cho failed API calls
- [ ] Implement circuit breaker pattern (optional)

---
**Version:** 2.0.0 (True Microservices)  
**Last Updated:** November 2025
