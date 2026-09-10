import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createInspection, uploadImages, runAnalysis } from '../features/inspections/inspectionSlice';
import api from '../services/api';
import {
  Upload,
  Camera,
  Trash2,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Loader2,
  Tag,
  ArrowRight,
  Plus,
  Image as ImageIcon,
} from 'lucide-react';

const CATEGORIES = [
  'Food & Beverages',
  'Cosmetics & Personal Care',
  'Electronics & Electrical',
  'Chemicals & Detergents',
  'Textiles & Apparel',
  'General Packaged Commodity',
];

const VIEW_OPTIONS = [
  { value: 'front', label: 'Front Display Panel (Principal Display Panel)' },
  { value: 'back', label: 'Back Panel (Declarations / Nutrition / MRP)' },
  { value: 'side', label: 'Side Panel (Manufacturing / Consumer Care)' },
  { value: 'evidence', label: 'Close-up / Additional Evidence' },
];

export default function NewInspection() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    productName: '',
    category: CATEGORIES[0],
    brand: '',
    manufacturerName: '',
    inspectorName: 'Inspector (Legal Metrology HQ)',
    notes: '',
  });

  // Selected image files with assigned view types and preview URLs
  const [images, setImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentStep, setCurrentStep] = useState(''); // 'creating', 'uploading', 'analyzing'
  const [formError, setFormError] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFiles = (fileList) => {
    const selectedFiles = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (selectedFiles.length === 0) return;

    const newImages = selectedFiles.map((file, idx) => {
      // Auto-assign view based on existing count
      const totalSoFar = images.length + idx;
      let defaultView = 'front';
      if (totalSoFar === 1) defaultView = 'back';
      else if (totalSoFar >= 2) defaultView = 'side';

      return {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        viewType: defaultView,
        previewUrl: URL.createObjectURL(file),
      };
    });

    setImages((prev) => [...prev, ...newImages]);
    setFormError(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      e.target.value = ''; // Reset input so same file can be re-selected if needed
    }
  };

  const handleRemoveImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleViewTypeChange = (id, newViewType) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, viewType: newViewType } : img))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) {
      setFormError('Please upload at least one image of the product packaging (Front or Back).');
      return;
    }

    setIsProcessing(true);
    setFormError(null);

    try {
      // Step 1: Create Inspection record
      setCurrentStep('Initializing statutory inspection record...');
      const created = await dispatch(createInspection(formData)).unwrap();
      const inspectionId = created.id;

      // Step 2: Upload multiple package images with view metadata
      setCurrentStep(`Uploading ${images.length} package image(s)...`);
      const imageFormData = new FormData();
      const viewTypes = [];

      images.forEach((img) => {
        imageFormData.append('images', img.file);
        viewTypes.push(img.viewType);
      });
      imageFormData.append('viewTypes', JSON.stringify(viewTypes));

      await dispatch(uploadImages({ inspectionId, formData: imageFormData })).unwrap();

      // Step 3: Run Real OCR & Legal Metrology Compliance Rule Engine
      setCurrentStep('Running optical character recognition & evaluating Legal Metrology Rules...');
      await dispatch(runAnalysis(inspectionId)).unwrap();

      // Navigate to detailed results
      navigate(`/inspections/${inspectionId}`);
    } catch (err) {
      console.error('Inspection creation error:', err);
      setFormError(err.message || 'Inspection failed to complete.');
      setIsProcessing(false);
    }
  };

  const handleRunDemo = async (sampleKey) => {
    setIsProcessing(true);
    setFormError(null);
    setCurrentStep(`Processing live OCR & Legal Metrology evaluation on preset '${sampleKey}'...`);
    try {
      const response = await api.post(`/samples/run-demo/${sampleKey}`);
      navigate(`/inspections/${response.data.data.id}`);
    } catch (err) {
      console.error('Demo run error:', err);
      setFormError(err.message || 'Failed to run demo sample');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Statutory Inspection Workflow</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          New Packaged Commodity Inspection
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Capture or upload multi-view images of the packaged commodity for automated Legal Metrology (Packaged Commodities) Rules, 2011 compliance analysis.
        </p>
      </div>

      {/* 1-Click Demo Evaluation Presets for Judges/Evaluators */}
      <div className="bg-blue-50 rounded-xl p-5 text-slate-800 shadow-md border border-blue-800 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 "></span>
            SIH Quick-Demo Presets (1-Click Evaluation)
          </p>
          <span className="text-[11px] text-slate-500">Live OCR &amp; Rule Engine</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleRunDemo('almonds-compliant')}
            disabled={isProcessing}
            className="p-3.5 rounded-lg bg-white hover:bg-slate-700 border border-slate-300 hover:border-emerald-500 text-left transition flex items-start justify-between group disabled:opacity-50"
          >
            <div>
              <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                Preset A: Roasted Almonds (Compliant)
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Food packaging with MRP, Net Qty 200g, Mfg Date, PIN code, and Consumer Care.
              </p>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
              Run Demo →
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleRunDemo('shampoo-violation')}
            disabled={isProcessing}
            className="p-3.5 rounded-lg bg-white hover:bg-slate-700 border border-slate-300 hover:border-rose-500 text-left transition flex items-start justify-between group disabled:opacity-50"
          >
            <div>
              <p className="text-xs font-bold text-slate-800 group-hover:text-rose-700">
                Preset B: Hair Cleanser (Violations)
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Cosmetic seizure: Net Qty "approx 250ml", MRP without taxes, no Consumer Care.
              </p>
            </div>
            <span className="text-[10px] font-bold text-rose-400 bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
              Run Demo →
            </span>
          </button>
        </div>
      </div>

      {formError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Inspection Setup Error</p>
            <p className="text-xs mt-0.5">{formError}</p>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="bg-slate-50 border-slate-200 text-slate-800 rounded-xl p-6 shadow-xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            <div>
              <p className="text-sm font-bold text-blue-800">Processing Compliance Scanner</p>
              <p className="text-xs text-slate-600 mt-0.5">{currentStep}</p>
            </div>
          </div>
          <div className="w-full bg-slate-100 border-slate-200 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-1.5 rounded-full  w-3/4"></div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Only Image Upload Section Remains */}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Package Images Upload (Multi-Surface)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload images of the Front (Principal Display Panel), Back, and Side panels for comprehensive declaration extraction.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold bg-slate-100 px-2.5 py-1 rounded-full text-slate-700">
              {images.length} Image(s) Attached
            </span>
          </div>

          {/* Upload Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFiles(e.dataTransfer.files);
              }
            }}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition group cursor-pointer relative ${
              isDragging
                ? 'border-blue-500 bg-blue-50/70'
                : 'border-slate-300 hover:border-blue-400 bg-slate-50/60'
            }`}
          >
            {/* Hidden file and camera inputs */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              disabled={isProcessing}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              disabled={isProcessing}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="p-3.5 bg-blue-50 text-blue-600 rounded-full group-hover:scale-105 transition shadow-sm">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Click or tap anywhere here to select package images
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports JPEG, PNG, WebP (up to 10MB each). Drag & drop also supported.
                </p>
              </div>

              {/* Action Buttons for Mobile / Desktop convenience */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Select Images / Files
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Camera className="w-3.5 h-3.5 text-slate-600" />
                  Take Photo / Camera
                </button>
              </div>
            </div>
          </div>

          {/* Image Previews & View Type Tagging */}
          {images.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-700">
                  Attached Surfaces ({images.length})
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 transition"
                  >
                    <Plus className="w-3 h-3" /> Add Image
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isProcessing}
                    className="text-xs text-slate-600 hover:text-slate-800 font-semibold flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 transition"
                  >
                    <Camera className="w-3 h-3" /> Camera
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((img, index) => (
                  <div
                    key={img.id}
                    className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex flex-col justify-between space-y-3 relative group"
                  >
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-slate-200 border border-slate-300">
                      <img
                        src={img.previewUrl}
                        alt={`Package view ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        disabled={isProcessing}
                        className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-md shadow hover:bg-rose-700 transition"
                        title="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="absolute bottom-2 left-2 bg-slate-800 text-white font-mono text-[10px] px-1.5 py-0.5 rounded">
                        # {index + 1}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-blue-500" />
                        Label Package Surface:
                      </label>
                      <select
                        value={img.viewType}
                        onChange={(e) => handleViewTypeChange(img.id, e.target.value)}
                        disabled={isProcessing}
                        className="w-full text-xs py-1.5 px-2 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      >
                        {VIEW_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => navigate('/')}
            disabled={isProcessing}
            className="px-5 py-2.5 border border-slate-300 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/10 transition disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scanning &amp; Evaluating...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Analyze Compliance Now <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
