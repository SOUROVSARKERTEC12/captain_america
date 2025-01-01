import { z } from 'zod';

export const OrganizationValidator = z.object({
    id: z.string().uuid().optional(), // id is a UUID string, optional because it can be auto-generated
    orgName: z.string().max(255, "Organization name must be less than 255 characters").nonempty("Organization name is required"),
    address: z.string().max(255, "Address must be less than 255 characters").nonempty("Address is required"),
    city: z.string().max(255, "City must be less than 255 characters").nonempty("City is required"),
    country: z.string().max(255, "Country must be less than 255 characters").nonempty("Country is required"),
    tin: z.string().max(255, "TIN must be less than 255 characters").optional().nullable(),
    industry: z.string().max(255, "Industry must be less than 255 characters").optional().nullable(),
    establishYear: z.number().int().min(1000, "Establish year must be a valid year").max(9999, "Establish year must be a valid year").optional().nullable(),
    status: z.enum(['pending', 'verified', 'rejected']).default('pending'),
    UserId: z.string().uuid().nonempty("UserId is required"), // Foreign key to the User model
});