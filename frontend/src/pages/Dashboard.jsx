import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { checkHealth } from '../features/system/systemSlice';
import {
  ShieldCheck,
  Server,
  Database,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  FileText,
  Camera,
  Layers,
  Sparkles,
  ArrowRight,
  Clock,
  BookOpen
} from 'lucide-react';

export default function Dashboard() {
  const dispatch = useDispatch();
  const { status, healthData, latency, error, lastChecked } = useSelector((state) => state.system);

  const isConnected = status === 'succeeded';

  return (
    <div className="space-y-8">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-8 text-white shadow-xl border border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <span>Smart India Hackathon 2026</span>
              <span>•</span>
              <span className="font-mono">PS: SIH26034</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              AI-Powered Packaged Commodity Compliance Scanner
            </h1>
            <p className="text-slate-300 max-w-3xl text-sm sm:text-base leading-relaxed">
              Automated decision-support and inspection system to verify packaged commodity labeling compliance under the statutory requirements of <strong className="text-white">The Legal Metrology (Packaged Commodities) Rules, 2011</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 self-start md:self-center">
            <button
              onClick={() => dispatch(checkHealth())}
              disabled={status === 'loading'}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${status === 'loading' ? 'animate-spin' : ''}`} />
              Test API Health
            </button>
          </div>
        </div>
      </div>

      {/* Phase 0 System Verification & Connectivity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Backend API Connection Status */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Backend Communication
              </p>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                {status === 'loading' ? 'Connecting...' : isConnected ? 'API Connected' : 'Disconnected'}
              </h3>
            </div>
            <div
              className={`p-3 rounded-xl ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-600'
                  : status === 'loading'
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              <Server className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Status:</span>
              <span className="font-semibold flex items-center gap-1">
                {isConnected ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> 200 OK
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Failed
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Roundtrip Latency:</span>
              <span className="font-mono font-medium text-slate-800">
                {latency !== null ? `${latency} ms` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Base URL:</span>
              <span className="font-mono text-slate-800 text-[11px] truncate max-w-[170px]" title={import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}>
                {import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}
              </span>
            </div>
          </div>
        </div>

        {/* Database & ORM Status */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Persistence Layer
              </p>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                PostgreSQL &amp; Drizzle
              </h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Database className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Database Status:</span>
              <span className="font-semibold font-mono text-slate-800">
                {healthData?.database || 'Standby / Local'}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Entities Configured:</span>
              <span className="font-medium text-slate-800">9 Relational Tables</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Schema Migrations:</span>
              <span className="text-slate-500 italic">Direct Drizzle Defs</span>
            </div>
          </div>
        </div>

        {/* Legal Metrology Rules Status */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Statutory Reference
              </p>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                PCR 2011 Rules Engine
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Core Rules Mapped:</span>
              <span className="font-semibold text-emerald-700">Rules 6–13, Table I/II</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Confidence Threshold:</span>
              <span className="font-medium text-slate-800">Deterministic + OCR NER</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Font Size Verification:</span>
              <span className="text-amber-700 font-medium">Manual Verification Required</span>
            </div>
          </div>
        </div>
      </div>

      {/* Raw Health API Response (Verification Proof) */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            <h2 className="text-base font-bold text-slate-900">
              GET /api/health Response (Axios ↔ Express Proof)
            </h2>
          </div>
          {lastChecked && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Last polled: {new Date(lastChecked).toLocaleTimeString()}
            </span>
          )}
        </div>

        {status === 'loading' && (
          <div className="p-4 bg-slate-50 rounded-lg text-slate-500 text-sm animate-pulse">
            Querying backend health endpoint via central Axios client...
          </div>
        )}

        {status === 'succeeded' && healthData && (
          <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-lg overflow-x-auto border border-slate-800 shadow-inner">
            {JSON.stringify(healthData, null, 2)}
          </pre>
        )}

        {status === 'failed' && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Backend Communication Failed</p>
              <p className="text-xs mt-1 text-rose-600">{error}</p>
              <p className="text-xs mt-2 text-slate-500">
                Ensure backend server is running on port 5000 (<code>npm run dev</code> inside <code>backend/</code>).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Architecture & Pipeline Overview */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Inspection &amp; Compliance Pipeline Flow</h2>
          <p className="text-xs text-slate-500 mt-1">
            End-to-end data processing lifecycle from raw package capture to official PDF compliance reporting.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-center">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center">
            <div className="p-3 bg-indigo-100 text-indigo-700 rounded-lg mb-2">
              <Camera className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-800">1. Multi-Image Upload</p>
            <p className="text-[11px] text-slate-500 mt-1">Front, Back, Sides with Multer</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-lg mb-2">
              <Layers className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-800">2. OCR &amp; Vision</p>
            <p className="text-[11px] text-slate-500 mt-1">Google Vision / Mock Provider</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center">
            <div className="p-3 bg-purple-100 text-purple-700 rounded-lg mb-2">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-800">3. Extraction</p>
            <p className="text-[11px] text-slate-500 mt-1">Deterministic Regex Parser</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg mb-2">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-800">4. Rules Engine</p>
            <p className="text-[11px] text-slate-500 mt-1">Legal Metrology Rules 2011</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-lg mb-2">
              <BookOpen className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-800">5. Evidence Mapping</p>
            <p className="text-[11px] text-slate-500 mt-1">Bounding Boxes &amp; Citations</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center">
            <div className="p-3 bg-rose-100 text-rose-700 rounded-lg mb-2">
              <FileText className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-800">6. Official Report</p>
            <p className="text-[11px] text-slate-500 mt-1">Downloadable PDF Inspection</p>
          </div>
        </div>
      </div>

      {/* Phase Roadmap Status */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Project Development Phases</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg border-2 border-emerald-500 bg-emerald-50/50">
            <div className="flex items-center justify-between font-bold text-emerald-900 mb-1">
              <span>Phase 0: Project Foundation</span>
              <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] uppercase">Active</span>
            </div>
            <p className="text-emerald-800">Express, Vite, React Router, Redux Toolkit, Axios, Tailwind, Drizzle schema, /api/health.</p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
            <div className="font-semibold text-slate-800 mb-1">Phase 1: Products &amp; Inspections</div>
            <p className="text-slate-500">Products &amp; inspections CRUD, lifecycle status, Drizzle queries, Zod validation.</p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
            <div className="font-semibold text-slate-800 mb-1">Phase 2: Multi-View Image Upload</div>
            <p className="text-slate-500">Multer local storage, preview, front/back/side labeling, image records.</p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
            <div className="font-semibold text-slate-800 mb-1">Phase 3: OCR Provider Layer</div>
            <p className="text-slate-500">Google Cloud Vision + Mock Vision provider adapter, OCR text &amp; bounding boxes.</p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
            <div className="font-semibold text-slate-800 mb-1">Phase 4: Declaration Extraction</div>
            <p className="text-slate-500">Regex/NER parsing: Manufacturer, MRP, Net Quantity, Mfg Date, Consumer Care.</p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
            <div className="font-semibold text-slate-800 mb-1">Phase 5: Compliance Engine</div>
            <p className="text-slate-500">Rules 6-13, PASS/FAIL/MANUAL_REVIEW, scoring formula, rule code citations.</p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
            <div className="font-semibold text-slate-800 mb-1">Phase 6: Evidence &amp; Explanation</div>
            <p className="text-slate-500">Bounding boxes on images, violation cards with statutory explanation.</p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
            <div className="font-semibold text-slate-800 mb-1">Phase 7: Official PDF Report</div>
            <p className="text-slate-500">Multi-page government-standard PDF report generator with executive summary.</p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
            <div className="font-semibold text-slate-800 mb-1">Phase 8-9: Polish &amp; SIH Demo</div>
            <p className="text-slate-500">Inspection history, search/filter, preloaded test commodities, live demo flows.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
