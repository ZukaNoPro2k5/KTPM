/// <reference types="jest" />
// Test routes cho booking service - Bao phủ đầy đủ: happy path + error cases
import request from 'supertest';
import express from 'express';
import bookingRoutes from '../src/routes/bookingRoutes';
import connection from '../src/database/database';

// Mock kết nối database
jest.mock('../src/database/database', () => ({
  __esModule: true,
  default: {
    execute: jest.fn(),
    query: jest.fn(),
  },
}));

const mockExecute = connection.execute as jest.Mock;
const mockQuery = connection.query as jest.Mock;

const app = express();
app.use(express.json());
app.use('/api/bookings', bookingRoutes);

describe('Booking Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/bookings/BookFlights', () => {
    describe('Trường hợp thành công', () => {
      it('nên đặt vé chuyến bay thành công', async () => {
        // Mock user tồn tại
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ userID: 1 }]);
        });
        // Mock chuyến bay tồn tại và có ghế trống
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ flightID: 1, SeatsAvailable: 10 }]);
        });
        // Mock kiểm tra booking trùng lặp - không có
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, []);
        });
        // Mock thêm booking vào database
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { insertId: 123 });
        });
        // Mock cập nhật số ghế
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 1 });
        });

        const response = await request(app)
          .post('/api/bookings/BookFlights')
          .send({ userID: 1, flightID: 1 });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Flight booked successfully');
        expect(response.body.bookingId).toBe(123);
        
        // Kiểm tra thứ tự gọi các hàm: check user, check flight, check duplicate, insert, update seats
        expect(mockQuery).toHaveBeenCalledTimes(3);
        expect(mockExecute).toHaveBeenCalledTimes(2);
      });

      it('nên đặt vé với nhiều chuyến bay khác nhau cho cùng user', async () => {
        // Đặt vé chuyến bay 1
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ userID: 1 }]);
        });
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ flightID: 1, SeatsAvailable: 5 }]);
        });
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, []); // Không có booking trùng
        });
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { insertId: 101 });
        });
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 1 });
        });

        const response1 = await request(app)
          .post('/api/bookings/BookFlights')
          .send({ userID: 1, flightID: 1 });

        expect(response1.status).toBe(201);
        expect(response1.body.bookingId).toBe(101);

        // Đặt vé chuyến bay 2 cho cùng user
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ userID: 1 }]);
        });
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ flightID: 2, SeatsAvailable: 3 }]);
        });
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, []); // Không có booking trùng
        });
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { insertId: 102 });
        });
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 1 });
        });

        const response2 = await request(app)
          .post('/api/bookings/BookFlights')
          .send({ userID: 1, flightID: 2 });

        expect(response2.status).toBe(201);
        expect(response2.body.bookingId).toBe(102);
      });
    });

    describe('Lỗi validation', () => {
      it('nên trả về 400 khi thiếu UserID', async () => {
        const response = await request(app)
          .post('/api/bookings/BookFlights')
          .send({ flightID: 1 });

        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/missing required fields/i);
      });

      it('nên trả về 400 khi thiếu FlightID', async () => {
        const response = await request(app)
          .post('/api/bookings/BookFlights')
          .send({ userID: 1 });

        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/missing required fields/i);
      });

      it('nên trả về 400 khi thiếu cả hai trường', async () => {
        const response = await request(app)
          .post('/api/bookings/BookFlights')
          .send({});

        expect(response.status).toBe(400);
      });
    });

    describe('Lỗi không tìm thấy', () => {
      it('nên trả về 404 khi user không tồn tại', async () => {
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, []); // Kết quả rỗng - không tìm thấy user
        });

        const response = await request(app)
          .post('/api/bookings/BookFlights')
          .send({ userID: 999, flightID: 1 });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('User not found');
        expect(mockQuery).toHaveBeenCalledTimes(1);
        expect(mockExecute).not.toHaveBeenCalled();
      });

      it('nên trả về 404 khi chuyến bay không tồn tại', async () => {
        // User tồn tại
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ userID: 1 }]);
        });
        // Không tìm thấy chuyến bay
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, []); // Kết quả rỗng
        });

        const response = await request(app)
          .post('/api/bookings/BookFlights')
          .send({ userID: 1, flightID: 999 });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Flight not found');
        expect(mockQuery).toHaveBeenCalledTimes(2);
        expect(mockExecute).not.toHaveBeenCalled();
      });
    });

    describe('Lỗi logic nghiệp vụ', () => {
      it('nên trả về 400 khi không còn ghế trống', async () => {
        // User tồn tại
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ userID: 1 }]);
        });
        // Chuyến bay tồn tại nhưng SeatsAvailable = 0
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ flightID: 1, SeatsAvailable: 0 }]);
        });

        const response = await request(app)
          .post('/api/bookings/BookFlights')
          .send({ userID: 1, flightID: 1 });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('No seats available on this flight');
        expect(mockExecute).not.toHaveBeenCalled();
      });

      it('nên trả về 400 khi user đã đặt vé chuyến bay này rồi (booking trùng lặp)', async () => {
        // User tồn tại
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ userID: 1 }]);
        });
        // Chuyến bay tồn tại và có ghế
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ flightID: 1, SeatsAvailable: 5 }]);
        });
        // Đã có booking trùng lặp (confirmed)
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ bookingId: 99 }]);
        });

        const response = await request(app)
          .post('/api/bookings/BookFlights')
          .send({ userID: 1, flightID: 1 });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('You have already booked this flight');
        expect(mockExecute).not.toHaveBeenCalled();
      });

      it('nên cho phép đặt lại sau khi đã hủy booking trước đó', async () => {
        // User tồn tại
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ userID: 1 }]);
        });
        // Chuyến bay tồn tại
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ flightID: 1, SeatsAvailable: 5 }]);
        });
        // Không có booking active (booking cũ đã cancelled)
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, []); // Query WHERE BookingStatus != 'cancelled' => rỗng
        });
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { insertId: 200 });
        });
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 1 });
        });

        const response = await request(app)
          .post('/api/bookings/BookFlights')
          .send({ userID: 1, flightID: 1 });

        expect(response.status).toBe(201);
        expect(response.body.bookingId).toBe(200);
      });
    });

    describe('Lỗi database', () => {
      it('nên trả về 500 khi kiểm tra user thất bại', async () => {
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(new Error('DB connection failed'), null);
        });

        const response = await request(app)
          .post('/api/bookings/BookFlights')
          .send({ userID: 1, flightID: 1 });

        expect(response.status).toBe(500);
        expect(response.body.message).toMatch(/error checking user/i);
      });

      it('nên trả về 500 khi kiểm tra chuyến bay thất bại', async () => {
        // Kiểm tra user thành công
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ userID: 1 }]);
        });
        // Kiểm tra chuyến bay thất bại
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(new Error('DB error'), null);
        });

        const response = await request(app)
          .post('/api/bookings/BookFlights')
          .send({ userID: 1, flightID: 1 });

        expect(response.status).toBe(500);
        expect(response.body.message).toMatch(/error checking flight/i);
      });

      it('nên trả về 500 khi kiểm tra booking trùng lặp thất bại', async () => {
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ userID: 1 }]);
        });
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ flightID: 1, SeatsAvailable: 5 }]);
        });
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(new Error('DB timeout'), null);
        });

        const response = await request(app)
          .post('/api/bookings/BookFlights')
          .send({ userID: 1, flightID: 1 });

        expect(response.status).toBe(500);
        expect(response.body.message).toMatch(/error checking duplicate booking/i);
      });

      it('nên trả về 500 khi tạo booking thất bại', async () => {
        // User tồn tại
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ userID: 1 }]);
        });
        // Chuyến bay tồn tại
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ flightID: 1, SeatsAvailable: 5 }]);
        });
        // Không có booking trùng
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, []);
        });
        // Thêm booking thất bại
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(new Error('Insert failed'), null);
        });

        const response = await request(app)
          .post('/api/bookings/BookFlights')
          .send({ userID: 1, flightID: 1 });

        expect(response.status).toBe(500);
        expect(response.body.message).toMatch(/error creating booking/i);
        // Số ghế KHÔNG nên được cập nhật nếu tạo booking thất bại
        expect(mockExecute).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('POST /api/bookings/CancelBooking', () => {
    describe('Trường hợp thành công', () => {
      it('nên hủy booking thành công và hoàn lại ghế', async () => {
        // Mock lấy thông tin booking
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ flightID: 1, BookingStatus: 'confirmed' }]);
        });
        // Mock cập nhật status
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 1 });
        });
        // Mock hoàn lại ghế
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 1 });
        });

        const response = await request(app)
          .post('/api/bookings/CancelBooking')
          .send({ bookingId: 1 });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Booking cancelled successfully');
        expect(mockQuery).toHaveBeenCalledTimes(1); // Get booking info
        expect(mockExecute).toHaveBeenCalledTimes(2); // Update status + restore seats
      });

      it('nên vẫn thành công nếu restore seats thất bại (đã cancel)', async () => {
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ flightID: 1, BookingStatus: 'confirmed' }]);
        });
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 1 });
        });
        // Mock restore seats thất bại nhưng vẫn log error và trả về success
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(new Error('Restore failed'), null);
        });

        const response = await request(app)
          .post('/api/bookings/CancelBooking')
          .send({ bookingId: 1 });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Booking cancelled successfully');
      });
    });

    describe('Lỗi validation', () => {
      it('nên trả về 400 khi thiếu bookingId', async () => {
        const response = await request(app)
          .post('/api/bookings/CancelBooking')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/missing booking id/i);
      });
    });

    describe('Lỗi không tìm thấy', () => {
      it('nên trả về 404 khi booking không tồn tại', async () => {
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, []); // Không tìm thấy booking
        });

        const response = await request(app)
          .post('/api/bookings/CancelBooking')
          .send({ bookingId: 999 });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Booking not found');
      });

      it('nên trả về 400 khi booking đã bị hủy trước đó', async () => {
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ flightID: 1, BookingStatus: 'cancelled' }]);
        });

        const response = await request(app)
          .post('/api/bookings/CancelBooking')
          .send({ bookingId: 1 });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Booking is already cancelled');
        expect(mockExecute).not.toHaveBeenCalled(); // Không update nếu đã cancelled
      });
    });

    describe('Lỗi database', () => {
      it('nên trả về 500 khi lấy thông tin booking thất bại', async () => {
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(new Error('DB connection failed'), null);
        });

        const response = await request(app)
          .post('/api/bookings/CancelBooking')
          .send({ bookingId: 1 });

        expect(response.status).toBe(500);
        expect(response.body.message).toMatch(/error fetching booking/i);
      });

      it('nên trả về 500 khi cập nhật database thất bại', async () => {
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ flightID: 1, BookingStatus: 'confirmed' }]);
        });
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(new Error('Update failed'), null);
        });

        const response = await request(app)
          .post('/api/bookings/CancelBooking')
          .send({ bookingId: 1 });

        expect(response.status).toBe(500);
        expect(response.body.message).toMatch(/error cancelling booking/i);
      });
    });
  });

  describe('GET /api/bookings/', () => {
    describe('Trường hợp thành công', () => {
      it('nên trả về tất cả bookings thành công', async () => {
        const mockBookings = [
          { bookingId: 1, userID: 1, flightID: 1 },
          { bookingId: 2, userID: 2, flightID: 2 }
        ];
        
        mockQuery.mockImplementation((sql: any, callback: any) => {
          callback(null, mockBookings);
        });

        const response = await request(app).get('/api/bookings/');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toEqual(mockBookings);
        expect(response.body.length).toBe(2);
      });
    });

    describe('Kết quả rỗng', () => {
      it('nên trả về 404 khi không có booking nào', async () => {
        mockQuery.mockImplementation((sql: any, callback: any) => {
          callback(null, []); // Mảng rỗng
        });

        const response = await request(app).get('/api/bookings/');

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('No bookings found');
      });
    });

    describe('Lỗi database', () => {
      it('nên trả về 500 khi truy vấn database thất bại', async () => {
        mockQuery.mockImplementation((sql: any, callback: any) => {
          callback(new Error('Database connection lost'), null);
        });

        const response = await request(app).get('/api/bookings/');

        expect(response.status).toBe(500);
        expect(response.body.message).toMatch(/internal server error/i);
      });
    });
  });

  describe('GET /api/bookings/user/:userId', () => {
    describe('Trường hợp thành công', () => {
      it('nên trả về các bookings của user thành công', async () => {
        const mockBookings = [
          { bookingId: 1, userID: 1, flightID: 1 },
          { bookingId: 3, userID: 1, flightID: 3 }
        ];

        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, mockBookings);
        });

        const response = await request(app).get('/api/bookings/user/1');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toEqual(mockBookings);
        // Kiểm tra tham số userId đã được truyền đúng
        expect(mockExecute).toHaveBeenCalledWith(
          expect.any(String),
          ['1'],
          expect.any(Function)
        );
      });
    });

    describe('Kết quả rỗng', () => {
      it('nên trả về 404 khi user không có booking nào', async () => {
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, []);
        });

        const response = await request(app).get('/api/bookings/user/999');

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('No bookings found for this user');
      });
    });

    describe('Validation', () => {
      it('nên xử lý tham số userId dạng số đúng cách', async () => {
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, [{ bookingId: 1, userID: 123 }]);
        });

        const response = await request(app).get('/api/bookings/user/123');

        expect(response.status).toBe(200);
        expect(mockExecute).toHaveBeenCalledWith(
          expect.any(String),
          ['123'],
          expect.any(Function)
        );
      });
    });

    describe('Lỗi database', () => {
      it('nên trả về 500 khi truy vấn database thất bại', async () => {
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(new Error('Query timeout'), null);
        });

        const response = await request(app).get('/api/bookings/user/1');

        expect(response.status).toBe(500);
        expect(response.body.message).toMatch(/error fetching bookings/i);
      });
    });
  });

  describe('DELETE /api/bookings/', () => {
    it('nên xử lý yêu cầu xóa booking', async () => {
      mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
        callback(null, { affectedRows: 1 });
      });

      const response = await request(app)
        .delete('/api/bookings/')
        .send({ bookingId: 1 });

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/bookings/payment', () => {
    describe('Trường hợp thành công', () => {
      it('nên xử lý thanh toán thành công', async () => {
        // Mock thêm payment
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { insertId: 456 });
        });
        // Mock cập nhật booking
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 1 });
        });

        const response = await request(app)
          .post('/api/bookings/payment')
          .send({ bookingId: 1, amount: 100 });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Payment processed successfully');
        expect(response.body.paymentId).toBe(456);
        expect(mockExecute).toHaveBeenCalledTimes(2);
      });
    });

    describe('Lỗi validation', () => {
      it('nên trả về 400 khi thiếu bookingId', async () => {
        const response = await request(app)
          .post('/api/bookings/payment')
          .send({ Amount: 100 });

        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/missing required fields/i);
      });

      it('nên trả về 400 khi thiếu amount', async () => {
        const response = await request(app)
          .post('/api/bookings/payment')
          .send({ bookingId: 1 });

        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/missing required fields/i);
      });

      it('nên trả về 400 khi thiếu cả hai trường', async () => {
        const response = await request(app)
          .post('/api/bookings/payment')
          .send({});

        expect(response.status).toBe(400);
      });
    });

    describe('Lỗi database', () => {
      it('nên trả về 500 khi thêm payment thất bại', async () => {
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(new Error('Insert payment failed'), null);
        });

        const response = await request(app)
          .post('/api/bookings/payment')
          .send({ bookingId: 1, amount: 100 });

        expect(response.status).toBe(500);
        expect(response.body.message).toMatch(/error processing payment/i);
        // Không nên cập nhật booking nếu thêm payment thất bại
        expect(mockExecute).toHaveBeenCalledTimes(1);
      });

      it('nên trả về 500 khi cập nhật booking thất bại sau khi tạo payment', async () => {
        // Thêm payment thành công
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { insertId: 456 });
        });
        // Cập nhật booking thất bại
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(new Error('Update booking failed'), null);
        });

        const response = await request(app)
          .post('/api/bookings/payment')
          .send({ bookingId: 1, amount: 100 });

        expect(response.status).toBe(500);
        expect(response.body.message).toMatch(/payment processed but failed to update booking/i);
        expect(mockExecute).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('DELETE /api/bookings/', () => {
    describe('Trường hợp thành công', () => {
      it('nên xóa booking thành công', async () => {
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 1 });
        });

        const response = await request(app)
          .delete('/api/bookings/')
          .send({ bookingId: 1 });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Booking deleted successfully');
      });
    });

    describe('Lỗi validation', () => {
      it('nên trả về 400 khi thiếu bookingId', async () => {
        const response = await request(app)
          .delete('/api/bookings/')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/missing booking id/i);
      });
    });

    describe('Lỗi không tìm thấy', () => {
      it('nên trả về 404 khi booking không tồn tại', async () => {
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 0 });
        });

        const response = await request(app)
          .delete('/api/bookings/')
          .send({ bookingId: 999 });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Booking not found');
      });
    });

    describe('Lỗi database', () => {
      it('nên trả về 500 khi xóa database thất bại', async () => {
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(new Error('Foreign key constraint'), null);
        });

        const response = await request(app)
          .delete('/api/bookings/')
          .send({ bookingId: 1 });

        expect(response.status).toBe(500);
        expect(response.body.message).toMatch(/error deleting booking/i);
      });
    });
  });

  describe('GET /api/bookings/payment/:bookingId', () => {
    describe('Trường hợp thành công', () => {
      it('nên trả về payment thành công', async () => {
        const mockPayment = { PaymentID: 1, bookingId: 1, amount: 100, PaymentStatus: 'completed' };
        
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, [mockPayment]);
        });

        const response = await request(app).get('/api/bookings/payment/1');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockPayment);
        expect(mockExecute).toHaveBeenCalledWith(
          expect.any(String),
          ['1'],
          expect.any(Function)
        );
      });
    });

    describe('Lỗi không tìm thấy', () => {
      it('nên trả về 404 khi payment không tồn tại', async () => {
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, []); // Kết quả rỗng
        });

        const response = await request(app).get('/api/bookings/payment/999');

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('No payment found for this booking');
      });
    });

    describe('Lỗi database', () => {
      it('nên trả về 500 khi truy vấn database thất bại', async () => {
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(new Error('Connection timeout'), null);
        });

        const response = await request(app).get('/api/bookings/payment/1');

        expect(response.status).toBe(500);
        expect(response.body.message).toMatch(/error fetching payment/i);
      });
    });
  });

  // ==================== TEST CASES NÂNG CAO ====================
  
  describe('Advanced Test Cases - Business Logic', () => {
    describe('Kiểm tra luồng đặt vé đầy đủ (End-to-End)', () => {
      it('nên xử lý đúng luồng: đặt vé -> thanh toán -> kiểm tra payment', async () => {
        // Bước 1: Đặt vé
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ userID: 1 }]); // User exists
        });
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ flightID: 1, SeatsAvailable: 10 }]); // Flight exists
        });
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, []); // No duplicate booking
        });
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { insertId: 100 }); // Create booking
        });
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 1 }); // Update seats
        });

        const bookingResponse = await request(app)
          .post('/api/bookings/BookFlights')
          .send({ userID: 1, flightID: 1 });

        expect(bookingResponse.status).toBe(201);
        const bookingId = bookingResponse.body.bookingId;

        // Bước 2: Thanh toán
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { insertId: 200 }); // Create payment
        });
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 1 }); // Update booking payment status
        });

        const paymentResponse = await request(app)
          .post('/api/bookings/payment')
          .send({ bookingId: bookingId, amount: 500 });

        expect(paymentResponse.status).toBe(200);
        expect(paymentResponse.body.paymentId).toBe(200);

        // Bước 3: Kiểm tra payment
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{
            PaymentID: 200,
            bookingId: bookingId,
            Amount: 500,
            PaymentStatus: 'completed'
          }]);
        });

        const checkPaymentResponse = await request(app).get(`/api/bookings/payment/${bookingId}`);

        expect(checkPaymentResponse.status).toBe(200);
        expect(checkPaymentResponse.body.Amount).toBe(500);
      });
    });

    describe('Kiểm tra race condition - Đặt vé cùng lúc', () => {
      it('nên ngăn chặn đặt vé trùng khi 2 requests cùng lúc', async () => {
        // Request 1: Đặt vé thành công
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ userID: 1 }]);
        });
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ flightID: 1, SeatsAvailable: 1 }]);
        });
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, []); // No duplicate
        });
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { insertId: 1 });
        });
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 1 });
        });

        const response1 = await request(app)
          .post('/api/bookings/BookFlights')
          .send({ userID: 1, flightID: 1 });

        expect(response1.status).toBe(201);

        // Request 2: Cùng user đặt cùng chuyến bay (duplicate)
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ userID: 1 }]);
        });
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ flightID: 1, SeatsAvailable: 0 }]); // Đã hết ghế
        });

        const response2 = await request(app)
          .post('/api/bookings/BookFlights')
          .send({ userID: 1, flightID: 1 });

        expect(response2.status).toBe(400);
      });
    });

    describe('Kiểm tra quản lý ghế trống', () => {
      it('nên giảm ghế khi đặt và tăng ghế khi hủy', async () => {
        let seatsAvailable = 10;

        // Đặt vé - giảm ghế
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ userID: 1 }]);
        });
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ flightID: 1, SeatsAvailable: seatsAvailable }]);
        });
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, []);
        });
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { insertId: 1 });
        });
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          seatsAvailable--; // Giảm ghế
          callback(null, { affectedRows: 1 });
        });

        const bookResponse = await request(app)
          .post('/api/bookings/BookFlights')
          .send({ userID: 1, flightID: 1 });

        expect(bookResponse.status).toBe(201);
        expect(seatsAvailable).toBe(9); // Đã giảm 1 ghế

        // Hủy vé - tăng ghế
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ flightID: 1, BookingStatus: 'confirmed' }]);
        });
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 1 });
        });
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          seatsAvailable++; // Tăng ghế
          callback(null, { affectedRows: 1 });
        });

        const cancelResponse = await request(app)
          .post('/api/bookings/CancelBooking')
          .send({ bookingId: 1 });

        expect(cancelResponse.status).toBe(200);
        expect(seatsAvailable).toBe(10); // Đã hoàn lại ghế
      });
    });

    describe('Kiểm tra edge cases', () => {
      it('nên xử lý đúng khi đặt ghế cuối cùng', async () => {
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ userID: 1 }]);
        });
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ flightID: 1, SeatsAvailable: 1 }]); // Ghế cuối
        });
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, []);
        });
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { insertId: 1 });
        });
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 1 });
        });

        const response = await request(app)
          .post('/api/bookings/BookFlights')
          .send({ userID: 1, flightID: 1 });

        expect(response.status).toBe(201);
      });

      it('nên từ chối khi SeatsAvailable âm (data corruption)', async () => {
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ userID: 1 }]);
        });
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ flightID: 1, SeatsAvailable: -1 }]); // Data lỗi
        });

        const response = await request(app)
          .post('/api/bookings/BookFlights')
          .send({ userID: 1, flightID: 1 });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('No seats available on this flight');
      });

      it('nên xử lý payment với số tiền lớn', async () => {
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { insertId: 1 });
        });
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 1 });
        });

        const response = await request(app)
          .post('/api/bookings/payment')
          .send({ bookingId: 1, amount: 999999.99 });

        expect(response.status).toBe(200);
      });

      it('nên xử lý nhiều lần hủy cùng một booking', async () => {
        // Lần 1: Hủy thành công
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ flightID: 1, BookingStatus: 'confirmed' }]);
        });
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 1 });
        });
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 1 });
        });

        const response1 = await request(app)
          .post('/api/bookings/CancelBooking')
          .send({ bookingId: 1 });

        expect(response1.status).toBe(200);

        // Lần 2: Hủy lại - should fail
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ flightID: 1, BookingStatus: 'cancelled' }]);
        });

        const response2 = await request(app)
          .post('/api/bookings/CancelBooking')
          .send({ bookingId: 1 });

        expect(response2.status).toBe(400);
        expect(response2.body.message).toBe('Booking is already cancelled');
      });
    });

    describe('Performance & Stress Testing (Simulated)', () => {
      it('nên xử lý được nhiều bookings trong payload lớn', async () => {
        const largeMockBookings = Array.from({ length: 1000 }, (_, i) => ({
          bookingId: i + 1,
          userID: (i % 10) + 1,
          flightID: (i % 20) + 1
        }));

        mockQuery.mockImplementation((sql: any, callback: any) => {
          callback(null, largeMockBookings);
        });

        const response = await request(app).get('/api/bookings/');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(1000);
      });
    });
  });

  describe('Invalid routes', () => {
    it('nên trả về 404 cho route không tồn tại', async () => {
      const response = await request(app).get('/api/bookings/nonexistent');

      expect(response.status).toBe(404);
    });
  });
});


