import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { checkHealth } from '../../features/system/systemSlice';
import { ShieldCheck, Activity, RefreshCw, AlertTriangle, CheckCircle2, Menu, X } from 'lucide-react';

export default function Header() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { status, latency, error } = useSelector((state) => state.system);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check health on mount only (no aggressive 15s interval to prevent mobile re-render churn)
  useEffect(() => {
    dispatch(checkHealth());
  }, [dispatch]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Dashboard', path: '/' },
    { name: 'New Inspection', path: '/inspections/new' },
    { name: 'Inspection History', path: '/inspections' },
    { name: 'Statutory Rules', path: '/rules' },
  ];

  return (
    <header className="bg-white text-slate-800 border-b border-slate-200 shadow-sm sticky top-0 z-50">
      {/* Top Bar: Official Identification (Condensed & Mobile Safe) */}
      <div className="bg-slate-900 px-3 sm:px-4 py-1.5 text-[11px] text-slate-300 flex items-center justify-between overflow-hidden">
        <div className="flex items-center space-x-2 truncate">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"></span>
          <span className="truncate">Legal Metrology Division • Govt. of India</span>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0 text-[10px]">
          <span className="font-mono text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded border border-blue-800">
            SIH26034
          </span>
          <span className="hidden sm:inline text-slate-400">Decision-Support Engine</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <Link to="/" className="flex items-center space-x-2.5 min-w-0">
              <div className="p-2 bg-blue-600 rounded-lg shadow-sm text-white flex-shrink-0">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm sm:text-base font-bold tracking-tight text-slate-900 truncate">
                  Compliance Scanner
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500 truncate hidden xs:block">
                  Packaged Commodities Rules, 2011
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Items */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Section: System Health Indicator & Mobile Menu Button */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <button
              onClick={() => dispatch(checkHealth())}
              title="Click to re-check backend connectivity"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${status === 'loading' ? 'animate-spin text-blue-500' : ''}`} />
            </button>

            {/* Health Badge */}
            <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200 text-xs">
              {status === 'loading' ? (
                <>
                  <Activity className="w-3 h-3 text-amber-500 animate-pulse" />
                  <span className="text-slate-600 text-[11px] font-medium hidden sm:inline">Checking...</span>
                </>
              ) : status === 'succeeded' ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700 text-[11px] font-medium">Connected</span>
                  {latency !== null && (
                    <span className="text-slate-400 font-mono text-[10px] hidden sm:inline">({latency}ms)</span>
                  )}
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                  <span className="text-rose-600 text-[11px] font-medium">Offline</span>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-4 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-150">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`block px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
