import { z } from 'zod';

export const inspectionStatuses = [
  'created',
  'uploaded',
  'processing',
  'analyzed',
  'manual_review',
  'completed',
  'failed',
];

export const overallStatuses = [
  'PENDING',
  'COMPLIANT',
  'NON_COMPLIANT',
  'MANUAL_REVIEW',
];

export const inspectionCreateSchema = z.object({
  productName: z.string().trim().max(255).optional().default('Automated Scan Package').transform((val) => val && val.length >= 2 ? val : 'Automated Scan Package'),
  category: z.string().trim().optional().default('General Packaged Commodity').transform((val) => val && val.length >= 1 ? val : 'General Packaged Commodity'),
  brand: z.string().trim().max(255).optional().default(''),
  manufacturerName: z.string().trim().max(255).optional().default(''),
  productId: z.string().uuid().optional(),
  notes: z.string().trim().optional().default(''),
  inspectorName: z.string().trim().optional().default('Officer (Legal Metrology)'),
});

export const inspectionQuerySchema = z.object({
  status: z.enum(inspectionStatuses).optional(),
  overallStatus: z.enum(overallStatuses).optional(),
  search: z.string().optional(),
});

export const inspectionIdParamSchema = z.object({
  id: z.string().uuid('Invalid inspection ID format'),
});
