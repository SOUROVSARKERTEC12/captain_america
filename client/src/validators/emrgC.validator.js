import { z } from 'zod';

export const orgEmrgContactValidationSchema = z.object({
    orgId:z
        .string()
        .min(5,"orgId must be a string")
        .max(50,"orgId must be a string"),
    username: z
        .string()
        .min(1, 'Username is required') // Ensure username is provided
        .max(255, 'Username cannot exceed 255 characters'), // Limit username length

    phone: z
        .string()
        .min(1, 'Phone number is required') // Ensure phone number is provided
        .regex(
            /^\+?(\d{1,4})?([ .\-]?)?(\(?\d{1,3}\)?)[ .\-]?(\d{1,4})[ .\-]?(\d{1,4})[ .\-]?(\d{1,4})$/,
            'Phone number must be in a valid format' // Phone number validation regex
        ),

    whatsapp: z
        .string()
        .regex(
            /^\+?(\d{1,4})?([ .\-]?)?(\(?\d{1,3}\)?)[ .\-]?(\d{1,4})[ .\-]?(\d{1,4})[ .\-]?(\d{1,4})$/,
            'WhatsApp number must be in a valid format'
        )
        .optional(), // WhatsApp number is optional

    status: z
        .enum(['pending', 'verified', 'rejected'])
        .default('pending') // Default verification status is 'pending'
});

export const validateOrgEmrgContact = (data) => {
    try {
        return orgEmrgContactValidationSchema.parse(data); // Validate data
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
