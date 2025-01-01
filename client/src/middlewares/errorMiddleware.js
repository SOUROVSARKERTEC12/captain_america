import { CustomError } from '../utils/customError.js';
import { HttpStatusCode } from '../utils/httpStatusCode.js';

export const errorHandler = (err, req, res, next) => {
    if (err instanceof CustomError) {
        return res.status(err.statusCode).json({
            message: err.message,
            details: err.details || 'No additional details available',
        });
    }

    // Log unexpected errors with stack trace for debugging
    console.error(err.stack || err);

    // Fallback for any unexpected errors
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        message: 'Something went wrong. Please try again later.',
        details: err.message || 'An unexpected error occurred.',
    });
};
