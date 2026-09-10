import { pgTable, uuid, varchar, text, integer, timestamp, jsonb, boolean, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users Table (Inspectors / Enforcement Officers)
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  badgeNumber: varchar('badge_number', { length: 100 }),
  role: varchar('role', { length: 50 }).default('INSPECTOR').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Products Table
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  brand: varchar('brand', { length: 255 }),
  category: varchar('category', { length: 100 }).notNull(), // e.g., Food, Cosmetics, Electronics, General
  description: text('description'),
  manufacturerName: varchar('manufacturer_name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. Inspections Table
export const inspections = pgTable('inspections', {
  id: uuid('id').defaultRandom().primaryKey(),
  inspectionNumber: varchar('inspection_number', { length: 100 }).notNull().unique(),
  productId: uuid('product_id').references(() => products.id),
  inspectorId: uuid('inspector_id').references(() => users.id),
  // Status: created, uploaded, processing, analyzed, manual_review, completed, failed
  status: varchar('status', { length: 50 }).default('created').notNull(),
  // Overall compliance result: PENDING, COMPLIANT, NON_COMPLIANT, MANUAL_REVIEW
  overallStatus: varchar('overall_status', { length: 50 }).default('PENDING').notNull(),
  complianceScore: integer('compliance_score').default(0),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 4. Inspection Images Table
export const inspectionImages = pgTable('inspection_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  inspectionId: uuid('inspection_id').references(() => inspections.id, { onDelete: 'cascade' }).notNull(),
  imageUrl: varchar('image_url', { length: 1024 }).notNull(),
  filePath: varchar('file_path', { length: 1024 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: integer('file_size').notNull(),
  // View types: front, back, left_side, right_side, top, bottom, evidence, other
  viewType: varchar('view_type', { length: 50 }).default('front').notNull(),
  ocrRawData: jsonb('ocr_raw_data'),
  extractedText: text('extracted_text'),
  imageWidth: integer('image_width'),
  imageHeight: integer('image_height'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. Declarations Table (Extracted entities from package labels)
export const declarations = pgTable('declarations', {
  id: uuid('id').defaultRandom().primaryKey(),
  inspectionId: uuid('inspection_id').references(() => inspections.id, { onDelete: 'cascade' }).notNull(),
  // declaration_type: manufacturer, packer, importer, net_quantity, mrp, mfg_date, expiry_date, consumer_care, generic_name, country_of_origin, dimensions
  declarationType: varchar('declaration_type', { length: 100 }).notNull(),
  detectedValue: text('detected_value').notNull(),
  confidence: real('confidence').default(1.0).notNull(),
  sourceImageId: uuid('source_image_id').references(() => inspectionImages.id),
  boundingBox: jsonb('bounding_box'), // { x, y, width, height }
  isVerified: boolean('is_verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. Compliance Rules Table (Configurable Legal Metrology Rules 2011)
export const complianceRules = pgTable('compliance_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  ruleCode: varchar('rule_code', { length: 100 }).notNull().unique(), // e.g. LMR-06-1-A, LMR-06-1-C, LMR-06-1-E
  ruleReference: varchar('rule_reference', { length: 255 }).notNull(), // e.g. Rule 6(1)(e) read with Rule 2(m)
  title: varchar('title', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(), // Mandatory Declarations, Net Quantity, Pricing, Consumer Protection
  requirement: text('requirement').notNull(),
  // validation_type: required_field, text_format, numeric_value, date_format, presence, conditional_presence, placement, readability, font_size, manual_verification
  validationType: varchar('validation_type', { length: 100 }).notNull(),
  severity: varchar('severity', { length: 50 }).default('CRITICAL').notNull(), // CRITICAL, MAJOR, MINOR, ADVISORY
  isActive: boolean('is_active').default(true).notNull(),
  parameters: jsonb('parameters'), // specific thresholds, regex patterns, or unit lists
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. Compliance Checks Table (Individual evaluation of an inspection against a rule)
export const complianceChecks = pgTable('compliance_checks', {
  id: uuid('id').defaultRandom().primaryKey(),
  inspectionId: uuid('inspection_id').references(() => inspections.id, { onDelete: 'cascade' }).notNull(),
  ruleId: uuid('rule_id').references(() => complianceRules.id).notNull(),
  // status: PASS, FAIL, MANUAL_REVIEW, NOT_APPLICABLE
  status: varchar('status', { length: 50 }).notNull(),
  detectedValue: text('detected_value'),
  requirement: text('requirement').notNull(),
  validationNotes: text('validation_notes'),
  sourceImageId: uuid('source_image_id').references(() => inspectionImages.id),
  boundingBox: jsonb('bounding_box'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 8. Violations Table (Detailed non-compliance records linked to evidence)
export const violations = pgTable('violations', {
  id: uuid('id').defaultRandom().primaryKey(),
  complianceCheckId: uuid('compliance_check_id').references(() => complianceChecks.id, { onDelete: 'cascade' }).notNull(),
  inspectionId: uuid('inspection_id').references(() => inspections.id, { onDelete: 'cascade' }).notNull(),
  violationCode: varchar('violation_code', { length: 100 }).notNull(), // e.g. V-MRP-01, V-MFG-02
  title: varchar('title', { length: 255 }).notNull(),
  severity: varchar('severity', { length: 50 }).default('CRITICAL').notNull(),
  detectedValue: text('detected_value'),
  expectedRequirement: text('expected_requirement').notNull(),
  legalReference: text('legal_reference').notNull(), // Rule citation from Legal Metrology Rules 2011
  explanation: text('explanation').notNull(),
  evidenceImageId: uuid('evidence_image_id').references(() => inspectionImages.id),
  boundingBox: jsonb('bounding_box'),
  recommendedAction: text('recommended_action'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 9. Reports Table (Generated Inspection PDF Reports)
export const reports = pgTable('reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  inspectionId: uuid('inspection_id').references(() => inspections.id, { onDelete: 'cascade' }).notNull().unique(),
  reportNumber: varchar('report_number', { length: 100 }).notNull().unique(),
  pdfPath: varchar('pdf_path', { length: 1024 }),
  totalChecks: integer('total_checks').default(0).notNull(),
  passedChecks: integer('passed_checks').default(0).notNull(),
  failedChecks: integer('failed_checks').default(0).notNull(),
  manualReviewChecks: integer('manual_review_checks').default(0).notNull(),
  complianceScore: integer('compliance_score').default(0).notNull(),
  metadata: jsonb('metadata'),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
});

// Entity Relations
export const userRelations = relations(users, ({ many }) => ({
  inspections: many(inspections),
}));

export const productRelations = relations(products, ({ many }) => ({
  inspections: many(inspections),
}));

export const inspectionRelations = relations(inspections, ({ one, many }) => ({
  product: one(products, {
    fields: [inspections.productId],
    references: [products.id],
  }),
  inspector: one(users, {
    fields: [inspections.inspectorId],
    references: [users.id],
  }),
  images: many(inspectionImages),
  declarations: many(declarations),
  complianceChecks: many(complianceChecks),
  violations: many(violations),
  report: one(reports, {
    fields: [inspections.id],
    references: [reports.inspectionId],
  }),
}));

export const inspectionImageRelations = relations(inspectionImages, ({ one }) => ({
  inspection: one(inspections, {
    fields: [inspectionImages.inspectionId],
    references: [inspections.id],
  }),
}));

export const declarationRelations = relations(declarations, ({ one }) => ({
  inspection: one(inspections, {
    fields: [declarations.inspectionId],
    references: [inspections.id],
  }),
  sourceImage: one(inspectionImages, {
    fields: [declarations.sourceImageId],
    references: [inspectionImages.id],
  }),
}));

export const complianceCheckRelations = relations(complianceChecks, ({ one }) => ({
  inspection: one(inspections, {
    fields: [complianceChecks.inspectionId],
    references: [inspections.id],
  }),
  rule: one(complianceRules, {
    fields: [complianceChecks.ruleId],
    references: [complianceRules.id],
  }),
}));

export const violationRelations = relations(violations, ({ one }) => ({
  inspection: one(inspections, {
    fields: [violations.inspectionId],
    references: [inspections.id],
  }),
  complianceCheck: one(complianceChecks, {
    fields: [violations.complianceCheckId],
    references: [complianceChecks.id],
  }),
  evidenceImage: one(inspectionImages, {
    fields: [violations.evidenceImageId],
    references: [inspectionImages.id],
  }),
}));
