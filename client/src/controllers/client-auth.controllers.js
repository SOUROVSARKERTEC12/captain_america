import {v4 as uuid} from 'uuid';
import {validateUser} from '../validators/user.validator.js';
import EmailOTPService from '../services/emailOTPServices.js';
import sequelize from '../config/database.config.js';
import {User} from "../models/User.js";
import {TempUser} from "../models/tempUser.js";
import OTPStore from "../models/OTPStore.js";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import Session from "../models/Session.js";
import RememberedDevice from "../models/RememberDevices.js";
import {Op} from "sequelize";
import speakeasy from 'speakeasy';
import generate2FA from "../services/googleAuthenticatorService.js";
import cloudinary from "../config/cloudinary.config.js";
import {Pages} from "../models/page/pages.js";
import {UserFieldVerification} from "../models/UserFieldVerification.js";
import tempStakeholder from "../models/tempStakeholder.js";
import { CustomError } from '../utils/customError.js';
import { HttpStatusCode } from '../utils/httpStatusCode.js';


// register for client  information
export const register = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        // Validate input using Zod
        const validatedData = validateUser(req.body);

        // Check if email is already registered
        const existingUser = await User.findOne({
            where: {email: validatedData.email},
            transaction,
        });

        if (existingUser) {
            throw new CustomError("Email already registered", HttpStatusCode.BAD_REQUEST);
        }

        // Check if there is a pending TempUser record for the email
        const tempUser = await TempUser.findOne({
            where: {email: validatedData.email},
            transaction,
        });

        if (tempUser) {
            await TempUser.destroy({where: {email: tempUser.email}, transaction});
        }

        if (req.files && req.files.nidFront && req.files.nidBack) {
            // Extract image paths from the uploaded files
            const nidFrontPath = req.files.nidFront[0].path;
            const nidBackPath = req.files.nidBack[0].path;

            // Upload images to Cloudinary
            const [nidFrontResult, nidBackResult] = await Promise.all([
                cloudinary.uploader.upload(nidFrontPath, {folder: 'information'}),
                cloudinary.uploader.upload(nidBackPath, {folder: 'information'}),
            ]);

            validatedData.nidFront = nidFrontResult.secure_url;
            validatedData.nidBack = nidBackResult.secure_url;
        }

        // Create a new TempUser entry in the database
        const tempUserData = await TempUser.create(validatedData, {transaction});

        // Prepare verification fields for the new TempUser
        const verificationFields = [
            "email", "firstName", "lastName", "nidFront", "nidBack", "phone", "role",
        ];
        const tempUserFieldVerificationData = verificationFields.map((field) => ({
            tempUserId: tempUserData.id,
            fields: field,
            value: validatedData[field] || null,
            status: 'pending',
        }));

        await UserFieldVerification.bulkCreate(tempUserFieldVerificationData, {transaction});

        // Generate OTP and send email
        const otp = EmailOTPService.generateOTP();
        await OTPStore.create(
            {otp, tempUserId: tempUserData.id, email: tempUserData.email},
            {transaction}
        );
        await EmailOTPService.sendOTP(otp, validatedData.email);

        // Commit the transaction
        await transaction.commit();

        res.status(HttpStatusCode.OK).json({
            message: "Registration initiated. Please verify your email to complete registration.",
        });
    } catch (error) {
        await transaction.rollback();

        // Use CustomError to handle known errors gracefully
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({message: error.message});
        }

        console.error("Error in registration:", error);
        next(error); // Pass unexpected errors to the global error handler
    }
};

// update the client information
export const updateClientInfo = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { userId } = req.params;
        const validatedClientData = req.body; // Assuming input is already validated

        // Find the client by userId
        const client = await TempUser.findByPk(userId);

        if (!client) {
            throw new CustomError('Client not found.', HttpStatusCode.NOT_FOUND); // Use CustomError with a 404
        }

        // Update the client information
        await client.update(validatedClientData, { transaction });

        // Update the user field verification table
        const updateFields = Object.keys(validatedClientData);
        for (const field of updateFields) {
            await UserFieldVerification.update(
                {
                    value: validatedClientData[field],
                    status: 'pending',
                    updatedAt: new Date(),
                },
                {
                    where: {
                        tempUserId: client.id,
                        fields: field,
                    },
                    transaction,
                }
            );
        }

        // Update stakeholder information who is matching with user information
        const stakeholders = await tempStakeholder.findAll({
            where: { email: client.email }, // Matching stakeholders with the user's email
            transaction,
        });

        for (const stakeholder of stakeholders) {
            await stakeholder.update(validatedClientData, { transaction });
        }

        // Commit the transaction
        await transaction.commit();

        // Respond with updated client data
        return res.status(HttpStatusCode.OK).json({
            message: 'Client information updated successfully.',
            data: client,
        });
    } catch (error) {
        // Rollback the transaction in case of error
        await transaction.rollback();

        // Use the global error handler by passing the error to next()
        next(error);
    }
};

// Verify OTP using email
export const verifyEmailOTP = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const { email, otp } = req.body; // Extract email and OTP from the request body

        // Validate input
        if (!email || !otp) {
            throw new CustomError('Email and OTP are required', 400);
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
            throw new CustomError('Invalid or expired OTP', 400);
        }

        // Find the associated TempUser using the tempUserId
        const tempUser = await TempUser.findByPk(otpRecord.tempUserId);

        if (!tempUser) {
            throw new CustomError('No associated user found for this email', 400);
        }

        // Generate a new phone OTP
        const phoneOTP = EmailOTPService.generateOTP();
        console.log("PhoneOTP", phoneOTP);

        // Save the phone OTP in OTPStore
        await OTPStore.create({
            otp: phoneOTP,
            tempUserId: tempUser.id,
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
            phoneNumber: tempUser.phoneNumber, // Optional: Return the phone number for confirmation
        });

    } catch (error) {
        // If response was already sent, do not send it again
        if (!res.headersSent) {
            // Rollback transaction and call global error handler if response wasn't already sent
            await transaction.rollback();
            next(error);
        } else {
            // In case headers are already sent, log the error to the console
            console.error('Error after response sent:', error);
        }
    }
};

// Resend the email OTP
export const resendEmailOTP = async (req, res, next) => {
    try {
        const { email } = req.body;

        // Validate input
        if (!email) {
            throw new CustomError('Email is required', 400);
        }

        // Find the OTP record for the email
        let otpRecord = await OTPStore.findOne({
            where: { email },
        });

        if (!otpRecord) {
            throw new CustomError('No OTP record found for this email', 404);
        }

        // Check if the resend limit is reached
        if (otpRecord.resendCount >= 3) {
            throw new CustomError('Resend limit reached. Invalid email.', 400);
        }

        // Increment the resend count
        otpRecord.resendCount += 1;

        // Generate a new OTP
        const newOTP = EmailOTPService.generateOTP();
        console.log('New Email OTP:', newOTP);

        // Update the OTP record with the new OTP and save it
        otpRecord.otp = newOTP;
        otpRecord.createdAt = new Date(); // Reset the creation time
        await otpRecord.save();

        // Resend the OTP to the user's email
        await EmailOTPService.sendOTP(newOTP, email);

        res.status(200).json({
            message: 'OTP resent successfully.',
            resendCount: otpRecord.resendCount,
        });
    } catch (error) {
        // The global error handler will now handle the error
        next(error);
    }
};

// Verify OTP using phone number and registration
export const verifyPhoneOTP = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const { phone, otp } = req.body; // Extract phone number and OTP from the request body

        // Validate input
        if (!phone || !otp) {
            throw new CustomError('Phone number and OTP are required', 400);
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
            throw new CustomError('Invalid or expired OTP', 400);
        }

        // Find the associated TempUser using the tempUserId
        const tempUser = await TempUser.findByPk(otpRecord.tempUserId, { transaction });

        if (!tempUser) {
            throw new CustomError('No associated user found for this phone number', 400);
        }

        // Hash the password from TempUser
        const hashedPassword = await bcrypt.hash(tempUser.password, 10);

        // Update the TempUser record with the hashed password and verified=true
        const updatedUser = await TempUser.update(
            {
                password: hashedPassword,
                verified: true,
            },
            {
                where: { id: tempUser.id },
                transaction,
            }
        );

        // Create a new page entry for the user
        await Pages.create(
            {
                tempUserId: tempUser.id,
                page1: true,
            },
            { transaction }
        );

        // Clean up: Delete the OTP record
        await OTPStore.destroy({ where: { otp, phone }, transaction });

        const user = await TempUser.findOne({ where: { phone } });

        if (!user) {
            throw new CustomError('User not found', 404);
        }

        // Generate a session token and JWT
        const sessionId = uuid();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry
        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        // Save the session in the database
        await Session.create({
            id: sessionId,
            tempUserId: user.id,
            token,
            expiresAt,
        }, { transaction });

        // Commit transaction
        await transaction.commit();

        // Set the session cookie
        res.set('Set-Cookie', `session=${sessionId}; HttpOnly; Path=/`);

        // Respond to client
        res.status(200).json({
            message: 'Phone OTP verified successfully. Please complete your organization information for Admin approval.',
            user: tempUser.id,
            token,
        });
    } catch (error) {
        // The global error handler will catch and respond accordingly
        next(error);
    }
};

// Resend the phone OTP
export const resendPhoneOTP = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const { phone } = req.body;

        // Validate input
        if (!phone) {
            throw new CustomError('Phone number is required.', 400);
        }

        // Find the OTP record for the phone number
        let otpRecord = await OTPStore.findOne({
            where: { phone },
        });

        if (!otpRecord) {
            throw new CustomError('No OTP record found for this phone number.', 404);
        }

        // Check if the resend limit is reached
        if (otpRecord.resendCount >= 3) {
            throw new CustomError('Resend limit reached. Invalid phone number.', 400);
        }

        // Increment the resend count
        otpRecord.resendCount += 1;

        // Generate a new OTP
        const newOTP = EmailOTPService.generateOTP();
        console.log('New Phone OTP:', newOTP);

        // Update the OTP record with the new OTP and reset the createdAt timestamp
        otpRecord.otp = newOTP;
        otpRecord.createdAt = new Date(); // Reset the creation time
        await otpRecord.save({ transaction });

        // Resend the OTP to the user's phone
        // await PhoneOTPService.sendOTP(newOTP, phone);

        // Commit the transaction
        await transaction.commit();

        res.status(200).json({
            message: 'Phone OTP resent successfully.',
            resendCount: otpRecord.resendCount,
        });
    } catch (error) {
        // Pass the error to the global error handler
        next(error);
    }
};

// Login to OTP or Google Authenticator
export const loginFirst = async (req, res, next) => {
    try {
        const { email, password, Auth } = req.body;

        if (!Auth || !["google", "email"].includes(Auth)) {
            throw new CustomError('Invalid Auth type. Use "google" or "email".', HttpStatusCode.BAD_REQUEST);
        }

        if (Auth === "email") {
            // Email/Password Authentication Flow
            if (!email || !password) {
                throw new CustomError('Email and password are required for email login.', HttpStatusCode.BAD_REQUEST);
            }

            const user = await TempUser.findOne({ where: { email } });
            if (!user) {
                throw new CustomError('Invalid email', HttpStatusCode.NOT_FOUND);
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new CustomError('Invalid password', HttpStatusCode.FORBIDDEN);
            }

            // Generate OTP
            const otp = EmailOTPService.generateOTP();
            console.log("loginOTPService", otp);
            await OTPStore.create({ otp, email, tempUserId: user.id });

            // Send OTP
            await EmailOTPService.sendOTP(otp, email);
            return res.status(HttpStatusCode.OK).json({ message: 'OTP sent to your email. Please verify to complete login.' });
        } else if (Auth === "google") {
            // Google Authenticator Login Flow
            const user = await TempUser.findOne({ where: { email } });
            if (!user) {
                throw new CustomError('Invalid email', HttpStatusCode.NOT_FOUND);
            }

            // Trigger Google Authenticator 2FA setup/verification (if needed)
            const QRCode = generate2FA.g_Author(user.email); // Assume this generates the QR code or returns setup details
            console.log("Login QR:", await QRCode);
            const QR = await QRCode;
            return res.status(HttpStatusCode.OK).json({ message: 'Scan the QR code for Google Authenticator setup.', QR });
        }
    } catch (error) {
        console.error('Error during login:', error);
        next(error); // Pass the error to the global error handler
    }
};

// Login Verification
export const verifyLogin = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const { auth, email, otp } = req.body;

        // Validate input
        if (!auth || !email || !otp) {
            throw new CustomError('Auth type, Email, and OTP are required', HttpStatusCode.BAD_REQUEST);
        }

        if (auth !== "google" && auth !== "email") {
            throw new CustomError('Invalid auth method. Use "google" or "email"', HttpStatusCode.BAD_REQUEST);
        }

        // Handle email-based OTP verification
        if (auth === "email") {
            const user = await TempUser.findOne({ where: { email } });

            const otpRecord = await OTPStore.findOne({
                where: {
                    email,
                    otp,
                    createdAt: { [Op.gt]: new Date(Date.now() - 5 * 60 * 1000) }, // OTP must be within 5 minutes
                },
            });

            if (!otpRecord) {
                throw new CustomError('Invalid or expired OTP for email authentication', HttpStatusCode.FORBIDDEN);
            }

            // Remove OTP record after successful verification
            await OTPStore.destroy({
                where: { email, otp },
                transaction,
            });
            user.isTwoFAEnabled = true;
            await User.update({ isTwoFAEnabled: user.isTwoFAEnabled }, { where: { email } });
        }

        // Handle Google Authenticator token verification
        if (auth === "google") {
            const user = await TempUser.findOne({ where: { email } });

            if (!user || !user.twoFASecret) {
                throw new CustomError('Admin not found or Google Authenticator not set up', HttpStatusCode.FORBIDDEN);
            }

            const isTokenValid = speakeasy.totp.verify({
                secret: user.twoFASecret,
                encoding: 'base32',
                token: otp
            });

            if (!isTokenValid) {
                throw new CustomError('Invalid Google Authenticator token', HttpStatusCode.FORBIDDEN);
            }

            user.isTwoFAEnabled = true;
            await User.update({ isTwoFAEnabled: user.isTwoFAEnabled }, { where: { email } });
        }

        const user = await TempUser.findOne({ where: { email } });

        if (!user) {
            throw new CustomError('User not found', HttpStatusCode.NOT_FOUND);
        }

        // Generate a session token and JWT
        const sessionId = uuid();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry
        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Save the session in the database
        await Session.create({
            id: sessionId,
            tempUserId: user.id,
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

        // Remember the incomplete page
        const incomplete = await Pages.findOne({ where: { tempUserId: user.id } });
        let incompletePage = null;

        if (incomplete) {
            const incompleteData = incomplete.dataValues;
            for (const key in incompleteData) {
                if (typeof incompleteData[key] === 'boolean' && !incompleteData[key]) {
                    incompletePage = key; // Store the first incomplete page
                    break; // Stop checking after finding the first incomplete page
                }
            }
        }

        // Commit the transaction
        await transaction.commit();

        // Set the session cookie
        res.set('Set-Cookie', `session=${sessionId}; HttpOnly; Path=/`);

        return res.status(HttpStatusCode.OK).json({
            message: 'OTP verified successfully. Login complete.',
            token, // Send JWT token
            user: {
                id: user.id,
                email: user.email,
                name: user.name, // Include additional user info as required
            },
            incompletePage
        });
    } catch (error) {
        // Rollback the transaction in case of an error
        await transaction.rollback();
        console.error('Error during OTP verification:', error);
        next(error); // Pass the error to the global error handler
    }
};

// Login a client
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            throw new CustomError('Email and password are required', HttpStatusCode.BAD_REQUEST);
        }

        // Find user by email
        const user = await TempUser.findOne({ where: { email } });
        if (!user) {
            throw new CustomError('Invalid email', HttpStatusCode.NOT_FOUND);
        }

        const UserID = user.id;
        const UserEmail = user.email;

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new CustomError('Invalid password', HttpStatusCode.FORBIDDEN);
        }

        // Check if 2FA is enabled and user is verified
        if (!user.verified) {
            if (user.isTwoFAEnabled) {
                return res.status(HttpStatusCode.OK).json({ message: '2FA token required' });
            }
        }

        // Check if deviceId exists in cookies
        const deviceId = req.cookies.deviceId;

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
                const sessionId = uuid();
                const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry
                const newToken = jwt.sign({
                    userId: user.id,
                    email: user.email
                }, process.env.JWT_SECRET, { expiresIn: '1h' });

                // Create a new session
                await Session.create({
                    id: sessionId,
                    tempUserId: user.id,
                    token: newToken,
                    expiresAt,
                });

                // Set the session cookie
                res.set('Set-Cookie', `session=${sessionId}; HttpOnly; Path=/`);

                return res.status(HttpStatusCode.OK).json({ message: 'Login successful', newToken });
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

        res.status(HttpStatusCode.OK).json({
            message: 'OTP sent to your email. Please verify to complete login.',
        });
    } catch (error) {
        // Pass the error to the global error handler
        console.error('Error during login:', error);
        next(error); // Trigger global error handler
    }
};

// Logout a client
export const logout = async (req, res, next) => {
    try {
        // Extract the token from the Authorization header
        const authHeader = req.headers['authorization'];
        const token = authHeader?.split(' ')[1]; // Extract token after "Bearer "
        const sessionId = req.cookies?.session;

        if (!token && !sessionId) {
            throw new CustomError('No session or token found to logout.', HttpStatusCode.BAD_REQUEST);
        }

        // Check if the session exists in the database
        const databaseToken = await Session.findOne({ where: { token } });
        if (!databaseToken) {
            throw new CustomError('Invalid or expired token', HttpStatusCode.FORBIDDEN);
        }

        if (databaseToken.logoutAt) {
            throw new CustomError('You already logged out using this token', HttpStatusCode.BAD_REQUEST);
        }

        // Update the session with logout timestamp
        await Session.update(
            {
                logoutAt: new Date(Date.now()), // Set logout time
            },
            {
                where: { token },
            }
        );

        // Optionally verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                throw new CustomError('Invalid token', HttpStatusCode.FORBIDDEN);
            }
            return decoded;
        });

        // Clear the session cookie
        res.clearCookie('session', { httpOnly: true, secure: true, sameSite: 'Strict' });

        // Set cookies to expire immediately
        res.set('Set-Cookie', [
            'session=; Path=/; HttpOnly; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        ]);

        return res.status(HttpStatusCode.OK).json({ message: 'Logged out successfully.' });
    } catch (error) {
        next(error); // Trigger global error handler
    }
};

// forget password using email verification
export const forgetPassword = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { email } = req.body;

        // Validate input
        if (!email) {
            throw new CustomError('Email is required', HttpStatusCode.BAD_REQUEST);
        }

        // Check if the user exists
        const user = await TempUser.findOne({ where: { email } });
        if (!user) {
            throw new CustomError('User not found.', HttpStatusCode.NOT_FOUND);
        }

        // Generate OTP for password reset
        const otp = EmailOTPService.generateOTP();
        console.log('OTP Forget Password:', otp);

        // Store the OTP in the OTP store with an expiry time of 15 minutes
        await OTPStore.create(
            {
                otp,
                email,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000), // OTP expires in 15 minutes
            },
            { transaction }
        );

        // Send OTP to the user's email
        await EmailOTPService.sendOTP(otp, email);

        // Commit the transaction
        await transaction.commit();

        res.status(HttpStatusCode.OK).json({
            message: 'OTP sent successfully. Please check your email to reset your password.',
        });
    } catch (error) {
        // Rollback the transaction in case of error
        await transaction.rollback();

        console.error('Error in forgetPassword:', error);
        next(error); // Pass the error to the global error handler
    }
};

export const createNewPassword = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { email, otp, newPassword, confirmNewPassword } = req.body;

        // Validate input
        if (!email || !otp || !newPassword || !confirmNewPassword) {
            throw new CustomError('All fields are required (email, otp, newPassword, confirmNewPassword).', HttpStatusCode.BAD_REQUEST);
        }
        if (newPassword !== confirmNewPassword) {
            throw new CustomError('New password and confirmNewPassword do not match.', HttpStatusCode.BAD_REQUEST);
        }

        // Check if the OTP exists and is valid (within a 5-minute window)
        const otpRecord = await OTPStore.findOne({
            where: {
                otp,
                email,
                createdAt: { [Op.gt]: new Date(Date.now() - 5 * 60 * 1000) }, // OTP must be within 5 minutes
            },
        });

        if (!otpRecord) {
            throw new CustomError('Invalid or expired OTP', HttpStatusCode.BAD_REQUEST);
        }

        // Find the user
        const user = await TempUser.findOne({ where: { email } });
        if (!user) {
            throw new CustomError('User not found.', HttpStatusCode.NOT_FOUND);
        }

        // Hash the new password before saving it
        const hashedPassword = await bcrypt.hash(newPassword, 10); // Hash with 10 rounds of salt
        await user.update({ password: hashedPassword }, { transaction });

        // Remove the OTP record to prevent reuse
        await otpRecord.destroy({ transaction });

        // Commit the transaction
        await transaction.commit();

        res.status(HttpStatusCode.OK).json({ message: 'Password updated successfully. You can now log in with your new password.' });
    } catch (error) {
        // Rollback the transaction in case of error
        await transaction.rollback();
        console.error('Error in createNewPassword:', error);
        next(error);
    }
};

// Homepage route
export const homepage = async (req, res, next) => {
    try {
        const sessionId = req.cookies.session;

        // Check if session exists
        const session = await Session.findOne({where: {id: sessionId}});
        // console.log(session);
        if (!session) {
            return res.status(403).json({message: 'Unauthorized. Please log in.'});
        }

        // Check if the user is visiting for the first time
        const user = await User.findByPk(session.userId);
        if (user.firstVisit) {
            user.firstVisit = false;
            await user.save();
            res.json({message: `Welcome, ${user.username}. You are visiting for the first time.`});
        } else {
            res.json({message: `Welcome back, ${user.username}.`});
        }
    } catch (error) {
        next(error);
        res.status(500).json({error: 'Error accessing home page', details: error.message});
    }
};
