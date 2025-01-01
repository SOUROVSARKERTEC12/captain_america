import express from 'express';
import authRoutes from './auth.routes.js';
import orgRoutes from "./org.routes.js";
import tableARoutes from "./TestRoutes/tableA.routes.js";
import tableBRoutes from "./TestRoutes/tableB.routes.js";
import { authenticateSession } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Auth routes (e.g., login, register, logout, and OTP verification)
router.use('/client-auth', authRoutes);

// Organization routes (e.g.,)
router.use('/organization', orgRoutes);

router.use('/tableA', tableARoutes);
router.use('/tableB', tableBRoutes);

// Protected route: Homepage (accessible only by authenticated users)
router.get('/home', authenticateSession, (req, res) => {
    res.json({ message: `Welcome to the homepage, ${req.user.username}!` });
});

// Optionally, you can include other routes as needed

export default router;
