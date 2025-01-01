import express from 'express';
import authRoutes from './auth.routes.js';
import clientRoutes from './client.routes.js';
import { authenticateSession } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Auth routes (e.g., login, register, logout, and OTP verification)
router.use('/admin-auth', authRoutes);
router.use('/client', clientRoutes);

// Protected route: Homepage (accessible only by authenticated users)
router.get('/home', authenticateSession, (req, res) => {
    res.json({ message: `Welcome to the homepage, ${req.user.username}!` });
});

// Optionally, you can include other routes as needed

export default router;
