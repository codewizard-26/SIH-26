import { configureStore } from '@reduxjs/toolkit';
import systemReducer from '../features/system/systemSlice';
import inspectionReducer from '../features/inspections/inspectionSlice';

export const store = configureStore({
  reducer: {
    system: systemReducer,
    inspections: inspectionReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});
