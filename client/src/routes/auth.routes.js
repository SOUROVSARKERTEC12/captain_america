import express from 'express';
import {
    register,
    verifyEmailOTP,
    resendEmailOTP,
    verifyPhoneOTP,
    resendPhoneOTP,
    loginFirst,
    verifyLogin,
    login,
    logout,
    homepage,
    updateClientInfo,
    forgetPassword,
    createNewPassword,
} from '../controllers/index.js';
import upload from '../config/multer.config.js';
import {verifyToken} from "../middlewares/token.middleware.js";
import {authenticateSession} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Register a new user
router.post('/register',upload.fields([
    { name: 'nidFront', maxCount: 1 },
    { name: 'nidBack', maxCount: 1 }
]), register);

// update the client information
router.patch('/update-client/:userId', verifyToken,updateClientInfo);

// Verify email OTP for registration
router.post('/verify-email-otp', verifyEmailOTP);

// Email OTP resend
router.post('/verify-email-otp-resend', resendEmailOTP)

// Verify phone number OTP for registration
router.post('/verify-phone-otp', verifyPhoneOTP);

// Phone OTP resend
router.post('/verify-phone-otp-resend', resendPhoneOTP)

// Login a user
router.post('/login-first', loginFirst);

// Verify OTP for login
router.post('/verify-login', verifyLogin);

// Admin Login
router.post('/login', login);

// Logout the user
router.post('/logout', logout);

// change password
router.post('/forget-password', forgetPassword);
router.post('/create-new-password', createNewPassword);

// Homepage route (accessible to logged-in users only)
router.get('/home', verifyToken, authenticateSession, homepage);


export default router;
