import jwt from 'jsonwebtoken';
import Session from "../models/Session.js";
import {CustomError} from '../utils/customError.js';
import {HttpStatusCode} from '../utils/httpStatusCode.js';

export const verifyToken = async (req, res, next) => {
    try {
        // Extract the token from the 'Authorization' header
        const authHeader = req.headers['authorization'];

        // Ensure Authorization header exists and follows the 'Bearer <token>' format
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new CustomError('Authorization header is required and should start with Bearer', HttpStatusCode.FORBIDDEN);
        }

        // Extract the token from the header
        const token = authHeader.split(' ')[1];

        // Check if the token exists in the Session database
        const session = await Session.findOne({where: {token}});
        if (!session) {
            throw new CustomError('Invalid or expired token', HttpStatusCode.FORBIDDEN);
        }

        // Verify the token using the secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user information to the request object for use in subsequent middlewares or routes
        req.user = {
            id: decoded.id,      // Example: user ID from the token payload
            email: decoded.email // Example: email from the token payload
        };

        next(); // Token is valid, proceed to the next middleware/route handler
    } catch (error) {
        // Pass the error to the global error handler
        next(error);
    }
};
