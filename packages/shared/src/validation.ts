import { z } from 'zod';
import { FEES } from './fees';

export const phoneCOSchema = z
  .string()
  .regex(/^\+57\d{10}$/, { message: 'Formato celular inválido, usa +57 seguido de 10 dígitos' });

export const emailSchema = z.string().email({ message: 'Email inválido' });

export const idDocumentSchema = z.object({
  type: z.enum(['CC', 'CE', 'TI', 'PASSPORT'], { message: 'Tipo de documento inválido' }),
  number: z.string().min(5).max(20),
});

export const createListingSchema = z.object({
  subscriptionServiceId: z.string().min(1),
  planName: z.string().min(2).max(100),
  totalSlots: z.number().int().min(2).max(10),
  availableSlots: z.number().int().min(1),
  baseSlotPriceCOP: z.number().positive().max(1_000_000),
  markupPercent: z.number().int().min(0).max(10),
  customInstructions: z.string().max(2000).optional(),
  autoAccept: z.boolean().optional(),
});

export const checkoutPaymentSchema = z.object({
  listingId: z.string().min(1),
  method: z.enum([
    'NEQUI',
    'DAVIPLATA',
    'PSE',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'BANK_TRANSFER',
    'WALLET_BALANCE',
    'ADDI_BNPL',
    'RAPPI_PAY',
    'EFECTY',
  ]),
  phone: phoneCOSchema.optional(),
  document: idDocumentSchema.optional(),
  saveMethod: z.boolean().optional(),
});

export const disputeSchema = z.object({
  membershipId: z.string().min(1),
  paymentId: z.string().min(1).optional(),
  reason: z.enum([
    'NO_ACCESS',
    'WRONG_CREDENTIALS',
    'ACCESS_LOST',
    'SUSPENDED_ACCOUNT',
    'PAYMENT_ISSUE',
    'HOST_UNRESPONSIVE',
    'GUEST_DID_NOT_PAY',
    'OTHER',
  ]),
  description: z.string().min(10).max(5000),
  evidenceUrls: z.array(z.string().url()).max(5).optional(),
});

export const payoutRequestSchema = z.object({
  amountCOP: z.number().positive(),
  method: z.enum([
    'NEQUI',
    'DAVIPLATA',
    'BANK_TRANSFER',
  ]),
  destinationRef: z.string().min(1),
  expedited: z.boolean().default(false),
});

export const onboardingRoleSchema = z.object({
  role: z.enum(['HOST', 'GUEST', 'BOTH'], {
    message: 'Selecciona: ser Anfitrión, Huésped o ambos',
  }),
});

export { FEES };
