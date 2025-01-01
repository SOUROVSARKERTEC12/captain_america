import express from 'express';
import {
    register,
    verifyEmailOTP,
    verifyPhoneOTP,
    loginFirst,
    verifyLogin,
    login,
    logout,
    homepage
} from '../controllers/index.js';
import {verifyToken} from "../middlewares/token.middleware.js";
import {authenticateSession} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Register a new user
router.post('/register', register);

// Verify email OTP for registration
router.post('/verify-email-otp', verifyEmailOTP);

// Verify phone number OTP for registration
router.post('/verify-phone-otp', verifyPhoneOTP);

// Login a user
router.post('/login-first', loginFirst);

// Verify OTP for login
router.post('/verify-login', verifyLogin);

// Admin Login
router.post('/login', login);

// Logout the user
router.post('/logout',verifyToken, logout);

// Homepage route (accessible to logged-in users only)
router.get('/admin-home', verifyToken, authenticateSession, homepage);


export default router;
