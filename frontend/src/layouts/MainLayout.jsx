import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { LayoutDashboard, PlusCircle, History, Scale } from 'lucide-react';

export default function MainLayout() {
  const location = useLocation();

  const mobileNavItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'New Scan', path: '/inspections/new', icon: PlusCircle, highlight: true },
    { label: 'History', path: '/inspections', icon: History },
    { label: 'Rules', path: '/rules', icon: Scale },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 pb-[80px] md:pb-0">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Outlet />
      </main>
      <Footer />

      {/* Mobile Bottom Navigation Bar (Field App Experience) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-1.5 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            if (item.highlight) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center -mt-5 group"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-blue-500/40 scale-105'
                      : 'bg-blue-600 text-white shadow-blue-500/30 group-active:scale-95'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 mt-1">
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center py-1 px-3 rounded-lg transition min-w-[56px] ${
                  isActive ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
