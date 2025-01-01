import { z } from 'zod';

export const userValidationSchema = z.object({
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters long')
        .max(100, 'Password cannot exceed 100 characters'), // Password length restriction
    email: z
        .string()
        .email('Email must be a valid email address')
        .min(5, 'Email must be at least 5 characters long') // Enforcing minimum length for email
        .max(255, 'Email cannot exceed 255 characters'), // Maximum length for email
    firstName: z
        .string()
        .min(1, 'First Name is required')
        .max(100, 'First Name cannot exceed 100 characters'), // Limiting first name length
    lastName: z
        .string()
        .min(1, 'Last Name is required')
        .max(100, 'Last Name cannot exceed 100 characters'), // Limiting last name length
    phone: z
        .string()
        .regex(
            /^\+?(\d{1,4})?([ .\-]?)?(\(?\d{1,3}\)?)[ .\-]?(\d{1,4})[ .\-]?(\d{1,4})[ .\-]?(\d{1,4})$/,
            'Phone Number must be in a valid format'
        ),
    verified: z.boolean().default(false),
   role: z.enum(['user', 'admin', 'superadmin']).default('user'), // Added 'superadmin' to roles
    nidFront: z
        .string()
        .optional(),
    nidBack: z
        .string()
        .optional()
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
