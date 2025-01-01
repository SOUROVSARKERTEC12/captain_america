import { z } from 'zod';

export const userValidationSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    email: z
        .string()
        .email('Email must be a valid email address'),
    firstName: z
        .string()
        .min(1, 'First Name is required'), // Ensures first name is provided
    lastName: z
        .string()
        .min(1, 'Last Name is required'), // Ensures last name is provided
    phone: z
        .string()
        .regex(
            /^\+?(\d{1,4})?([ .\-]?)?(\(?\d{1,3}\)?)[ .\-]?(\d{1,4})[ .\-]?(\d{1,4})[ .\-]?(\d{1,4})$/,
            'Phone Number must be in a valid format'
        ), // Validates phone number with international formats
    verified: z.boolean().default(false), // Default value is false for new users
    twoFASecret: z
        .string()
        .nullable()
        .default(null),
    isTwoFAEnabled: z.boolean().default(false), // Default value is false for new users
    firstVisit: z.boolean().default(true), // Default value is true for new users
    role: z.enum(['user', 'admin']).default('user'), // Ensures the user has a role (default is 'user')
});

export const validateUser = (data) => {
    try {
        return userValidationSchema.parse(data);
    } catch (error) {
        // Return validation errors as an array
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
