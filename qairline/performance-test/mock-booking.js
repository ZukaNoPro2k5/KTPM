/**
 * BOOKING SERVICE - Heavy operations
 */

const express = require('express');
const PORT = parseInt(process.argv[2]) || 3003;

const mockBookings = [];

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'booking', pid: process.pid });
});

// ONLY Booking - Heavy operation
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
  console.log(`🎫 BOOKING SERVICE on port ${PORT} (PID: ${process.pid})`);
});
