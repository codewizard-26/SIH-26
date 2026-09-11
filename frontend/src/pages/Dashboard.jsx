import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchDashboardMetrics } from '../features/inspections/inspectionSlice';
import { checkHealth } from '../features/system/systemSlice';
import {
  ShieldCheck,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  ArrowRight,
  TrendingUp,
  Scale,
  RefreshCw,
} from 'lucide-react';

export default function Dashboard() {
  const dispatch = useDispatch();
  const { metrics, loading } = useSelector((state) => state.inspections);
  const { status: healthStatus } = useSelector((state) => state.system);

  useEffect(() => {
    dispatch(fetchDashboardMetrics());
  }, [dispatch]);

  const total = metrics?.totalInspections || 0;
  const compliant = metrics?.compliantCount || 0;
  const nonCompliant = metrics?.nonCompliantCount || 0;
  const manualReview = metrics?.manualReviewCount || 0;
  const rate = metrics?.complianceRate || 0;
  const recent = metrics?.recentInspections || [];
  const violationCategories = metrics?.violationCategories || [];

  return (
    <div className="space-y-8">
      {/* Top Banner / Hero */}
      <div className="bg-blue-50 rounded-2xl p-8 text-slate-800 shadow-sm border border-blue-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-800 border border-blue-500/30">
              <Scale className="w-3.5 h-3.5" />
              <span>Smart India Hackathon 2026</span>
              <span>•</span>
              <span className="font-mono">SIH26034</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
              Packaged Commodity Compliance Scanner
            </h1>
            <p className="text-slate-600 max-w-2xl text-sm sm:text-base leading-relaxed">
              Automated decision-support system verifying statutory packaging declarations under <strong className="text-slate-800">The Legal Metrology (Packaged Commodities) Rules, 2011</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 self-start md:self-center">
            <Link
              to="/inspections/new"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/10 transition transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-5 h-5" />
              Start New Inspection
            </Link>
            <button
              onClick={() => {
                dispatch(fetchDashboardMetrics());
                dispatch(checkHealth());
              }}
              title="Refresh live metrics"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-xl border border-slate-300 transition shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Card 1: Total Inspections */}
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Inspections</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-2 font-mono">{total}</h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Dynamic system records
            </p>
          </div>
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
            <FileText className="w-7 h-7" />
          </div>
        </div>

        {/* Card 2: Compliant Products */}
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Compliant Products</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-2 font-mono">{compliant}</h3>
            <p className="text-xs text-slate-500 mt-1">
              {rate}% compliance rate
            </p>
          </div>
          <div className="p-2.5 sm:p-3.5 bg-emerald-50 text-emerald-600 rounded-xl flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
        </div>

        {/* Card 3: Non-Compliant Products */}
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Non-Compliant</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-rose-600 mt-2 font-mono">{nonCompliant}</h3>
            <p className="text-xs text-slate-500 mt-1">
              Violations detected
            </p>
          </div>
          <div className="p-2.5 sm:p-3.5 bg-rose-50 text-rose-600 rounded-xl flex-shrink-0">
            <XCircle className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
        </div>

        {/* Card 4: Manual Review Required */}
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Manual Review</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-amber-600 mt-2 font-mono">{manualReview}</h3>
            <p className="text-xs text-slate-500 mt-1">
              Font inspection
            </p>
          </div>
          <div className="p-2.5 sm:p-3.5 bg-amber-50 text-amber-600 rounded-xl flex-shrink-0">
            <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
        </div>
      </div>

      {/* Main Content Grid: Recent Inspections & Common Violation Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Inspections Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Inspections</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time record of inspected packaged commodities
              </p>
            </div>
            <Link
              to="/inspections"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View Full History <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700">No inspections recorded yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Start your first compliance inspection by uploading package images and running the legal metrology rule scanner.
              </p>
              <Link
                to="/inspections/new"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
              >
                <PlusCircle className="w-4 h-4" /> Create First Inspection
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Inspection ID</th>
                    <th className="px-5 py-3.5">Product &amp; Category</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Score</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recent.map((insp) => {
                    const isPass = insp.overallStatus === 'COMPLIANT';
                    const isFail = insp.overallStatus === 'NON_COMPLIANT';
                    const isManual = insp.overallStatus === 'MANUAL_REVIEW';

                    return (
                      <tr key={insp.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">
                          {insp.inspectionNumber}
                          <span className="block text-[10px] text-slate-500 font-sans mt-0.5">
                            {new Date(insp.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-900">{insp.productName}</p>
                          <p className="text-[11px] text-slate-500">{insp.category}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              isPass
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isFail
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : isManual
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {isPass && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {isFail && <XCircle className="w-3 h-3 text-rose-600" />}
                            {isManual && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                            {insp.overallStatus}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                          {insp.complianceScore}%
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            to={`/inspections/${insp.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
                          >
                            View Details <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 1 Col: Violation Categories Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Common Violation Categories</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Aggregated from Legal Metrology statutory checks
            </p>
          </div>

          <div className="space-y-4">
            {violationCategories.map((vc, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span className="truncate max-w-[200px]" title={vc.category}>
                    {vc.category}
                  </span>
                  <span className="font-mono text-slate-500">
                    {vc.count} ({vc.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(5, vc.percentage))}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Statutory Basis
            </p>
            <p className="text-[11px] leading-relaxed">
              Rules 6(1)(a-e), Rule 6(2), and Rule 12(6) of PCR 2011 mandate conspicuous declaration of Manufacturer, MRP, Net Quantity, Date, and Consumer Grievance redressal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
