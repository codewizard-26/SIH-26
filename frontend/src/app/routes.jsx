import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Dashboard from '../pages/Dashboard';
import NotFound from '../pages/NotFound';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        {/* Placeholder routes for upcoming phases */}
        <Route
          path="inspections/new"
          element={
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
              <h2 className="text-xl font-bold text-slate-800">New Inspection Module</h2>
              <p className="text-sm text-slate-500 mt-2">
                Multi-image capture &amp; product metadata submission scheduled for Phase 1 &amp; 2.
              </p>
            </div>
          }
        />
        <Route
          path="inspections"
          element={
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
              <h2 className="text-xl font-bold text-slate-800">Inspection History &amp; Audit Trail</h2>
              <p className="text-sm text-slate-500 mt-2">
                Historical records and inspection search scheduled for Phase 1 &amp; Phase 8.
              </p>
            </div>
          }
        />
        <Route path="404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
}
