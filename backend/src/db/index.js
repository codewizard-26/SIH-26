import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from '../config/env.js';
import * as schema from './schema.js';

const { Pool } = pg;

let pool = null;
let db = null;

const initDbTables = async (client) => {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        badge_number VARCHAR(100),
        role VARCHAR(50) DEFAULT 'INSPECTOR' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(255),
        category VARCHAR(100) NOT NULL,
        description TEXT,
        manufacturer_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS inspections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        inspection_number VARCHAR(100) UNIQUE NOT NULL,
        product_id UUID REFERENCES products(id) ON DELETE SET NULL,
        inspector_id UUID REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'created' NOT NULL,
        overall_status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
        compliance_score INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS inspection_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE NOT NULL,
        image_url VARCHAR(1024) NOT NULL,
        file_path VARCHAR(1024) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        file_size INTEGER NOT NULL,
        view_type VARCHAR(50) DEFAULT 'front' NOT NULL,
        ocr_raw_data JSONB,
        extracted_text TEXT,
        image_width INTEGER,
        image_height INTEGER,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS declarations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE NOT NULL,
        declaration_type VARCHAR(100) NOT NULL,
        detected_value TEXT NOT NULL,
        confidence REAL DEFAULT 1.0 NOT NULL,
        source_image_id UUID REFERENCES inspection_images(id),
        bounding_box JSONB,
        is_verified BOOLEAN DEFAULT FALSE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS compliance_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rule_code VARCHAR(100) UNIQUE NOT NULL,
        rule_reference VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        requirement TEXT NOT NULL,
        validation_type VARCHAR(100) NOT NULL,
        severity VARCHAR(50) DEFAULT 'CRITICAL' NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        parameters JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS compliance_checks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE NOT NULL,
        rule_id UUID,
        status VARCHAR(50) NOT NULL,
        detected_value TEXT,
        requirement TEXT NOT NULL,
        validation_notes TEXT,
        source_image_id UUID REFERENCES inspection_images(id),
        bounding_box JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS violations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        compliance_check_id UUID REFERENCES compliance_checks(id) ON DELETE CASCADE,
        inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE NOT NULL,
        violation_code VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        severity VARCHAR(50) DEFAULT 'CRITICAL' NOT NULL,
        detected_value TEXT,
        expected_requirement TEXT NOT NULL,
        legal_reference TEXT NOT NULL,
        explanation TEXT NOT NULL,
        evidence_image_id UUID REFERENCES inspection_images(id),
        bounding_box JSONB,
        recommended_action TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE NOT NULL UNIQUE,
        report_number VARCHAR(100) UNIQUE NOT NULL,
        pdf_path VARCHAR(1024),
        total_checks INTEGER DEFAULT 0 NOT NULL,
        passed_checks INTEGER DEFAULT 0 NOT NULL,
        failed_checks INTEGER DEFAULT 0 NOT NULL,
        manual_review_checks INTEGER DEFAULT 0 NOT NULL,
        compliance_score INTEGER DEFAULT 0 NOT NULL,
        metadata JSONB,
        generated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.info('✅ PostgreSQL tables verified / initialized successfully');
  } catch (err) {
    console.warn('⚠️ Table initialization note:', err.message);
  }
};

if (env.DATABASE_URL) {
  try {
    const isCloudDb = env.DATABASE_URL.includes('neon.tech') || 
                      env.DATABASE_URL.includes('aws') || 
                      env.DATABASE_URL.includes('sslmode=require');

    pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.warn('⚠️ [PostgreSQL Pool Warning]:', err.message);
    });

    db = drizzle(pool, { schema });
    console.info('✅ PostgreSQL connected via Drizzle ORM');

    // Run table initialization
    initDbTables(pool);
  } catch (error) {
    console.warn('⚠️ Database connection initialization failed:', error.message);
  }
} else {
  console.info('DATABASE_URL not configured. Running in stand-alone / dynamic memory store.');
}

export { pool, db, schema };
