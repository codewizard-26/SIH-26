import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as inspectionApi from './inspectionApi';

export const fetchDashboardMetrics = createAsyncThunk(
  'inspections/fetchDashboardMetrics',
  async (_, { rejectWithValue }) => {
    try {
      return await inspectionApi.fetchDashboardMetricsApi();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch dashboard metrics');
    }
  }
);

export const fetchAllInspections = createAsyncThunk(
  'inspections/fetchAllInspections',
  async (params, { rejectWithValue }) => {
    try {
      return await inspectionApi.fetchAllInspectionsApi(params);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch inspections');
    }
  }
);

export const fetchInspectionById = createAsyncThunk(
  'inspections/fetchInspectionById',
  async (id, { rejectWithValue }) => {
    try {
      return await inspectionApi.fetchInspectionByIdApi(id);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load inspection details');
    }
  }
);

export const createInspection = createAsyncThunk(
  'inspections/createInspection',
  async (data, { rejectWithValue }) => {
    try {
      return await inspectionApi.createInspectionApi(data);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to initialize inspection');
    }
  }
);

export const uploadImages = createAsyncThunk(
  'inspections/uploadImages',
  async ({ inspectionId, formData }, { rejectWithValue }) => {
    try {
      return await inspectionApi.uploadInspectionImagesApi(inspectionId, formData);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to upload package images');
    }
  }
);

export const runAnalysis = createAsyncThunk(
  'inspections/runAnalysis',
  async (inspectionId, { rejectWithValue }) => {
    try {
      return await inspectionApi.runInspectionAnalysisApi(inspectionId);
    } catch (err) {
      return rejectWithValue(err.message || 'Analysis processing failed');
    }
  }
);

const inspectionSlice = createSlice({
  name: 'inspections',
  initialState: {
    currentInspection: null,
    inspectionsList: [],
    metrics: null,
    loading: false,
    uploading: false,
    analyzing: false,
    error: null,
  },
  reducers: {
    clearCurrentInspection: (state) => {
      state.currentInspection = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Dashboard metrics
      .addCase(fetchDashboardMetrics.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDashboardMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.metrics = action.payload;
      })
      .addCase(fetchDashboardMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch All Inspections
      .addCase(fetchAllInspections.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllInspections.fulfilled, (state, action) => {
        state.loading = false;
        state.inspectionsList = action.payload;
      })
      .addCase(fetchAllInspections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Single Inspection
      .addCase(fetchInspectionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInspectionById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentInspection = action.payload;
      })
      .addCase(fetchInspectionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Inspection
      .addCase(createInspection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createInspection.fulfilled, (state, action) => {
        state.loading = false;
        state.currentInspection = action.payload;
      })
      .addCase(createInspection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Upload Images
      .addCase(uploadImages.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadImages.fulfilled, (state, action) => {
        state.uploading = false;
        state.currentInspection = action.payload;
      })
      .addCase(uploadImages.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload;
      })

      // Run Analysis
      .addCase(runAnalysis.pending, (state) => {
        state.analyzing = true;
        state.error = null;
      })
      .addCase(runAnalysis.fulfilled, (state, action) => {
        state.analyzing = false;
        state.currentInspection = action.payload;
      })
      .addCase(runAnalysis.rejected, (state, action) => {
        state.analyzing = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentInspection } = inspectionSlice.actions;
export default inspectionSlice.reducer;
