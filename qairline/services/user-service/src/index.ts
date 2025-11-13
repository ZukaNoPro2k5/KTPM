import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import { UserController } from './controllers/UserController';

dotenv.config();

const app = express();
const userController = new UserController();

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Auth routes (theo cấu trúc backend cũ)
app.post('/api/auth/signin', userController.signIn.bind(userController));
app.post('/api/auth/signup', userController.signUp.bind(userController));

// User management routes (theo cấu trúc backend cũ)
app.get('/api/User/GetAllUser', userController.getAllUsers.bind(userController));
app.post('/api/User/DeleteUser', userController.deleteUser.bind(userController));

// Internal APIs for other services
app.get('/api/users/:userId', userController.getUserById.bind(userController));
app.get('/api/users/:userId/role', userController.getUserRole.bind(userController));
app.get('/api/users/emails/all', userController.getAllEmails.bind(userController));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Healthz check for kubernetes/docker
app.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));

const PORT = process.env.PORT || 5001;

// Start server
app.listen(PORT, () => {
  console.log(`User service is running on port ${PORT}`);
  console.log(`✅ Connected to database: ${process.env.DB_NAME}`);
});
