import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchAllInspections } from '../features/inspections/inspectionSlice';
import { getReportPdfUrl } from '../features/inspections/inspectionApi';
import {
  ShieldCheck,
  Search,
  Filter,
  PlusCircle,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  FileDown,
  RefreshCw,
} from 'lucide-react';

const CATEGORIES = [
  'ALL',
  'Food & Beverages',
  'Cosmetics & Personal Care',
  'Electronics & Electrical',
  'Chemicals & Detergents',
  'Textiles & Apparel',
  'General Packaged Commodity',
];

const STATUS_FILTERS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'COMPLIANT', label: 'Compliant' },
  { value: 'NON_COMPLIANT', label: 'Non-Compliant' },
  { value: 'MANUAL_REVIEW', label: 'Manual Review' },
  { value: 'PENDING', label: 'Pending / Uploaded' },
];

export default function InspectionHistory() {
  const dispatch = useDispatch();
  const { inspectionsList, loading } = useSelector((state) => state.inspections);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    loadInspections();
  }, [dispatch, selectedStatus, selectedCategory]);

  const loadInspections = () => {
    const params = {};
    if (selectedStatus !== 'ALL') params.overallStatus = selectedStatus;
    if (selectedCategory !== 'ALL') params.category = selectedCategory;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    dispatch(fetchAllInspections(params));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadInspections();
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Inspection History &amp; Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official record of packaged commodity compliance inspections under Legal Metrology Rules, 2011.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadInspections}
            disabled={loading}
            className="p-2 bg-white border border-slate-300 rounded-lg text-slate-600 hover:text-slate-900 transition"
            title="Refresh history"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <Link
            to="/inspections/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow transition"
          >
            <PlusCircle className="w-4 h-4" /> New Inspection
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product, brand, or ID..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === 'ALL' ? 'All Categories' : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inspections Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {inspectionsList.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">No inspections found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No inspection records match the current filter or search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Inspection ID</th>
                  <th className="px-6 py-3.5">Product Details</th>
                  <th className="px-6 py-3.5">Inspection Date</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Score</th>
                  <th className="px-6 py-3.5">Violations</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {inspectionsList.map((insp) => {
                  const isPass = insp.overallStatus === 'COMPLIANT';
                  const isFail = insp.overallStatus === 'NON_COMPLIANT';
                  const isManual = insp.overallStatus === 'MANUAL_REVIEW';

                  return (
                    <tr key={insp.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4 font-mono font-semibold text-slate-900">
                        {insp.inspectionNumber}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{insp.productName}</p>
                        <p className="text-[11px] text-slate-500">
                          {insp.brand ? `${insp.brand} • ` : ''}
                          {insp.category}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(insp.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            isPass
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isFail
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : isManual
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {isPass && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {isFail && <XCircle className="w-3 h-3 text-rose-600" />}
                          {isManual && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                          {insp.overallStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-800">
                        {insp.complianceScore}%
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600">
                        {insp.failedChecksCount || insp.violationsCount || 0}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/inspections/${insp.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
                          >
                            Details <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                          {insp.status === 'analyzed' && (
                            <a
                              href={getReportPdfUrl(insp.id)}
                              download={`Report-${insp.inspectionNumber}.pdf`}
                              title="Download PDF"
                              className="p-1.5 text-slate-500 hover:text-blue-600 transition"
                            >
                              <FileDown className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
