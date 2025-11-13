/// <reference types="jest" />
/**
 * Advanced Test Cases cho Flight Service
 * Test các chức năng mới: Admin validation, edit flight, search by FlightID
 */
import request from 'supertest';
import express from 'express';
import flightRoutes from '../src/routes/flightRoutes';

jest.mock('../src/database/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
    execute: jest.fn(),
  }
}));

import connection from '../src/database/database';

const app = express();
app.use(express.json());
app.use('/api/flights', flightRoutes);

describe('Flight Routes - Advanced Tests', () => {
  let mockQuery: jest.Mock;
  let mockExecute: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = connection.query as jest.Mock;
    mockExecute = connection.execute as jest.Mock;
  });

  describe('POST /api/flights/Add - With Admin Check', () => {
    it('nên tạo flight thành công khi user là Admin', async () => {
      // Mock check admin
      mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, [{ Role: 'Admin' }]);
      });
      // Mock get aircraft ID from model
      mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, [{ aircraftID: 1 }]);
      });
      // Mock insert flight
      mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, { insertId: 100 });
      });

      const response = await request(app)
        .post('/api/flights/Add')
        .send({
          userID: 1,
          model: 'Boeing 777',
          departure: 'Hanoi',
          arrival: 'Ho Chi Minh',
          departureTime: '2024-12-01 08:00:00',
          arrivalTime: '2024-12-01 10:00:00',
          price: 1500000,
          seatsAvailable: 50,
          status: 'scheduled'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Flight added successfully');
      expect(response.body.flightId).toBe(100);
    });

    it('nên trả về 403 khi user không phải Admin', async () => {
      mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, [{ Role: 'Customer' }]); // Not admin
      });

      const response = await request(app)
        .post('/api/flights/Add')
        .send({
          userID: 2,
          model: 'Boeing 777',
          departure: 'Hanoi',
          arrival: 'Ho Chi Minh',
          departureTime: '2024-12-01 08:00:00',
          arrivalTime: '2024-12-01 10:00:00',
          price: 1500000,
          seatsAvailable: 50
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/permission denied/i);
    });

    it('nên trả về 404 khi aircraft model không tồn tại', async () => {
      mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, [{ Role: 'Admin' }]);
      });
      mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, []); // Aircraft not found
      });

      const response = await request(app)
        .post('/api/flights/Add')
        .send({
          userID: 1,
          model: 'NonExistent Model',
          departure: 'Hanoi',
          arrival: 'Ho Chi Minh',
          departureTime: '2024-12-01 08:00:00',
          arrivalTime: '2024-12-01 10:00:00',
          price: 1500000,
          seatsAvailable: 50
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Aircraft model not found');
    });
  });

  describe('POST /api/flights/UpdateStatus - With Admin Check', () => {
    it('nên update status thành công khi user là Admin', async () => {
      // Check admin
      mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, [{ Role: 'Admin' }]);
      });
      // Check flight exists
      mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, [{ flightID: 1 }]);
      });
      // Update status
      mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, { affectedRows: 1 });
      });

      const response = await request(app)
        .post('/api/flights/UpdateStatus')
        .send({
          userID: 1,
          flightID: 1,
          status: 'delayed'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Flight status updated successfully');
    });

    it('nên trả về 403 khi user không phải Admin', async () => {
      mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, []); // User not found or not admin
      });

      const response = await request(app)
        .post('/api/flights/UpdateStatus')
        .send({
          userID: 999,
          flightID: 1,
          status: 'cancelled'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/flights/Delete - With Admin Check', () => {
    it('nên xóa flight thành công khi user là Admin', async () => {
      // Check admin
      mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, [{ Role: 'Admin' }]);
      });
      // Check flight exists
      mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, [{ flightID: 1 }]);
      });
      // Delete flight
      mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, { affectedRows: 1 });
      });

      const response = await request(app)
        .post('/api/flights/Delete')
        .send({
          userID: 1,
          flightID: 1
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Flight deleted successfully');
    });

    it('nên trả về 403 khi user không phải Admin', async () => {
      mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, [{ Role: 'Customer' }]);
      });

      const response = await request(app)
        .post('/api/flights/Delete')
        .send({
          userID: 2,
          flightID: 1
        });

      expect(response.status).toBe(403);
    });

    it('nên trả về 404 khi flight không tồn tại', async () => {
      mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, [{ Role: 'Admin' }]);
      });
      mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, []); // Flight not found
      });

      const response = await request(app)
        .post('/api/flights/Delete')
        .send({
          userID: 1,
          flightID: 999
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Flight not found');
    });
  });

  describe('POST /api/flights/Search - Enhanced', () => {
    it('nên tìm flight theo flightID', async () => {
      const mockFlight = {
        flightID: 1,
        Departure: 'Hanoi',
        Arrival: 'Ho Chi Minh',
        DepartureTime: '2024-12-01 08:00:00',
        ArrivalTime: '2024-12-01 10:00:00',
        Price: 1500000,
        SeatsAvailable: 50,
        Status: 'scheduled',
        AircraftModel: 'Boeing 777'
      };

      mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, [mockFlight]);
      });

      const response = await request(app)
        .post('/api/flights/Search')
        .send({ flightID: 1 });

      expect(response.status).toBe(200);
      expect(response.body[0]).toMatchObject(mockFlight);
    });

    it('nên tìm flights theo departure và arrival', async () => {
      const mockFlights = [
        {
          flightID: 1,
          Departure: 'Hanoi',
          Arrival: 'Ho Chi Minh',
          AircraftModel: 'Boeing 777'
        },
        {
          flightID: 2,
          Departure: 'Hanoi',
          Arrival: 'Ho Chi Minh',
          AircraftModel: 'Airbus A320'
        }
      ];

      mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, mockFlights);
      });

      const response = await request(app)
        .post('/api/flights/Search')
        .send({
          departure: 'Hanoi',
          arrival: 'Ho Chi Minh'
        });

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
    });

    it('nên trả về 400 khi thiếu cả FlightID và route', async () => {
      const response = await request(app)
        .post('/api/flights/Search')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/missing search parameters/i);
    });
  });

  describe('POST /api/flights/Edit - New Feature', () => {
    it('nên edit flight thành công với full fields', async () => {
      // Check admin
      mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, [{ Role: 'Admin' }]);
      });
      // Check flight exists
      mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, [{
          flightID: 1,
          AircraftTypeID: 1,
          Departure: 'Old Departure',
          Arrival: 'Old Arrival',
          DepartureTime: '2024-12-01 08:00:00',
          ArrivalTime: '2024-12-01 10:00:00',
          Price: 1000000,
          SeatsAvailable: 50,
          Status: 'scheduled'
        }]);
      });
      // Get aircraft from model
      mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, [{ aircraftID: 2 }]);
      });
      // Update flight
      mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, { affectedRows: 1 });
      });

      const response = await request(app)
        .post('/api/flights/Edit')
        .send({
          userID: 1,
          flightID: 1,
          model: 'Airbus A350',
          departure: 'New Departure',
          arrival: 'New Arrival',
          price: 2000000
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Flight information updated successfully');
    });

    it('nên edit flight chỉ với một số fields', async () => {
      mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, [{ Role: 'Admin' }]);
      });
      mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, [{
          flightID: 1,
          AircraftTypeID: 1,
          Departure: 'Hanoi',
          Arrival: 'Ho Chi Minh',
          DepartureTime: '2024-12-01 08:00:00',
          ArrivalTime: '2024-12-01 10:00:00',
          Price: 1500000,
          SeatsAvailable: 50,
          Status: 'scheduled'
        }]);
      });
      mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, { affectedRows: 1 });
      });

      const response = await request(app)
        .post('/api/flights/Edit')
        .send({
          userID: 1,
          flightID: 1,
          price: 1800000, // Chỉ update price
          status: 'delayed' // và status
        });

      expect(response.status).toBe(200);
    });

    it('nên trả về 403 khi user không phải Admin', async () => {
      mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, [{ Role: 'Customer' }]);
      });

      const response = await request(app)
        .post('/api/flights/Edit')
        .send({
          userID: 2,
          flightID: 1,
          price: 2000000
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/permission denied/i);
    });

    it('nên trả về 404 khi flight không tồn tại', async () => {
      mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, [{ Role: 'Admin' }]);
      });
      mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, []); // Flight not found
      });

      const response = await request(app)
        .post('/api/flights/Edit')
        .send({
          userID: 1,
          flightID: 999,
          price: 2000000
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Flight not found');
    });
  });

  describe('Edge Cases & Advanced Scenarios', () => {
    it('nên xử lý concurrent admin operations', async () => {
      // Simulate 2 admins updating same flight
      const updatePromises = Array(2).fill(null).map(() => {
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ Role: 'Admin' }]);
        });
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ flightID: 1 }]);
        });
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 1 });
        });

        return request(app)
          .post('/api/flights/UpdateStatus')
          .send({
            userID: 1,
            flightID: 1,
            status: 'delayed'
          });
      });

      const responses = await Promise.all(updatePromises);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('nên validate aircraft type khi add flight', async () => {
      mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, [{ Role: 'Admin' }]);
      });
      mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
        callback(null, []); // No such aircraft
      });

      const response = await request(app)
        .post('/api/flights/Add')
        .send({
          userID: 1,
          model: 'Invalid Model',
          departure: 'Hanoi',
          arrival: 'Ho Chi Minh',
          departureTime: '2024-12-01 08:00:00',
          arrivalTime: '2024-12-01 10:00:00',
          price: 1500000,
          seatsAvailable: 50
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Aircraft model not found');
    });
  });
});

