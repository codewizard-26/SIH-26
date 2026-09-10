import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Dashboard from '../pages/Dashboard';
import NewInspection from '../pages/NewInspection';
import InspectionDetails from '../pages/InspectionDetails';
import InspectionHistory from '../pages/InspectionHistory';
import RulesReference from '../pages/RulesReference';
import NotFound from '../pages/NotFound';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="inspections/new" element={<NewInspection />} />
        <Route path="inspections/:id" element={<InspectionDetails />} />
        <Route path="inspections" element={<InspectionHistory />} />
        <Route path="rules" element={<RulesReference />} />
        <Route path="404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
}
