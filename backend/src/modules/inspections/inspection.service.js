import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import { db, schema } from '../../db/index.js';
import { eq, desc } from 'drizzle-orm';
import * as productService from '../products/product.service.js';
import { performOCR, performBatchOCR } from '../../services/ocr.service.js';
import { extractDeclarations } from '../../services/extraction.service.js';
import { evaluateCompliance } from '../../services/compliance.service.js';
import { generateInspectionReport } from '../../services/report.service.js';
import { env } from '../../config/env.js';

// Dynamic in-memory store fallback when PostgreSQL is not configured
const inMemoryInspections = [];

// Helper to generate formatted inspection sequence number
const generateInspectionNumber = () => {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `INSP-${year}-${randomSuffix}`;
};

export const createInspection = async (data) => {
  let productId = data.productId;
  
  // Allow creation without explicit product details (will be filled by ML)
  const productName = data.productName || 'Unknown Product (Awaiting Scan)';
  const category = data.category || 'General Packaged Commodity';
  
  if (!productId) {
    const product = await productService.createProduct({
      name: productName,
      brand: data.brand || '',
      category: category,
      manufacturerName: data.manufacturerName || '',
    });
    productId = product.id;
  }

  const newInspection = {
    id: randomUUID(),
    inspectionNumber: generateInspectionNumber(),
    productId,
    productName: productName,
    brand: data.brand || '',
    category: category,
    manufacturerName: data.manufacturerName || '',
    inspectorName: data.inspectorName || 'Officer (Legal Metrology)',
    status: 'created', // created, uploaded, processing, analyzed
    overallStatus: 'PENDING',
    complianceScore: 0,
    notes: data.notes || '',
    images: [],
    declarations: {},
    complianceChecks: [],
    violations: [],
    manualChecks: [],
    passedChecksCount: 0,
    failedChecksCount: 0,
    manualChecksCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  inMemoryInspections.unshift(newInspection);

  if (db) {
    try {
      await db.insert(schema.inspections).values({
        id: newInspection.id,
        inspectionNumber: newInspection.inspectionNumber,
        productId: newInspection.productId,
        status: newInspection.status,
        overallStatus: newInspection.overallStatus,
        complianceScore: newInspection.complianceScore,
        notes: newInspection.notes,
      });
    } catch (err) {
      console.warn('DB insert failed for inspection, using memory store:', err.message);
    }
  }

  return newInspection;
};

export const addImagesToInspection = async (inspectionId, files = [], viewTypes = {}) => {
  const inspection = await getInspectionById(inspectionId);
  if (!inspection) {
    throw new Error(`Inspection with ID ${inspectionId} not found`);
  }

  const addedImages = files.map((file, idx) => {
    // viewTypes can be an array or object keyed by file index or original name
    const viewType = Array.isArray(viewTypes)
      ? viewTypes[idx] || 'front'
      : viewTypes[file.originalname] || viewTypes[idx] || 'front';

    return {
      id: randomUUID(),
      inspectionId,
      fileName: file.filename,
      originalName: file.originalname,
      filePath: file.path,
      imageUrl: `/uploads/${file.filename}`,
      mimeType: file.mimetype,
      fileSize: file.size,
      viewType,
      ocrRawData: null,
      extractedText: '',
      createdAt: new Date().toISOString(),
    };
  });

  inspection.images.push(...addedImages);
  inspection.status = 'uploaded';
  inspection.updatedAt = new Date().toISOString();

  if (db) {
    try {
      for (const img of addedImages) {
        await db.insert(schema.inspectionImages).values({
          id: img.id,
          inspectionId: img.inspectionId,
          imageUrl: img.imageUrl,
          filePath: img.filePath,
          fileName: img.fileName,
          mimeType: img.mimeType,
          fileSize: img.fileSize,
          viewType: img.viewType,
        });
      }
      await db.update(schema.inspections)
        .set({ status: 'uploaded', updatedAt: new Date() })
        .where(eq(schema.inspections.id, inspectionId));
    } catch (err) {
      console.warn('DB image insert failed, using memory store:', err.message);
    }
  }

  return inspection;
};

/**
 * Executes real OCR, Declaration Extraction, and Statutory Rule Evaluation dynamically
 */
export const runDynamicAnalysis = async (inspectionId) => {
  const inspection = await getInspectionById(inspectionId);
  if (!inspection) {
    throw new Error(`Inspection with ID ${inspectionId} not found`);
  }

  inspection.status = 'processing';

  // 1. Perform Real OCR on all uploaded package images using batch worker
  const imageInputs = inspection.images.map((img) => ({
    filePath: img.filePath,
    id: img.id,
    viewType: img.viewType,
  }));

  const ocrOutputs = await performBatchOCR(imageInputs);

  const ocrResults = [];
  inspection.images.forEach((img, idx) => {
    const ocr = ocrOutputs[idx] || { fullText: '', confidence: 0, lines: [], words: [] };
    img.ocrRawData = ocr;
    img.extractedText = ocr.fullText;

    ocrResults.push({
      imageId: img.id,
      viewType: img.viewType,
      fullText: ocr.fullText,
      lines: ocr.lines,
      words: ocr.words,
      confidence: ocr.confidence,
    });
  });

  // 2. Extract Declarations from OCR text and custom ML model
  const declarations = extractDeclarations(ocrResults);
  inspection.declarations = declarations;

  // If the custom ML model extracted a generic product name from the image, update the inspection record
  if (declarations.genericName && declarations.genericName.detected && declarations.genericName.value) {
    inspection.productName = declarations.genericName.value;
  }

  // 3. Evaluate Compliance against Legal Metrology Rules 2011
  const productInfo = {
    name: inspection.productName,
    category: inspection.category,
    brand: inspection.brand,
  };
  const complianceResult = evaluateCompliance(productInfo, declarations);

  // Update inspection with real analysis results
  inspection.status = 'analyzed';
  inspection.overallStatus = complianceResult.overallStatus;
  inspection.complianceScore = complianceResult.complianceScore;
  inspection.complianceChecks = complianceResult.checks;
  inspection.violations = complianceResult.violations;
  inspection.manualChecks = complianceResult.manualChecks;
  inspection.passedChecksCount = complianceResult.passedChecksCount;
  inspection.failedChecksCount = complianceResult.failedChecksCount;
  inspection.manualChecksCount = complianceResult.manualChecksCount;
  inspection.updatedAt = new Date().toISOString();

  // Save to DB if connected
  if (db) {
    try {
      if (inspection.productId && inspection.productName) {
        await db.update(schema.products)
          .set({ name: inspection.productName, updatedAt: new Date() })
          .where(eq(schema.products.id, inspection.productId));
      }
      await db.update(schema.inspections)
        .set({
          status: inspection.status,
          overallStatus: inspection.overallStatus,
          complianceScore: inspection.complianceScore,
          updatedAt: new Date(),
        })
        .where(eq(schema.inspections.id, inspectionId));
    } catch (err) {
      console.warn('DB update failed after analysis, using memory store:', err.message);
    }
  }

  return inspection;
};

export const getAllInspections = async (filters = {}) => {
  let results = [...inMemoryInspections];

  // Filter
  if (filters.status) {
    results = results.filter((i) => i.status === filters.status);
  }
  if (filters.overallStatus) {
    results = results.filter((i) => i.overallStatus === filters.overallStatus);
  }
  if (filters.category && filters.category !== 'ALL') {
    results = results.filter((i) => i.category === filters.category);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      (i) =>
        i.inspectionNumber.toLowerCase().includes(q) ||
        (i.productName && i.productName.toLowerCase().includes(q)) ||
        (i.brand && i.brand.toLowerCase().includes(q)) ||
        (i.category && i.category.toLowerCase().includes(q))
    );
  }

  return results;
};

export const getInspectionById = async (id) => {
  return inMemoryInspections.find((i) => i.id === id) || null;
};

export const getDashboardMetrics = async () => {
  const all = await getAllInspections();

  const total = all.length;
  const compliant = all.filter((i) => i.overallStatus === 'COMPLIANT').length;
  const nonCompliant = all.filter((i) => i.overallStatus === 'NON_COMPLIANT').length;
  const manualReview = all.filter((i) => i.overallStatus === 'MANUAL_REVIEW').length;
  const pending = all.filter((i) => i.overallStatus === 'PENDING').length;

  // Real aggregate dynamic violations
  const violationMap = {};
  all.forEach((insp) => {
    (insp.violations || []).forEach((v) => {
      violationMap[v.title] = (violationMap[v.title] || 0) + 1;
    });
  });

  const violationCategories = Object.entries(violationMap).map(([title, count]) => ({
    category: title,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));

  // Fallback defaults if no violations yet
  if (violationCategories.length === 0) {
    violationCategories.push(
      { category: 'Rule 6(2) Consumer Care Details', count: 0, percentage: 0 },
      { category: 'Rule 6(1)(e) MRP Tax Inclusivity Declaration', count: 0, percentage: 0 },
      { category: 'Rule 6(1)(c) Net Quantity & Unit Qualifications', count: 0, percentage: 0 }
    );
  }

  return {
    totalInspections: total,
    compliantCount: compliant,
    nonCompliantCount: nonCompliant,
    manualReviewCount: manualReview,
    pendingCount: pending,
    complianceRate: total > 0 ? Math.round((compliant / total) * 100) : 0,
    recentInspections: all.slice(0, 8),
    violationCategories,
  };
};

export const getInspectionReportPdf = async (inspectionId) => {
  const inspection = await getInspectionById(inspectionId);
  if (!inspection) {
    throw new Error(`Inspection with ID ${inspectionId} not found`);
  }

  const reportsDir = path.resolve('./reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const pdfFileName = `Report-${inspection.inspectionNumber}.pdf`;
  const pdfFilePath = path.join(reportsDir, pdfFileName);

  await generateInspectionReport(inspection, pdfFilePath);
  return pdfFilePath;
};
