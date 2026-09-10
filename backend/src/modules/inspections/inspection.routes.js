import { Router } from 'express';
import * as inspectionController from './inspection.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { upload } from '../../middleware/upload.middleware.js';
import {
  inspectionCreateSchema,
  inspectionQuerySchema,
  inspectionIdParamSchema,
} from './inspection.schema.js';

const router = Router();

// Dashboard aggregated metrics (must come before /:id)
router.get('/dashboard/metrics', inspectionController.handleGetDashboardMetrics);

// Inspection CRUD & Lifecycle
router.post('/', validate(inspectionCreateSchema, 'body'), inspectionController.handleCreateInspection);
router.get('/', validate(inspectionQuerySchema, 'query'), inspectionController.handleGetAllInspections);
router.get('/:id', validate(inspectionIdParamSchema, 'params'), inspectionController.handleGetInspectionById);

// Real image upload (Multer)
router.post('/:id/images', upload.array('images', 10), inspectionController.handleAddImages);

// Real dynamic OCR + compliance analysis
router.post('/:id/analyze', validate(inspectionIdParamSchema, 'params'), inspectionController.handleRunAnalysis);

// Official PDF Report download
router.get('/:id/report', validate(inspectionIdParamSchema, 'params'), inspectionController.handleGetInspectionReportPdf);

export default router;
