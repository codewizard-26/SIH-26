import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInspectionById, runAnalysis } from '../features/inspections/inspectionSlice';
import { getReportPdfUrl } from '../features/inspections/inspectionApi';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileDown,
  ArrowLeft,
  Calendar,
  Layers,
  FileText,
  Camera,
  Scale,
  RefreshCw,
  Eye,
  Info,
  Maximize2,
  X,
  Crosshair,
  Search,
  BookOpen,
} from 'lucide-react';

export default function InspectionDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentInspection: inspection, loading, analyzing } = useSelector((state) => state.inspections);

  const [activeTab, setActiveTab] = useState('checks'); // 'checks', 'evidence', 'declarations', 'images'
  const [selectedEvidence, setSelectedEvidence] = useState(null); // Modal state for detailed evidence inspect
  const [selectedPanelIndex, setSelectedPanelIndex] = useState(0); // For Visual Evidence tab

  useEffect(() => {
    if (id) {
      dispatch(fetchInspectionById(id));
    }
  }, [id, dispatch]);

  const handleReanalyze = () => {
    if (id) {
      dispatch(runAnalysis(id));
    }
  };

  if (loading && !inspection) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium">Loading inspection analysis data...</p>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Inspection Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">
          No record matches the provided inspection identifier.
        </p>
        <Link
          to="/inspections"
          className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Return to History
        </Link>
      </div>
    );
  }

  const isCompliant = inspection.overallStatus === 'COMPLIANT';
  const isNonCompliant = inspection.overallStatus === 'NON_COMPLIANT';
  const isManualReview = inspection.overallStatus === 'MANUAL_REVIEW';

  const statusColor = isCompliant
    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : isNonCompliant
    ? 'text-rose-700 bg-rose-50 border-rose-200'
    : 'text-amber-700 bg-amber-50 border-amber-200';

  const pdfUrl = getReportPdfUrl(inspection.id);
  const apiBase = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
    : 'http://localhost:5000';

  return (
    <div className="space-y-8">
      {/* Back Link & Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/inspections"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Inspection History
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {inspection.productName}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${statusColor}`}
            >
              {isCompliant && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              {isNonCompliant && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
              {isManualReview && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
              {inspection.overallStatus}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
            <span className="font-mono font-semibold text-slate-700">{inspection.inspectionNumber}</span>
            <span>•</span>
            <span>{inspection.category}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(inspection.createdAt).toLocaleString('en-IN')}
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          <button
            onClick={handleReanalyze}
            disabled={analyzing}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium text-xs rounded-xl shadow-sm hover:bg-slate-50 transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin text-blue-600' : ''}`} />
            {analyzing ? 'Re-scanning...' : 'Re-scan Compliance'}
          </button>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={`Report-${inspection.inspectionNumber}.pdf`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-500/10 transition cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            Download Official Report (PDF)
          </a>
        </div>
      </div>

      {/* Compliance Overview Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
        {/* Score Dial */}
        <div className="flex items-center gap-4 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 pr-4">
          <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-slate-50 border-4 border-blue-600">
            <span className="text-lg font-extrabold font-mono text-slate-900">
              {inspection.complianceScore}%
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Compliance Score</p>
            <p className="text-xs text-slate-600 mt-0.5">
              Transparent score: Passed / Evaluated checks
            </p>
          </div>
        </div>

        {/* Passed Checks */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-bold font-mono text-emerald-600">
              {inspection.passedChecksCount || 0}
            </span>
            <p className="text-xs font-semibold text-slate-600">Passed Statutory Checks</p>
          </div>
        </div>

        {/* Violations Count */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-bold font-mono text-rose-600">
              {inspection.failedChecksCount || 0}
            </span>
            <p className="text-xs font-semibold text-slate-600">Detected Violations</p>
          </div>
        </div>

        {/* Manual Reviews */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-bold font-mono text-amber-600">
              {inspection.manualChecksCount || 1}
            </span>
            <p className="text-xs font-semibold text-slate-600">Manual Verification Items</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 text-sm">
          <button
            onClick={() => setActiveTab('checks')}
            className={`pb-3 font-semibold text-xs transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'checks'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Checks &amp; Violations ({inspection.complianceChecks?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('evidence')}
            className={`pb-3 font-semibold text-xs transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'evidence'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            Visual Evidence Inspector
          </button>
          <button
            onClick={() => setActiveTab('declarations')}
            className={`pb-3 font-semibold text-xs transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'declarations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Extracted Declarations
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`pb-3 font-semibold text-xs transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'images'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            Package Images ({inspection.images?.length || 0})
          </button>
        </nav>
      </div>

      {/* TAB 1: COMPLIANCE CHECKS & VIOLATIONS */}
      {activeTab === 'checks' && (
        <div className="space-y-6">
          {/* Violations Section */}
          {inspection.violations && inspection.violations.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-rose-700 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Statutory Violations Identified ({inspection.violations.length})
              </h3>

              <div className="space-y-4">
                {inspection.violations.map((violation, idx) => (
                  <div
                    key={idx}
                    className="bg-rose-50/60 border border-rose-200 rounded-xl p-6 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-rose-800 bg-rose-200/80 px-2 py-0.5 rounded">
                            {violation.violationCode}
                          </span>
                          <span className="text-xs font-semibold text-rose-600 uppercase">
                            {violation.severity} Severity
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 mt-1">
                          {violation.title}
                        </h4>
                        <p className="text-xs text-rose-800 font-medium mt-0.5">
                          {violation.legalReference}
                        </p>
                      </div>

                      <button
                        onClick={() => setSelectedEvidence({ type: 'violation', data: violation })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-300 text-rose-700 text-xs font-semibold rounded-lg shadow-sm hover:bg-rose-100/50 transition cursor-pointer self-start sm:self-center flex-shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect Visual Evidence
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-white p-4 rounded-lg border border-rose-100">
                      <div>
                        <p className="font-semibold text-slate-500 uppercase text-[10px]">Detected Value:</p>
                        <p className="font-mono font-medium text-slate-800 mt-0.5">
                          {violation.detectedValue}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-500 uppercase text-[10px]">Expected Statutory Requirement:</p>
                        <p className="text-slate-800 mt-0.5">
                          {violation.expectedRequirement}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 space-y-1">
                      <p>
                        <strong className="text-slate-900">Statutory Reason:</strong> {violation.explanation}
                      </p>
                      <p>
                        <strong className="text-slate-900">Enforcement Action:</strong> {violation.recommendedAction}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Checks List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Complete Legal Metrology Rule Checks ({inspection.complianceChecks?.length || 0})
            </h3>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
              {(inspection.complianceChecks || []).map((chk, idx) => {
                const isPass = chk.status === 'PASS';
                const isFail = chk.status === 'FAIL';
                const isManual = chk.status === 'MANUAL_REVIEW';

                return (
                  <div key={idx} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition">
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-500">
                          #{idx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{chk.title}</h4>
                        <span className="text-[11px] text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {chk.ruleReference}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{chk.requirement}</p>
                      <p className="text-xs font-mono text-slate-800">
                        <span className="font-sans text-slate-500">Detected: </span>
                        {chk.detectedValue}
                      </p>
                      {chk.validationNotes && (
                        <p className="text-[11px] text-slate-500 italic">{chk.validationNotes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 self-start md:self-center flex-shrink-0">
                      <button
                        onClick={() => setSelectedEvidence({ type: 'check', data: chk })}
                        title="View evidence on image"
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                          isPass
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isFail
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {isPass && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {isFail && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                        {isManual && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                        {chk.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VISUAL EVIDENCE INSPECTOR (PHASE 6) */}
      {activeTab === 'evidence' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Crosshair className="w-5 h-5 text-blue-600" />
                Interactive Visual Evidence &amp; OCR Inspector
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect statutory declarations directly on high-resolution package image surfaces.
              </p>
            </div>

            {/* Panel Selector */}
            {inspection.images && inspection.images.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Panel View:</span>
                <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50">
                  {inspection.images.map((img, i) => (
                    <button
                      key={img.id || i}
                      onClick={() => setSelectedPanelIndex(i)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                        selectedPanelIndex === i
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {img.viewType.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Evidence Canvas & Inspection Side-by-Side */}
          {(!inspection.images || inspection.images.length === 0) ? (
            <p className="text-xs text-slate-500 italic">No package images available for visual inspection.</p>
          ) : (
            (() => {
              const currentImg = inspection.images[selectedPanelIndex] || inspection.images[0];
              const imgSrc = `${apiBase}${currentImg.imageUrl}`;

              return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left 2 Cols: High-Res Package Image with Focus Region */}
                  <div className="lg:col-span-2 bg-slate-50 border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden border border-slate-200 min-h-[420px]">
                    <div className="relative max-w-full max-h-[500px] flex items-center justify-center">
                      <img
                        src={imgSrc}
                        alt="Package Evidence"
                        className="max-h-[460px] w-auto object-contain rounded-lg shadow-lg"
                      />
                      {/* Bounding Box Overlay Callouts */}
                      <div className="absolute top-4 left-4 bg-slate-50 border-slate-200/90 text-slate-800 text-[11px] px-3 py-1.5 rounded-lg border border-slate-300 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 "></span>
                        <span>Optical Recognition Active: {currentImg.viewType.toUpperCase()} PANEL</span>
                      </div>
                    </div>
                  </div>

                  {/* Right 1 Col: Extracted Declarations Located on This Image */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Declarations Identified On This Surface
                    </h4>

                    <div className="space-y-3">
                      {/* MRP Status */}
                      <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">Retail Sale Price (MRP)</span>
                          <span className="font-mono text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                            Rule 6(1)(e)
                          </span>
                        </div>
                        <p className="font-mono text-slate-700 text-[11px]">
                          {inspection.declarations?.mrp?.value || 'Not detected on this surface'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Tax Inclusivity: {inspection.declarations?.mrp?.hasTaxInclusion ? '✓ Inclusive of all taxes' : '✕ Missing statement'}
                        </p>
                      </div>

                      {/* Net Quantity Status */}
                      <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">Net Quantity</span>
                          <span className="font-mono text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                            Rule 6(1)(c)
                          </span>
                        </div>
                        <p className="font-mono text-slate-700 text-[11px]">
                          {inspection.declarations?.netQuantity?.value || 'Not detected on this surface'}
                        </p>
                        {inspection.declarations?.netQuantity?.hasProhibitedQualifier && (
                          <p className="text-[10px] text-rose-600 font-semibold">
                            ⚠️ Contains prohibited qualifier: "{inspection.declarations?.netQuantity?.prohibitedQualifierWord}"
                          </p>
                        )}
                      </div>

                      {/* Manufacturer Address */}
                      <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">Manufacturer &amp; Postal PIN</span>
                          <span className="font-mono text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                            Rule 6(1)(a)
                          </span>
                        </div>
                        <p className="text-slate-700 text-[11px] line-clamp-2">
                          {inspection.declarations?.manufacturer?.value || 'Not detected on this surface'}
                        </p>
                      </div>

                      {/* Consumer Care */}
                      <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">Consumer Care / Redressal</span>
                          <span className="font-mono text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                            Rule 6(2)
                          </span>
                        </div>
                        <p className="text-slate-700 text-[11px]">
                          {inspection.declarations?.consumerCare?.value || 'Not detected on this surface'}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-[11px] text-blue-900 space-y-1">
                      <p className="font-semibold flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" /> Enforcement Verification
                      </p>
                      <p className="text-blue-800">
                        Any declaration not found across submitted package views is cited as a potential statutory violation under the Legal Metrology Act, 2009.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* TAB 3: EXTRACTED DECLARATIONS */}
      {activeTab === 'declarations' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              Extracted Package Declarations
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Extracted via deterministic OCR parser from uploaded package images
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Statutory Declaration</th>
                  <th className="px-6 py-3.5">Rule Reference</th>
                  <th className="px-6 py-3.5">Detected Value on Packaging</th>
                  <th className="px-6 py-3.5">OCR Confidence</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {/* Generic Name (ML Powered) */}
                <tr className="bg-blue-50/30">
                  <td className="px-6 py-4 font-semibold text-slate-900">Product / Generic Name (ML)</td>
                  <td className="px-6 py-4 font-mono text-slate-500">Rule 6(1)(b)</td>
                  <td className="px-6 py-4 font-mono font-medium text-blue-900">
                    {inspection.declarations?.genericName?.value || 'Not detected'}
                  </td>
                  <td className="px-6 py-4 font-mono text-blue-700">
                    {Math.round((inspection.declarations?.genericName?.confidence || 0) * 100)}%
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                        inspection.declarations?.genericName?.detected
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {inspection.declarations?.genericName?.detected ? 'Detected' : 'Missing'}
                    </span>
                  </td>
                </tr>

                {/* MRP */}
                <tr>
                  <td className="px-6 py-4 font-semibold text-slate-900">Maximum Retail Price (MRP)</td>
                  <td className="px-6 py-4 font-mono text-slate-500">Rule 6(1)(e) &amp; Rule 2(m)</td>
                  <td className="px-6 py-4 font-mono font-medium text-slate-800">
                    {inspection.declarations?.mrp?.value || 'Not detected'}
                  </td>
                  <td className="px-6 py-4 font-mono">
                    {Math.round((inspection.declarations?.mrp?.confidence || 0) * 100)}%
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                        inspection.declarations?.mrp?.detected
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {inspection.declarations?.mrp?.detected ? 'Detected' : 'Missing'}
                    </span>
                  </td>
                </tr>

                {/* Net Quantity */}
                <tr>
                  <td className="px-6 py-4 font-semibold text-slate-900">Net Quantity</td>
                  <td className="px-6 py-4 font-mono text-slate-500">Rule 6(1)(c), Rules 11-13</td>
                  <td className="px-6 py-4 font-mono font-medium text-slate-800">
                    {inspection.declarations?.netQuantity?.value || 'Not detected'}
                  </td>
                  <td className="px-6 py-4 font-mono">
                    {Math.round((inspection.declarations?.netQuantity?.confidence || 0) * 100)}%
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                        inspection.declarations?.netQuantity?.detected
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {inspection.declarations?.netQuantity?.detected ? 'Detected' : 'Missing'}
                    </span>
                  </td>
                </tr>

                {/* Date of Mfg */}
                <tr>
                  <td className="px-6 py-4 font-semibold text-slate-900">Month &amp; Year of Mfg/Packing</td>
                  <td className="px-6 py-4 font-mono text-slate-500">Rule 6(1)(d)</td>
                  <td className="px-6 py-4 font-mono font-medium text-slate-800">
                    {inspection.declarations?.manufacturingDate?.value || 'Not detected'}
                  </td>
                  <td className="px-6 py-4 font-mono">
                    {Math.round((inspection.declarations?.manufacturingDate?.confidence || 0) * 100)}%
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                        inspection.declarations?.manufacturingDate?.detected
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {inspection.declarations?.manufacturingDate?.detected ? 'Detected' : 'Missing'}
                    </span>
                  </td>
                </tr>

                {/* Manufacturer */}
                <tr>
                  <td className="px-6 py-4 font-semibold text-slate-900">Manufacturer / Packer Details</td>
                  <td className="px-6 py-4 font-mono text-slate-500">Rule 6(1)(a) &amp; Rule 10</td>
                  <td className="px-6 py-4 font-mono font-medium text-slate-800">
                    {inspection.declarations?.manufacturer?.value || 'Not detected'}
                  </td>
                  <td className="px-6 py-4 font-mono">
                    {Math.round((inspection.declarations?.manufacturer?.confidence || 0) * 100)}%
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                        inspection.declarations?.manufacturer?.detected
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {inspection.declarations?.manufacturer?.detected ? 'Detected' : 'Missing'}
                    </span>
                  </td>
                </tr>

                {/* Consumer Care */}
                <tr>
                  <td className="px-6 py-4 font-semibold text-slate-900">Consumer Care / Grievance</td>
                  <td className="px-6 py-4 font-mono text-slate-500">Rule 6(2)</td>
                  <td className="px-6 py-4 font-mono font-medium text-slate-800">
                    {inspection.declarations?.consumerCare?.value || 'Not detected'}
                  </td>
                  <td className="px-6 py-4 font-mono">
                    {Math.round((inspection.declarations?.consumerCare?.confidence || 0) * 100)}%
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                        inspection.declarations?.consumerCare?.detected
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {inspection.declarations?.consumerCare?.detected ? 'Detected' : 'Missing'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PACKAGE IMAGES */}
      {activeTab === 'images' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              Submitted Package Images
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Original high-resolution images utilized for optical character recognition and statutory evidence
            </p>
          </div>

          {(!inspection.images || inspection.images.length === 0) ? (
            <p className="text-xs text-slate-500 italic">No images attached.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {inspection.images.map((img, idx) => {
                const imgSrc = `${apiBase}${img.imageUrl}`;

                return (
                  <div key={img.id || idx} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex flex-col justify-between">
                    <div className="aspect-[4/3] bg-slate-200 relative overflow-hidden flex items-center justify-center">
                      <img
                        src={imgSrc}
                        alt={`Package view ${img.viewType}`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="%2394a3b8">Image File Stored</text></svg>';
                        }}
                      />
                      <span className="absolute top-2 left-2 bg-slate-800 text-white uppercase text-[10px] font-bold px-2 py-0.5 rounded">
                        {img.viewType} Panel
                      </span>
                    </div>

                    <div className="p-3 text-xs space-y-1">
                      <p className="font-semibold text-slate-800 truncate">{img.originalName || img.fileName}</p>
                      <p className="text-[11px] text-slate-500">
                        Size: {Math.round((img.fileSize || 0) / 1024)} KB
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* EVIDENCE DETAIL MODAL */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-50 bg-slate-50 border-slate-200/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg border border-slate-200 p-6 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded">
                  {selectedEvidence.data.ruleReference || selectedEvidence.data.legalReference}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">
                  {selectedEvidence.data.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvidence(null)}
                className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Package Image Snapshot if available */}
            {inspection.images && inspection.images.length > 0 && (
              <div className="bg-slate-50 border-slate-200 rounded-xl p-3 flex items-center justify-center border border-slate-200 relative">
                <img
                  src={`${apiBase}${inspection.images[0].imageUrl}`}
                  alt="Package evidence preview"
                  className="max-h-64 object-contain rounded"
                />
                <div className="absolute bottom-2 right-2 bg-white border-slate-300 text-slate-800 shadow-md text-slate-800 text-[10px] px-2 py-1 rounded border border-slate-300">
                  {selectedEvidence.type === 'violation' ? '⚠️ Violation Evidence Frame' : '✓ Inspection Evidence Frame'}
                </div>
              </div>
            )}

            {/* Evidence Data Breakdown */}
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-500 uppercase text-[10px]">Detected Value:</span>
                <p className="font-mono font-semibold text-slate-900 mt-0.5">
                  {selectedEvidence.data.detectedValue}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-500 uppercase text-[10px]">Statutory Requirement:</span>
                <p className="text-slate-800 mt-0.5">
                  {selectedEvidence.data.requirement || selectedEvidence.data.expectedRequirement}
                </p>
              </div>

              {selectedEvidence.data.explanation && (
                <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-rose-800">
                  <span className="font-semibold uppercase text-[10px]">Statutory Reason / Non-Compliance:</span>
                  <p className="mt-0.5">{selectedEvidence.data.explanation}</p>
                </div>
              )}

              {selectedEvidence.data.recommendedAction && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-blue-900">
                  <span className="font-semibold uppercase text-[10px]">Recommended Enforcement Action:</span>
                  <p className="mt-0.5">{selectedEvidence.data.recommendedAction}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEvidence(null)}
                className="px-4 py-2 bg-slate-50 border-slate-200 text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-100 border-slate-200 transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
