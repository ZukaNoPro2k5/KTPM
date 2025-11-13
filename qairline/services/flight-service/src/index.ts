import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import flightRoutes from './routes/flightRoutes';
import aircraftRoutes from './routes/aircraftRoutes';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/Flights', flightRoutes);
app.use('/api/Aircrafts', aircraftRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`Flight service is running on port ${PORT}`);
});