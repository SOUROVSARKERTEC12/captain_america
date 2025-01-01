import { z } from 'zod';

export const StakeholderValidator = z.object({
    id: z.string().uuid().optional(), // id is a UUID, optional because it can be auto-generated
    username: z.string().min(1, "Username is required").max(255, "Username must be less than 255 characters"),
    email: z.string().email("Invalid email format").max(255, "Email must be less than 255 characters"),
    firstName: z.string().min(1, "First name is required").max(255, "First name must be less than 255 characters"),
    lastName: z.string().min(1, "Last name is required").max(255, "Last name must be less than 255 characters"),
    phone: z.string().min(10, "Phone number must be at least 10 characters").max(255, "Phone number must be less than 255 characters"),
    nidFront: z.string().max(255, "NID front image path must be less than 255 characters").optional().nullable(),
    nidBack: z.string().max(255, "NID back image path must be less than 255 characters").optional().nullable(),
    stakeholderImage: z.string().max(255, "Stakeholder image path must be less than 255 characters").optional().nullable(),
    status: z.enum(['pending', 'verified', 'rejected']).default('pending'), // Default status is 'pending'
    orgId: z.string().uuid().nonempty("Organization ID is required"), // Foreign key to Organization
});
