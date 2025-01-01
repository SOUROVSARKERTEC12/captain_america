/*
import { CustomError } from '../utils/customError';

export const errorHandler = (err, req, res, next) => {
    if (err instanceof CustomError) {
        return res.status(err.statusCode).json({
            message: err.message,
            details: err.details,
        });
    }

    // Fallback for any unexpected errors
    console.error(err);
    return res.status(500).json({
        message: 'Something went wrong. Please try again later.',
        details: err.message,
    });
};
*/
