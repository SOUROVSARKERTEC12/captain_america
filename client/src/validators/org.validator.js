import { z } from 'zod';

export const orgValidationSchema = z.object({
    orgName: z
        .string()
        .min(1, 'Organization Name is required') // Ensure the organization name is provided
        .max(200, 'Organization Name cannot exceed 200 characters'), // Limit the organization name length

    address: z
        .string()
        .min(1, 'Address is required') // Ensure the address is provided
        .max(255, 'Address cannot exceed 255 characters'), // Limit the address length

    city: z
        .string()
        .min(1, 'City is required') // Ensure the city is provided
        .max(100, 'City cannot exceed 100 characters'), // Limit the city name length

    country: z
        .string()
        .min(1, 'Country is required') // Ensure the country is provided
        .max(100, 'Country cannot exceed 100 characters'), // Limit the country name length

    tin: z
        .string()
        .min(1, 'TIN is required') // Ensure TIN is provided (optional)
        .max(50, 'TIN cannot exceed 50 characters') // Limit TIN length
        .optional(), // Make TIN optional

    industry: z
        .string()
        .max(100, 'Industry cannot exceed 100 characters') // Limit industry name length
        .optional(), // Make industry optional

    establishYear: z
        .number()
        .min(1900, 'Establishment Year must be a valid year') // Ensure the year is valid
        .max(new Date().getFullYear(), 'Establishment Year cannot be in the future') // Ensure the year is not in the future
        .optional(), // Make establishment year optional

    verifyStatus: z
        .enum(['pending', 'verified', 'rejected']) // Enforcing the validation for verifyStatus field
        .default('pending'), // Default to 'pending'
});

export const validateOrg = (data) => {
    try {
        return orgValidationSchema.parse(data); // Validating data against the schema
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
