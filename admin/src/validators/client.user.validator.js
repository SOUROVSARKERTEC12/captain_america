import { z } from 'zod';

export const UserValidator = z.object({
    id: z.string().uuid().optional(), // id is a UUID string, optional because it can be auto-generated
    email: z.string().email().max(255, "Email must be less than 255 characters").nonempty("Email is required"),
    password: z.string().min(6, "Password must be at least 6 characters").max(255, "Password must be less than 255 characters").nonempty("Password is required"),
    firstName: z.string().max(255, "First Name must be less than 255 characters").nonempty("First Name is required"),
    lastName: z.string().max(255, "Last Name must be less than 255 characters").nonempty("Last Name is required"),
    nidFront: z.string().max(255, "NID Front must be less than 255 characters").optional(),
    nidBack: z.string().max(255, "NID Back must be less than 255 characters").optional(),
    phone: z.string().max(255, "Phone number must be less than 255 characters").nonempty("Phone is required"),
    verified: z.boolean().default(false),
    role: z.string().max(255, "Role must be less than 255 characters").default('user'),
    twoFASecret: z.string().max(255, "2FA Secret must be less than 255 characters").optional(),
    isTwoFAEnabled: z.boolean().default(false),
    firstVisit: z.boolean().default(true),
    status: z.enum(['pending', 'verified', 'rejected']).default('pending'),
});

