import { randomUUID } from 'crypto';
import { db, schema } from '../../db/index.js';
import { eq } from 'drizzle-orm';

// In-memory store fallback when PostgreSQL is not configured
const inMemoryProducts = [];

// Seed sample products for demonstration
const seedProducts = [
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Premium Roasted Almonds 200g',
    brand: 'NutriChoice',
    category: 'Food & Beverages',
    description: 'Packaged edible dry fruit nuts in airtight vacuum pouch',
    manufacturerName: 'Apex Food Processing Ltd',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    name: 'Herbal Hydrating Shampoo 250ml',
    brand: 'Naturals Glow',
    category: 'Cosmetics & Personal Care',
    description: 'Ayurvedic formulation herbal hair cleanser bottle',
    manufacturerName: 'Veda Cosmetics India Pvt Ltd',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];
inMemoryProducts.push(...seedProducts);

export const createProduct = async (productData) => {
  const newProduct = {
    id: randomUUID(),
    name: productData.name,
    brand: productData.brand || null,
    category: productData.category,
    description: productData.description || null,
    manufacturerName: productData.manufacturerName || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (db) {
    try {
      const [inserted] = await db.insert(schema.products).values(newProduct).returning();
      return inserted;
    } catch (err) {
      console.warn('DB insert failed, falling back to memory store:', err.message);
    }
  }

  inMemoryProducts.unshift(newProduct);
  return newProduct;
};

export const getAllProducts = async () => {
  if (db) {
    try {
      const records = await db.select().from(schema.products);
      if (records && records.length > 0) return records;
    } catch (err) {
      console.warn('DB select failed, falling back to memory store:', err.message);
    }
  }

  return [...inMemoryProducts];
};

export const getProductById = async (id) => {
  if (db) {
    try {
      const [record] = await db.select().from(schema.products).where(eq(schema.products.id, id));
      if (record) return record;
    } catch (err) {
      console.warn('DB select by ID failed, falling back to memory store:', err.message);
    }
  }

  return inMemoryProducts.find((p) => p.id === id) || null;
};
