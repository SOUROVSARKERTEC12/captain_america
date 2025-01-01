import { z } from 'zod';

export const stkholderValidationSchema = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters long') // Username must be at least 3 characters
        .max(50, 'Username cannot exceed 50 characters'), // Username max length

    email: z
        .string()
        .email('Email must be a valid email address') // Email should be in a valid format
        .min(5, 'Email must be at least 5 characters long') // Minimum length for email
        .max(255, 'Email cannot exceed 255 characters'), // Maximum length for email
    firstName: z
        .string()
        .min(1, 'First Name is required') // Ensuring first name is provided
        .max(100, 'First Name cannot exceed 100 characters'), // First name length limit

    lastName: z
        .string()
        .min(1, 'Last Name is required') // Ensuring last name is provided
        .max(100, 'Last Name cannot exceed 100 characters'), // Last name length limit
    phone: z
        .string()
        .regex(
            /^\+?(\d{1,4})?([ .\-]?)?(\(?\d{1,3}\)?)[ .\-]?(\d{1,4})[ .\-]?(\d{1,4})[ .\-]?(\d{1,4})$/,
            'Phone Number must be in a valid format'
        ), // Validating phone number with international format
    nidFront: z
        .string()
        .optional(),
    nidBack: z
        .string()
        .optional(),
    verifyStatus: z
        .enum(['pending', 'verified', 'rejected']) // Verification status options
        .default('pending') // Default value is 'pending'
});

// Function to validate the stakeholder data
export const validateStkholder = (data) => {
    try {
        return stkholderValidationSchema.parse(data); // Validate data
    } catch (error) {
        // Handle errors and return formatted error messages
        throw new Error(
            JSON.stringify(
                error.errors.map((err) => ({
                    field: err.path[0],
                    message: err.message,
                }))
            )
        );
    }
};
