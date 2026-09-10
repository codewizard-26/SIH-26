import { Router } from 'express';
import path from 'path';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import * as inspectionService from '../inspections/inspection.service.js';
import { env } from '../../config/env.js';

const router = Router();

const DEMO_SAMPLES = [
  {
    key: 'almonds-compliant',
    name: 'NutriChoice California Roasted Almonds 200g',
    category: 'Food & Beverages',
    brand: 'NutriChoice',
    manufacturerName: 'Apex Food Processing Ltd',
    notes: 'Standard edible dry fruit pouch. All mandatory declarations declared in compliance with Rules 6(1)(a-e) and 6(2).',
    imageFile: 'sample_almonds_compliant.png',
    viewType: 'front',
    expectedOutcome: 'COMPLIANT / MANUAL REVIEW (Font Height Table I)',
  },
  {
    key: 'shampoo-violation',
    name: 'Naturals Herbal Hair Cleanser Shampoo 250ml',
    category: 'Cosmetics & Personal Care',
    brand: 'Naturals',
    manufacturerName: 'Veda Cosmetics Pvt Ltd',
    notes: 'Retail cosmetic seizure. Violations: Net quantity has prohibited qualifier ("approx"), MRP omits tax inclusivity, Consumer Care omitted.',
    imageFile: 'sample_shampoo_violation.png',
    viewType: 'back',
    expectedOutcome: 'NON-COMPLIANT (3 Critical Violations Detected)',
  },
];

// List available demo test samples
router.get('/', (req, res) => {
  return successResponse(res, DEMO_SAMPLES, 'Demo samples retrieved');
});

// Run 1-Click Complete Demo Flow
router.post('/run-demo/:sampleKey', async (req, res, next) => {
  try {
    const { sampleKey } = req.params;
    const sample = DEMO_SAMPLES.find((s) => s.key === sampleKey);

    if (!sample) {
      return errorResponse(res, 'SAMPLE_NOT_FOUND', `Demo sample '${sampleKey}' not found`, [], 404);
    }

    // Step 1: Create Inspection
    const inspection = await inspectionService.createInspection({
      productName: sample.name,
      category: sample.category,
      brand: sample.brand,
      manufacturerName: sample.manufacturerName,
      notes: sample.notes,
      inspectorName: 'Officer (Legal Metrology Division)',
    });

    // Step 2: Attach sample image
    const sampleFilePath = path.resolve(env.UPLOAD_DIR, sample.imageFile);
    const mockMulterFile = {
      filename: sample.imageFile,
      originalname: sample.imageFile,
      path: sampleFilePath,
      mimetype: 'image/png',
      size: 22000,
    };

    await inspectionService.addImagesToInspection(inspection.id, [mockMulterFile], [sample.viewType]);

    // Step 3: Run Real OCR & Compliance Analysis
    const analyzedInspection = await inspectionService.runDynamicAnalysis(inspection.id);

    return successResponse(res, analyzedInspection, 'Demo inspection analyzed successfully');
  } catch (error) {
    next(error);
  }
});

export default router;
