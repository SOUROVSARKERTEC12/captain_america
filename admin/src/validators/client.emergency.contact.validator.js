import { z } from 'zod';

export const OrgEmrgContactValidator = z.object({
    id: z.string().uuid().optional(), // id is a UUID, optional because it can be auto-generated
    username: z.string().min(1, "Username is required").max(255, "Username must be less than 255 characters"),
    phone: z.string().min(10, "Phone number must be at least 10 characters").max(255, "Phone number must be less than 255 characters"),
    whatsapp: z.string().max(255, "WhatsApp number must be less than 255 characters").optional().nullable(),
    status: z.enum(['pending', 'verified', 'rejected']).default('pending'), // Default status is 'pending'
    orgId: z.string().uuid().nonempty("Organization ID is required"), // Foreign key to Organization
});
