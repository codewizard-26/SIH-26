import { z } from 'zod';

export const productCategories = [
  'Food & Beverages',
  'Cosmetics & Personal Care',
  'Electronics & Electrical',
  'Chemicals & Detergents',
  'Textiles & Apparel',
  'General Packaged Commodity',
];

export const productCreateSchema = z.object({
  name: z.string().trim().min(2, 'Product name must be at least 2 characters').max(255),
  brand: z.string().trim().max(255).optional().default(''),
  category: z.string().trim().min(1, 'Category is required'),
  description: z.string().trim().optional().default(''),
  manufacturerName: z.string().trim().max(255).optional().default(''),
});

export const productIdParamSchema = z.object({
  id: z.string().uuid('Invalid product ID format'),
});
