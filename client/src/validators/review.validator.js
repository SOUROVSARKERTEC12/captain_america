import { z } from 'zod';

export const reviewValidationSchema = z.object({
    stkholder1Id: z
        .number()
        .int('Stakeholder 1 ID must be an integer') // Ensure it's an integer
        .positive('Stakeholder 1 ID must be a positive number') // Ensure it's a positive number
        .min(1, 'Stakeholder 1 ID is required'), // Stakeholder 1 ID is required

    stkholder2Id: z
        .number()
        .int('Stakeholder 2 ID must be an integer')
        .positive('Stakeholder 2 ID must be a positive number')
        .optional(), // Optional field

    stkholder3Id: z
        .number()
        .int('Stakeholder 3 ID must be an integer')
        .positive('Stakeholder 3 ID must be a positive number')
        .optional(), // Optional field

    stkholder4Id: z
        .number()
        .int('Stakeholder 4 ID must be an integer')
        .positive('Stakeholder 4 ID must be a positive number')
        .optional(), // Optional field

    stkholder5Id: z
        .number()
        .int('Stakeholder 5 ID must be an integer')
        .positive('Stakeholder 5 ID must be a positive number')
        .optional(), // Optional field

    stkholder6Id: z
        .number()
        .int('Stakeholder 6 ID must be an integer')
        .positive('Stakeholder 6 ID must be a positive number')
        .optional(), // Optional field

    orgName: z
        .string()
        .min(1, 'Organization Name is required') // Ensure organization name is provided
        .max(255, 'Organization Name cannot exceed 255 characters'), // Limit organization name length

    orgAddress: z
        .string()
        .min(1, 'Organization Address is required') // Ensure organization address is provided
        .max(255, 'Organization Address cannot exceed 255 characters'), // Limit address length

    orgCity: z
        .string()
        .min(1, 'Organization City is required') // Ensure city is provided
        .max(100, 'Organization City cannot exceed 100 characters'), // Limit city name length

    orgCountry: z
        .string()
        .min(1, 'Organization Country is required') // Ensure country is provided
        .max(100, 'Organization Country cannot exceed 100 characters'), // Limit country name length

    orgTIN: z
        .string()
        .min(1, 'Organization TIN is required')
        .max(50, 'Organization TIN cannot exceed 50 characters') // Limit TIN length
        .optional(), // Optional field

    orgIndustry: z
        .string()
        .max(100, 'Organization Industry cannot exceed 100 characters') // Limit industry length
        .optional(), // Optional field

    orgEST: z
        .number()
        .int('Organization Establishment Year must be a valid year')
        .min(1900, 'Organization Establishment Year must be valid')
        .max(new Date().getFullYear(), 'Organization Establishment Year cannot be in the future')
        .optional(), // Optional field

    orgEmrgC1Id: z
        .number()
        .int('Emergency Contact 1 ID must be an integer')
        .positive('Emergency Contact 1 ID must be a positive number')
        .optional(), // Optional field

    orgEmrgC2Id: z
        .number()
        .int('Emergency Contact 2 ID must be an integer')
        .positive('Emergency Contact 2 ID must be a positive number')
        .optional(), // Optional field

    orgEmrgC3Id: z
        .number()
        .int('Emergency Contact 3 ID must be an integer')
        .positive('Emergency Contact 3 ID must be a positive number')
        .optional(), // Optional field
});

export const validateReview = (data) => {
    try {
        return reviewValidationSchema.parse(data); // Validate data
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
