/**
 * MOCK SERVERS - Test Monolith vs Microservices Scaling
 * 
 * Chạy:
 * - Monolith: node mock-monolith.js [port]
 * - Search: node mock-search.js [port]
 * - Booking: node mock-booking.js [port]
 */

const express = require('express');
const PORT = parseInt(process.argv[2]) || 3001;

const mockFlights = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  flightNumber: `VN${1000 + i}`,
  departure: i % 2 === 0 ? 'HAN' : 'SGN',
  arrival: i % 2 === 0 ? 'SGN' : 'HAN',
  price: 1000000 + Math.random() * 2000000,
}));

const mockBookings = [];

const app = express();
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'monolith', pid: process.pid });
});

// ===== SEARCH (Heavy: 200-300ms realistic latency) =====
app.post('/api/flights/search', (req, res) => {
  const start = Date.now();
  const { departure, arrival } = req.body;
  const delay = 200 + Math.random() * 100;
  
  setTimeout(() => {
    const results = mockFlights.filter(f => 
      (!departure || f.departure === departure) &&
      (!arrival || f.arrival === arrival)
    );
    res.json({ 
      success: true, 
      flights: results,
      latency: Date.now() - start,
      pid: process.pid
    });
  }, delay);
});

// ===== BOOKING (Very Heavy: 100-200ms) =====
app.post('/api/bookings', (req, res) => {
  const start = Date.now();
  const { flightId, userId } = req.body;
  const delay = 100 + Math.random() * 100; // DB + Email + Payment
  
  setTimeout(() => {
    const booking = {
      id: mockBookings.length + 1,
      flightId,
      userId,
      status: 'confirmed'
    };
    mockBookings.push(booking);
    
    res.json({ 
      success: true, 
      booking,
      latency: Date.now() - start,
      pid: process.pid
    });
  }, delay);
});

app.listen(PORT, () => {
  console.log(`📦 MONOLITH on port ${PORT} (PID: ${process.pid})`);
});
