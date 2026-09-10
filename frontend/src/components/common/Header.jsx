import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { checkHealth } from '../../features/system/systemSlice';
import { ShieldCheck, Activity, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function Header() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { status, latency, error } = useSelector((state) => state.system);

  useEffect(() => {
    dispatch(checkHealth());
    const interval = setInterval(() => {
      dispatch(checkHealth());
    }, 15000); // Poll health every 15s
    return () => clearInterval(interval);
  }, [dispatch]);

  const navLinks = [
    { name: 'Dashboard', path: '/' },
    { name: 'New Inspection', path: '/inspections/new' },
    { name: 'Inspection History', path: '/inspections' },
    { name: 'Statutory Rules', path: '/rules' },
  ];

  return (
    <header className="bg-slate-50 border-slate-200 text-slate-800 border-b border-slate-200 shadow-md sticky top-0 z-50">
      {/* Top Bar: Official Identification */}
      <div className="bg-slate-950 px-4 py-1.5 border-b border-slate-200 text-xs text-slate-500 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 "></span>
          <span>Ministry of Consumer Affairs, Food & Public Distribution | Legal Metrology Division</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="font-mono text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/50">
            SIH-2026 : SIH26034
          </span>
          <span className="text-slate-500">Decision-Support Prototype</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-inner text-white">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <Link to="/" className="text-lg font-bold tracking-tight text-slate-800 flex items-center gap-2 hover:text-blue-200 transition">
                Packaged Commodity Compliance Scanner
              </Link>
              <p className="text-xs text-slate-500">
                The Legal Metrology (Packaged Commodities) Rules, 2011
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex space-x-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive
                      ? 'bg-slate-100 border-slate-200 text-slate-800 border border-slate-300'
                      : 'text-slate-600 hover:bg-slate-100 border-slate-200 hover:text-slate-800'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* System Health Status Indicator */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => dispatch(checkHealth())}
              title="Click to re-check backend connectivity"
              className="p-1.5 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-slate-200 transition"
            >
              <RefreshCw className={`w-4 h-4 ${status === 'loading' ? 'animate-spin text-blue-400' : ''}`} />
            </button>

            <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border border-slate-300 text-xs">
              {status === 'loading' ? (
                <>
                  <Activity className="w-3.5 h-3.5 text-amber-400 " />
                  <span className="text-slate-600 font-medium">Checking API...</span>
                </>
              ) : status === 'succeeded' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Backend Connected</span>
                  {latency !== null && (
                    <span className="text-slate-500 font-mono text-[10px]">({latency}ms)</span>
                  )}
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-400 font-medium">API Disconnected</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
