import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Scale,
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  FileText,
  BookOpen,
  Info,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

const CATEGORIES = [
  'ALL',
  'Entity Identification',
  'Commodity Identity',
  'Net Quantity & Units',
  'Traceability & Dates',
  'Pricing & Taxation',
  'Consumer Protection',
  'Packaging Integrity',
  'Display & Legibility',
  'Exemptions',
];

export default function RulesReference() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    fetchRules();
  }, [selectedCategory]);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const params = selectedCategory !== 'ALL' ? { category: selectedCategory } : {};
      const response = await api.get('/rules', { params });
      setRules(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch rules:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRules = rules.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.ruleCode.toLowerCase().includes(q) ||
      r.ruleReference.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      r.requirement.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
            <Scale className="w-3.5 h-3.5" />
            <span>Statutory Source of Truth</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Legal Metrology (Packaged Commodities) Rules, 2011
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Directory of statutory declarations and compliance rules configured in the automated decision-support engine, enacted under the Legal Metrology Act, 2009 (1 of 2010).
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rules by code, section, keyword..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === 'ALL' ? 'All Rule Categories' : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Rules Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">
          Loading configured Legal Metrology Rules...
        </div>
      ) : filteredRules.length === 0 ? (
        <div className="p-12 bg-white rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
          No configured statutory rules match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRules.map((rule) => {
            const isCritical = rule.severity === 'CRITICAL';
            const isManual = rule.automationStatus === 'MANUAL_VERIFICATION_REQUIRED';

            return (
              <div
                key={rule.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-4 hover:border-blue-300 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-100">
                      {rule.ruleCode}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        isCritical
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {rule.severity}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{rule.title}</h3>

                  <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <span>Statutory Citation: </span>
                    <span className="text-blue-800">{rule.ruleReference}</span>
                  </p>

                  <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-700 leading-relaxed border border-slate-100">
                    <p className="font-medium text-slate-900 mb-1">Legal Requirement:</p>
                    {rule.requirement}
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    <strong>Statutory Context:</strong> {rule.statutoryExplanation}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px]">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Engine Automation:</span>
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        isManual ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {isManual ? (
                        <>
                          <AlertTriangle className="w-3 h-3" /> Manual Verification Required
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Fully Automated OCR Check
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-start text-slate-600">
                    <span className="flex-shrink-0">Statutory Penalty:</span>
                    <span className="font-mono text-slate-800 text-right text-[10px] max-w-[280px]">
                      {rule.actSectionPenalty}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
