import { z } from 'zod';

const requiredTextSchema = z.string().trim().min(1).max(200);
const phoneSchema = z.string().trim().min(7).max(40);
const dateSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/);

export const invoiceInputSchema = z.object({
  invoiceNumber: requiredTextSchema,
  invoiceDate: dateSchema,
  billedToName: requiredTextSchema,
  billedToEmail: z.string().trim().email(),
  billedToPhone: phoneSchema,
  weekLabel: z.string().trim().min(1).max(20),
  issuedDate: dateSchema,
  validUntil: dateSchema,
  dueDate: dateSchema,
  description: z.string().trim().min(1).max(500),
  duration: z.string().trim().min(1).max(100),
  total: z.string().trim().min(1).max(50),
});
