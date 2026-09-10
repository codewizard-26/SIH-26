import * as inspectionService from './inspection.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import path from 'path';

export const handleCreateInspection = async (req, res, next) => {
  try {
    const inspection = await inspectionService.createInspection(req.body);
    return successResponse(res, inspection, 'Inspection initialized successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const handleAddImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const files = req.files || [];
    let viewTypes = req.body.viewTypes;

    if (typeof viewTypes === 'string') {
      try {
        viewTypes = JSON.parse(viewTypes);
      } catch (e) {
        viewTypes = [viewTypes];
      }
    }

    const inspection = await inspectionService.addImagesToInspection(id, files, viewTypes);
    return successResponse(res, inspection, `${files.length} package image(s) uploaded successfully`);
  } catch (error) {
    next(error);
  }
};

export const handleRunAnalysis = async (req, res, next) => {
  try {
    const { id } = req.params;
    const inspection = await inspectionService.runDynamicAnalysis(id);
    return successResponse(res, inspection, 'Real-time compliance analysis completed');
  } catch (error) {
    next(error);
  }
};

export const handleGetAllInspections = async (req, res, next) => {
  try {
    const inspections = await inspectionService.getAllInspections(req.query);
    return successResponse(res, inspections, 'Inspections retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const handleGetDashboardMetrics = async (req, res, next) => {
  try {
    const metrics = await inspectionService.getDashboardMetrics();
    return successResponse(res, metrics, 'Dashboard metrics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const handleGetInspectionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const inspection = await inspectionService.getInspectionById(id);
    if (!inspection) {
      return errorResponse(res, 'INSPECTION_NOT_FOUND', `Inspection with ID ${id} not found`, [], 404);
    }
    return successResponse(res, inspection, 'Inspection retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const handleGetInspectionReportPdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pdfPath = await inspectionService.getInspectionReportPdf(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(pdfPath)}"`);
    return res.sendFile(path.resolve(pdfPath));
  } catch (error) {
    next(error);
  }
};
