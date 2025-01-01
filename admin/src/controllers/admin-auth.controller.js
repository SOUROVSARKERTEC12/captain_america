import {v4 as uuid} from 'uuid';
import {validateUser} from '../validators/user.validator.js';
import EmailOTPService from '../services/emailOTPServices.js';
import {sequelize} from '../config/database.config.js';
import {Admin} from "../models/Admin.js";
import {TempAdmin} from "../models/tempAdmin.js";
import OTPStore from "../models/OTPStore.js";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import Session from "../models/Session.js";
import RememberedDevice from "../models/RememberDevices.js";
import {Op} from "sequelize";
import speakeasy from 'speakeasy';
import generate2FA from "../services/googleAuthenticatorService.js";


export const register = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        // Validate input using Zod
        const validatedData = validateUser(req.body);

        // Check if email is already registered or pending in TempAdmin table
        const existingUser = await Admin.findOne({
            where: {email: validatedData.email},
            transaction // Ensure the transaction is passed to the query
        });

        if (existingUser) {
            return res.status(400).json({error: 'Email already registered'});
        }

        const tempUser = await TempAdmin.findOne({
            where: {email: validatedData.email},
            transaction // Ensure the transaction is passed to the query
        });

        if (tempUser) {
            return res.status(400).json({error: 'Email already exists in pending verification'});
        }

        // Create a new TempAdmin entry in the database with transaction handling
        const tempUserData = await TempAdmin.create(validatedData, {transaction});

        // Request OTP and send verification email
        const otp = EmailOTPService.generateOTP();
        console.log("EmailOTP", otp);

        // Store OTP in OTPStore table, ensuring the OTP is associated with the TempAdmin
        await OTPStore.create({
            otp,
            tempAdminId: tempUserData.id, // Linking OTP to TempAdmin's ID
            email: tempUserData.email
        }, {transaction});

        // Send OTP via email
        await EmailOTPService.sendOTP(otp, validatedData.email);

        // Commit the transaction after all operations are successful
        await transaction.commit();

        res.status(200).json({message: 'Registration initiated. Please verify your email to complete registration.'});
    } catch (error) {
        // If an error occurs, rollback the transaction to maintain data integrity
        console.error(error);
        await transaction.rollback();
        res.status(500).json({error: 'Error registering user', details: error.message});
    }
};

// Verify OTP using email
export const verifyEmailOTP = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { email, otp } = req.body; // Extract email and OTP from the request body

        // Validate input
        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required' });
        }

        // Find the OTP record for the provided email and OTP
        const otpRecord = await OTPStore.findOne({
            where: {
                otp,
                email,
                createdAt: { [Op.gt]: new Date(Date.now() - 5 * 60 * 1000) }, // Ensure OTP is valid (5-minute window)
            },
        });

        if (!otpRecord) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // Find the associated TempAdmin using the tempUserId
        const tempUser = await TempAdmin.findByPk(otpRecord.tempAdminId);

        if (!tempUser) {
            return res.status(400).json({ error: 'No associated user found for this email' });
        }

        // Generate a new phone OTP
        const phoneOTP = EmailOTPService.generateOTP();
        console.log("PhoneOTP",phoneOTP)

        // Save the phone OTP in OTPStore
        await OTPStore.create({
            otp: phoneOTP,
            tempAdminId: tempUser.id,
            phone: tempUser.phone, // Assuming TempAdmin stores phone number
        }, { transaction });

        // Send phone OTP to user's phone number
        // await PhoneOTPService.sendOTP(phoneOTP, tempUser.phoneNumber);

        // Delete the email OTP record
        await OTPStore.destroy({ where: { otp, email }, transaction });

        // Commit transaction
        await transaction.commit();

        // Respond to client
        res.status(200).json({
            message: 'Email OTP verified successfully. Phone OTP sent to registered phone number.',
            phone: tempUser.phone, // Optional: Return the phone number for confirmation
        });
    } catch (error) {
        // Rollback transaction in case of error
        await transaction.rollback();
        console.error('Error verifying email OTP:', error);
        res.status(500).json({
            error: 'Error verifying email OTP',
            details: error.message,
        });
    }
};

// Verify OTP using phone number and registration
export const verifyPhoneOTP = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { phone, otp } = req.body; // Extract phone number and OTP from the request body

        // Validate input
        if (!phone || !otp) {
            return res.status(400).json({ error: 'Phone number and OTP are required' });
        }

        // Find the OTP record for the provided phone number and OTP
        const otpRecord = await OTPStore.findOne({
            where: {
                otp,
                phone,
                createdAt: { [Op.gt]: new Date(Date.now() - 5 * 60 * 1000) }, // Ensure OTP is valid (5-minute window)
            },
        });

        if (!otpRecord) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // Find the associated TempAdmin using the tempUserId
        const tempUser = await TempAdmin.findByPk(otpRecord.tempAdminId);

        if (!tempUser) {
            return res.status(400).json({ error: 'No associated user found for this phone number' });
        }

        // Hash the password from TempAdmin
        const hashedPassword = await bcrypt.hash(tempUser.password, 10);

        // Create the final Admin
        const newUser = await Admin.create({
            email: tempUser.email,
            password: hashedPassword,
            firstName: tempUser.firstName,
            lastName: tempUser.lastName,
            phone: tempUser.phone,
            role: tempUser.role,
        }, { transaction });

        // Clean up: Delete the OTP and TempAdmin records
        await OTPStore.destroy({ where: { otp, phone }, transaction });
        await TempAdmin.destroy({ where: { id: tempUser.id }, transaction });

        // Commit transaction
        await transaction.commit();

        // Respond to client
        res.status(200).json({
            message: 'Phone OTP verified successfully. Admin registration complete.',
            user: newUser, // Optional: Return new user details
        });
    } catch (error) {
        // Rollback transaction in case of error
        await transaction.rollback();
        console.error('Error verifying phone OTP:', error);
        res.status(500).json({
            error: 'Error verifying phone OTP',
            details: error.message,
        });
    }
};

// Login to OTP or Google authenticator
export const loginFirst = async (req, res) => {
    try {
        const { email, password, auth } = req.body;

        if (!auth || !["google", "email"].includes(auth)) {
            return res.status(400).json({ error: 'Invalid auth type. Use "google" or "email".' });
        }

        if (auth === "email") {
            // Email/Password authentication Flow
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required for email login.' });
            }

            const user = await Admin.findOne({ where: { email } });
            if (!user) {
                return res.status(401).json({ error: 'Invalid email' });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Invalid password' });
            }

            // Generate OTP
            const otp = EmailOTPService.generateOTP();
            console.log("Generating OTP",otp)
            await OTPStore.create({ otp, email, tempUserId: user.id });

            // Send OTP
            await EmailOTPService.sendOTP(otp, email);
            return res.status(200).json({ message: 'OTP sent to your email. Please verify to complete login.' });
        } else if (auth === "google") {
            // Google authenticator Login Flow
            const user = await Admin.findOne({ where: { email } }); // Assuming email is passed
            if (!user) {
                return res.status(401).json({ error: 'Invalid email' });
            }

            // console.log("Email:", user.email);
            // Trigger Google authenticator 2FA setup/verification (if needed)
            const QRCode = generate2FA.g_Author(user.email); // Assume this generates the QR code or returns setup details
            console.log("Login QR:", await QRCode);
            const QR = await QRCode;
            return res.status(200).json({ message: 'Scan the QR code for Google Authenticator setup.', QR });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Error during login', details: error.message });
    }
};

// Login Verification
export const verifyLogin = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { auth, email, otp } = req.body;

        // Validate input
        if (!auth || !email || !otp) {
            return res.status(400).json({ error: 'Auth type, Email, and OTP are required' });
        }

        if (auth !== "google" && auth !== "email") {
            return res.status(400).json({ error: 'Invalid auth method. Use "google" or "email"' });
        }

        // Handle email-based OTP verification
        if (auth === "email") {
            const otpRecord = await OTPStore.findOne({
                where: {
                    email,
                    otp,
                    createdAt: { [Op.gt]: new Date(Date.now() - 5 * 60 * 1000) }, // OTP must be within 5 minutes
                },
            });

            if (!otpRecord) {
                return res.status(400).json({ error: 'Invalid or expired OTP for email authentication' });
            }

            // Remove OTP record after successful verification
            await OTPStore.destroy({
                where: { email, otp },
                transaction,
            });
        }

        // Handle Google Authenticator token verification
        if (auth === "google") {
            const user = await Admin.findOne({ where: { email } });

            if (!user || !user.twoFASecret) {
                return res.status(404).json({ error: 'Admin not found or Google Authenticator not set up' });
            }

            console.log(user.twoFASecret)

            const isTokenValid = speakeasy.totp.verify({
                secret: user.twoFASecret,
                encoding: 'base32',
                token:otp
            });

            console.log(isTokenValid)
            user.isTwoFAEnabled = true;
            const Enabled = user.isTwoFAEnabled
            await Admin.update({isTwoFAEnabled:Enabled}, {where: {email}});

            if (!isTokenValid) {
                return res.status(401).json({ error: 'Invalid Google Authenticator token' });
            }
        }

        // Common logic after successful verification
        const user = await Admin.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        // Generate a session token and JWT
        const sessionId = uuid()
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry
        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Save the session in the database
        await Session.create({
            id: sessionId,
            userId: user.id,
            token,
            expiresAt,
            transaction,
        });

        // Check if deviceId exists in cookies
        let deviceId = req.cookies.deviceId;

        if (!deviceId) {
            deviceId = uuid(); // Generate a new deviceId if not present
            res.cookie('deviceId', deviceId, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 }); // Set cookie for 7 days
        }

        // Remember the device for future logins
        const expirationTime = new Date();
        expirationTime.setDate(expirationTime.getDate() + 7); // Remember for 7 days

        await RememberedDevice.upsert({
            userId: user.id,
            deviceId,
            expirationTime,
            transaction,
        });

        // Commit the transaction
        await transaction.commit();

        // Set the session cookie
        res.set('Set-Cookie', `session=${sessionId}; HttpOnly; Path=/`);

        res.status(200).json({
            message: 'OTP verified successfully. Login complete.',
            token, // Send JWT token
            user: {
                id: user.id,
                email: user.email,
                name: user.name, // Include additional user info as required
            },
        });
    } catch (error) {
        // Rollback the transaction in case of an error
        await transaction.rollback();
        console.error('Error during OTP verification:', error);
        res.status(500).json({
            error: 'Error during OTP verification',
            details: error.message,
        });
    }
};

// Login an admin
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user by email
        const user = await Admin.findOne({ where: { email } });
        // console.log(user)
        if (!user) {
            return res.status(401).json({ error: 'Invalid email' });
        }

        // console.log(user.isTwoFAEnabled)

        const UserID = user.id;
        const UserEmail = user.email;
        // console.log(UserEmail);

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        // console.log(isPasswordValid);

        // Check if 2FA is enabled
        // console.log(user.verified)
        if (!user.verified) {
            if(user.isTwoFAEnabled) {
                return res.status(200).json({ message: '2FA token required' });
            }
        }
        // console.log(user.isTwoFAEnabled)

        // Check if deviceId exists in cookies
        const deviceId = req.cookies.deviceId;
        // console.log("Device ID from cookies:", deviceId);

        if (deviceId) {
            // Check if device is remembered and still valid
            const deviceRemembered = await RememberedDevice.findOne({
                where: {
                    userId: user.id,
                    deviceId,
                    expirationTime: { [Op.gt]: new Date() }, // Ensure token is still valid
                },
            });

            if (deviceRemembered) {
                // Device is remembered; Generate a session and token
                const sessionId = uuid()
                const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry
                const newToken = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

                // Create a new session
                await Session.create({
                    id: sessionId,
                    userId: user.id,
                    token: newToken,
                    expiresAt,
                });

                // Set the session cookie
                res.set('Set-Cookie', `session=${sessionId}; HttpOnly; Path=/`);

                return res.status(200).json({ message: 'Login successful', newToken });
            }
        }

        // If no deviceId or unrecognized device, send OTP
        const otp = EmailOTPService.generateOTP();
        console.log("Generated OTP:", otp);

        // Save OTP in OTPStore with email for verification
        await OTPStore.create({
            otp,
            tempUserId: UserID,
            email: UserEmail,
        });

        // Send OTP to the user's email
        await EmailOTPService.sendOTP(otp, email);

        // Save the device info for future recognition
        if (!deviceId) {
            const newDeviceId = uuid(); // Generate a new deviceId
            const expirationTime = new Date();
            expirationTime.setDate(expirationTime.getDate() + 7); // Expiration set to 7 days

            await RememberedDevice.create({
                userId: user.id,
                deviceId: newDeviceId,
                expirationTime,
            });

            // Set the new deviceId in cookies
            res.cookie('deviceId', newDeviceId, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days
        }

        res.status(200).json({
            message: 'OTP sent to your email. Please verify to complete login.',
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({
            error: 'Error during login',
            details: error.message,
        });
    }
};

// Logout an admin
export const logout = async (req, res) => {
    try {
        // Extract the token from the Authorization header
        const authHeader = req.headers['authorization'];
        const token = authHeader?.split(' ')[1]; // Extract token after "Bearer "
        // const token = verifyToken(token)
        const sessionId = req.cookies?.session;

        if (!token && !sessionId) {
            return res.status(400).json({ error: 'No session or token found to logout.' });
        }

        // console.log('Token:', token);
        const databaseToken =await Session.findOne({where: {token:token}})
        if(!databaseToken) {
            console.error('No matching session found for token:', token);
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        // console.log(databaseToken.token)

        // Destroy the session by token
        if (token && databaseToken.token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                if (err) {
                    console.error('Invalid token:', err.message);
                    return null;
                }
                console.log("Decoded Token:", decoded);
                return decoded;
            });


            if (decoded) {
                if(decoded.id === databaseToken.userId){
                    await Session.destroy({ where: { token } });
                }
                // console.log(`Session for token ${token} destroyed.`);
            }
        }

        // Destroy the session by session ID (if provided)
        if (sessionId) {
            await Session.destroy({ where: { id: sessionId } });
            console.log(`Session with ID ${sessionId} destroyed.`);
        }

        // Clear cookies
        res.clearCookie('session', { httpOnly: true, secure: true, sameSite: 'Strict' });

        // Optionally set cookies to expire immediately
        res.set('Set-Cookie', [
            'session=; Path=/; HttpOnly; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        ]);

        return res.status(200).json({ message: 'Logged out successfully.' });
    } catch (error) {
        console.error('Error during logout:', error);
        return res.status(500).json({
            error: 'Error during logout',
            details: error.message,
        });
    }
};

// Homepage route
export const homepage = async (req, res) => {
    try {
        const sessionId = req.cookies.session;

        // Check if session exists
        const session = await Session.findOne({where: {id: sessionId}});
        // console.log(session);
        if (!session) {
            return res.status(403).json({message: 'Unauthorized. Please log in.'});
        }

        // Check if the user is visiting for the first time
        const user = await Admin.findByPk(session.userId);
        if (user.firstVisit) {
            user.firstVisit = false;
            await user.save();
            res.json({message: `Welcome, ${user.username}. You are visiting for the first time.`});
        } else {
            res.json({message: `Welcome back, ${user.username}.`});
        }
    } catch (error) {
        res.status(500).json({error: 'Error accessing home page', details: error.message});
    }
};
