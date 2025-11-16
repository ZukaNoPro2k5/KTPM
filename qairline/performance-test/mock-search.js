/**
 * SEARCH SERVICE - Lightweight, specialized for search
 */

const express = require('express');
const PORT = parseInt(process.argv[2]) || 3002;

const mockFlights = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  flightNumber: `VN${1000 + i}`,
  departure: i % 2 === 0 ? 'HAN' : 'SGN',
  arrival: i % 2 === 0 ? 'SGN' : 'HAN',
  price: 1000000 + Math.random() * 2000000,
}));

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'search', pid: process.pid });
});

// ONLY Search - Optimized (40-80ms instead of 50-100ms)
app.post('/api/flights/search', (req, res) => {
  const start = Date.now();
  const { departure, arrival } = req.body;
  const delay = 40 + Math.random() * 40; // Slightly faster (specialized)
  
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

app.listen(PORT, () => {
  console.log(`🔍 SEARCH SERVICE on port ${PORT} (PID: ${process.pid})`);
});
