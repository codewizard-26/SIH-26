import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchSystemHealth } from './systemApi';

export const checkHealth = createAsyncThunk(
  'system/checkHealth',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchSystemHealth();
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to connect to backend service');
    }
  }
);

const systemSlice = createSlice({
  name: 'system',
  initialState: {
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    healthData: null,
    latency: null,
    error: null,
    lastChecked: null,
  },
  reducers: {
    resetSystemStatus: (state) => {
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkHealth.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(checkHealth.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.healthData = action.payload;
        state.latency = action.payload.latency;
        state.error = null;
        state.lastChecked = new Date().toISOString();
      })
      .addCase(checkHealth.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Backend connection failed';
        state.healthData = null;
        state.lastChecked = new Date().toISOString();
      });
  },
});

export const { resetSystemStatus } = systemSlice.actions;
export default systemSlice.reducer;
