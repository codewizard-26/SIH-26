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
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md sticky top-0 z-50">
      {/* Top Bar: Official Identification */}
      <div className="bg-slate-950 px-4 py-1.5 border-b border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Ministry of Consumer Affairs, Food & Public Distribution | Legal Metrology Division</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50">
            SIH-2026 : SIH26034
          </span>
          <span className="text-slate-400">Decision-Support Prototype</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-inner text-white">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <Link to="/" className="text-lg font-bold tracking-tight text-white flex items-center gap-2 hover:text-indigo-200 transition">
                Packaged Commodity Compliance Scanner
              </Link>
              <p className="text-xs text-slate-400">
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
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <RefreshCw className={`w-4 h-4 ${status === 'loading' ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

            <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 text-xs">
              {status === 'loading' ? (
                <>
                  <Activity className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="text-slate-300 font-medium">Checking API...</span>
                </>
              ) : status === 'succeeded' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Backend Connected</span>
                  {latency !== null && (
                    <span className="text-slate-400 font-mono text-[10px]">({latency}ms)</span>
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
