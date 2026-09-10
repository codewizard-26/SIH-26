import { configureStore } from '@reduxjs/toolkit';
import systemReducer from '../features/system/systemSlice';

export const store = configureStore({
  reducer: {
    system: systemReducer,
    // Prepared for Phase 1+:
    // inspections: inspectionsReducer,
    // products: productsReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});
