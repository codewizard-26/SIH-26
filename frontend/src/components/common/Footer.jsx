import React from 'react';
import { Scale, Info } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-6 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Scale className="w-4 h-4 text-blue-600" />
          <span>
            <strong>Legal Metrology Act, 2009</strong> &amp; <strong>The Legal Metrology (Packaged Commodities) Rules, 2011</strong>
          </span>
        </div>
        <div className="flex items-center space-x-2 text-slate-500">
          <Info className="w-3.5 h-3.5" />
          <span>
            Decision-Support Inspection System. Analysis results are advisory and support statutory verification.
          </span>
        </div>
      </div>
    </footer>
  );
}
