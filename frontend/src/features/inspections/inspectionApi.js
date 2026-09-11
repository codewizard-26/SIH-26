import api from '../../services/api';

export const createInspectionApi = async (inspectionData) => {
  const response = await api.post('/inspections', inspectionData);
  return response.data.data;
};

export const uploadInspectionImagesApi = async (inspectionId, formData) => {
  const response = await api.post(`/inspections/${inspectionId}/images`, formData, {
    timeout: 180000, // 3 minutes for multi-image uploads
  });
  return response.data.data;
};

export const runInspectionAnalysisApi = async (inspectionId) => {
  const response = await api.post(`/inspections/${inspectionId}/analyze`, {}, {
    timeout: 180000, // 3 minutes for deep OCR and legal metrology verification
  });
  return response.data.data;
};

export const fetchAllInspectionsApi = async (params = {}) => {
  const response = await api.get('/inspections', { params });
  return response.data.data;
};

export const fetchInspectionByIdApi = async (inspectionId) => {
  const response = await api.get(`/inspections/${inspectionId}`);
  return response.data.data;
};

export const fetchDashboardMetricsApi = async () => {
  const response = await api.get('/inspections/dashboard/metrics');
  return response.data.data;
};

export const getReportPdfUrl = (inspectionId) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  return `${baseUrl}/inspections/${inspectionId}/report`;
};
