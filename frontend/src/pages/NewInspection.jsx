import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createInspection, uploadImages, runAnalysis } from '../features/inspections/inspectionSlice';
import api from '../services/api';
import CameraScannerModal from '../components/common/CameraScannerModal';
import {
  saveDraftImage,
  loadDraftImages,
  removeDraftImage,
  clearAllDraftImages,
} from '../utils/imageStorage';
import {
  Upload,
  Camera,
  Trash2,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Tag,
  ArrowRight,
  Plus,
  Sparkles,
  Eye,
  FileText,
  PhoneCall,
  RotateCw,
  ScanLine,
} from 'lucide-react';

const CATEGORIES = [
  'Food & Beverages',
  'Cosmetics & Personal Care',
  'Electronics & Electrical',
  'Chemicals & Detergents',
  'Textiles & Apparel',
  'General Packaged Commodity',
];

/**
 * Slot definitions for guided multi-surface capture
 */
const SURFACE_SLOTS = [
  {
    key: 'front',
    label: 'Front Display Panel (PDP)',
    sublabel: 'Product Name, Brand Identity & Net Quantity',
    rule: 'Rule 6(1)(b) & Rule 6(1)(c)',
    icon: Eye,
    recommended: true,
    hint: 'Capture the main front face showing the commodity name clearly.',
  },
  {
    key: 'back',
    label: 'Back Panel (Declarations)',
    sublabel: 'Manufacturer Name & Address, Mfg/Packing Date',
    rule: 'Rule 6(1)(a) & Rule 6(1)(d)',
    icon: FileText,
    recommended: true,
    hint: 'Capture the declaration text box, ingredients, and manufacturer info.',
  },
  {
    key: 'side',
    label: 'Side Panel (Consumer Care)',
    sublabel: 'Helpline No., Email ID, Postal Address & Redressal',
    rule: 'Rule 6(2)',
    icon: PhoneCall,
    recommended: false,
    hint: 'Capture customer support telephone, email, and grievance contact.',
  },
  {
    key: 'mrp',
    label: 'MRP & Batch Label (Close-Up)',
    sublabel: 'Retail Price (incl. of all taxes), Unit Sale Price & Batch No.',
    rule: 'Rule 6(1)(e) & Rule 2(m)',
    icon: Tag,
    recommended: true,
    hint: 'Close-up macro photo of the stamped or printed MRP area.',
  },
];

/**
 * Client-side image compression to prevent mobile tab crash on high-res camera photos
 */
const compressImage = (file, maxWidth = 1600, quality = 0.85) => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/') || file.type.includes('svg')) {
      return resolve(file);
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        if (img.width <= maxWidth && img.height <= maxWidth && file.size < 1.5 * 1024 * 1024) {
          return resolve(file);
        }
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.jpg', {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

export default function NewInspection() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Slots state: front, back, side, mrp
  const [slotImages, setSlotImages] = useState({
    front: null,
    back: null,
    side: null,
    mrp: null,
  });

  // Extra optional images list
  const [extraImages, setExtraImages] = useState([]);

  // In-app camera scanner modal state
  const [activeCameraModal, setActiveCameraModal] = useState(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [formError, setFormError] = useState(null);

  // Restore draft images from IndexedDB on mount (protects against Android tab reloads)
  useEffect(() => {
    let isMounted = true;
    loadDraftImages().then((draft) => {
      if (!isMounted) return;
      if (draft.slots && Object.keys(draft.slots).length > 0) {
        setSlotImages((prev) => ({ ...prev, ...draft.slots }));
      }
      if (draft.extras && draft.extras.length > 0) {
        setExtraImages(draft.extras);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle single slot photo capture or upload
  const handleCaptureSlot = async (slotKey, rawFile) => {
    if (!rawFile || !rawFile.type.startsWith('image/')) return;

    setIsCompressing(true);
    setFormError(null);

    try {
      const compressed = await compressImage(rawFile);
      const previewUrl = URL.createObjectURL(compressed);

      setSlotImages((prev) => {
        if (prev[slotKey]?.previewUrl) {
          URL.revokeObjectURL(prev[slotKey].previewUrl);
        }
        return {
          ...prev,
          [slotKey]: {
            id: `${Date.now()}-${slotKey}`,
            file: compressed,
            viewType: slotKey,
            previewUrl,
          },
        };
      });

      // Save to IndexedDB so page reload does not lose photo
      saveDraftImage(slotKey, compressed);
    } catch (err) {
      console.error('Slot photo error:', err);
      setFormError('Could not process photo. Please try again.');
    } finally {
      setIsCompressing(false);
    }
  };

  const removeSlotImage = (slotKey) => {
    setSlotImages((prev) => {
      if (prev[slotKey]?.previewUrl) {
        URL.revokeObjectURL(prev[slotKey].previewUrl);
      }
      return {
        ...prev,
        [slotKey]: null,
      };
    });
    removeDraftImage(slotKey);
  };

  // Handle extra evidence images
  const handleAddExtraFile = async (rawFile) => {
    if (!rawFile || !rawFile.type.startsWith('image/')) return;

    setIsCompressing(true);
    setFormError(null);

    try {
      const compressed = await compressImage(rawFile);
      const id = `extra_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newImg = {
        id,
        file: compressed,
        viewType: 'evidence',
        previewUrl: URL.createObjectURL(compressed),
      };

      setExtraImages((prev) => [...prev, newImg]);
      saveDraftImage(id, compressed);
    } catch (err) {
      console.error('Extra image error:', err);
      setFormError('Failed to process extra image.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleAddMultipleExtraFiles = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files).filter((f) => f.type.startsWith('image/'));
    for (const f of files) {
      await handleAddExtraFile(f);
    }
    e.target.value = '';
  };

  const removeExtraImage = (id) => {
    setExtraImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img?.previewUrl) {
        URL.revokeObjectURL(img.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
    removeDraftImage(id);
  };

  // Consolidate all uploaded surfaces
  const allImages = [
    ...(slotImages.front ? [slotImages.front] : []),
    ...(slotImages.back ? [slotImages.back] : []),
    ...(slotImages.side ? [slotImages.side] : []),
    ...(slotImages.mrp ? [slotImages.mrp] : []),
    ...extraImages,
  ];

  const totalUploaded = allImages.length;
  const coreSlotsCount = ['front', 'back', 'side', 'mrp'].filter((k) => slotImages[k] !== null).length;

  // Run Real OCR + Rule Engine Analysis
  const handleAnalyze = async () => {
    if (totalUploaded === 0) {
      setFormError('Please capture or upload at least the Front Display Panel or MRP label to proceed.');
      return;
    }

    setIsProcessing(true);
    setFormError(null);

    try {
      // Step 1: Create Inspection record (product name will be auto-extracted from Front PDP via OCR/ML)
      setCurrentStep('Initializing statutory inspection record...');
      const created = await dispatch(
        createInspection({
          productName: 'Automated Package Scan',
          category: CATEGORIES[0],
          inspectorName: 'Inspector (Legal Metrology HQ)',
        })
      ).unwrap();
      const inspectionId = created.id;

      // Step 2: Upload packaged images with accurate surface view tags
      setCurrentStep(`Uploading ${totalUploaded} package image surfaces...`);
      const imageFormData = new FormData();
      const viewTypes = [];

      allImages.forEach((img) => {
        imageFormData.append('images', img.file);
        viewTypes.push(img.viewType);
      });
      imageFormData.append('viewTypes', JSON.stringify(viewTypes));

      await dispatch(uploadImages({ inspectionId, formData: imageFormData })).unwrap();

      // Step 3: Run Real OCR + Custom ML extraction + Rule Compliance Engine
      setCurrentStep('Extracting product name, MRP & declarations via OCR & Legal Metrology Rules...');
      await dispatch(runAnalysis(inspectionId)).unwrap();

      // Clear draft storage on successful analysis
      await clearAllDraftImages();

      // Step 4: Navigate to detailed results
      navigate(`/inspections/${inspectionId}`);
    } catch (err) {
      console.error('Analysis error:', err);
      setFormError(err.message || 'Inspection failed. Please check network or server.');
      setIsProcessing(false);
    }
  };

  const handleRunDemo = async (sampleKey) => {
    setIsProcessing(true);
    setFormError(null);
    setCurrentStep(`Running live OCR & evaluation on sample '${sampleKey}'...`);
    try {
      const response = await api.post(`/samples/run-demo/${sampleKey}`);
      navigate(`/inspections/${response.data.data.id}`);
    } catch (err) {
      console.error('Demo error:', err);
      setFormError(err.message || 'Failed to run demo sample');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-16">
      {/* Live In-App Camera Scanner Modal */}
      {activeCameraModal && (
        <CameraScannerModal
          isOpen={!!activeCameraModal}
          slotKey={activeCameraModal.slotKey}
          slotLabel={activeCameraModal.label}
          onClose={() => setActiveCameraModal(null)}
          onCapture={(file) => {
            if (activeCameraModal.slotKey === 'extra') {
              handleAddExtraFile(file);
            } else {
              handleCaptureSlot(activeCameraModal.slotKey, file);
            }
          }}
        />
      )}

      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Statutory Compliance Workflow</span>
        </div>
        <h1 className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          New Packaged Commodity Inspection
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Upload package surfaces (Front, Back, Side, MRP) for automated product name extraction &amp; Legal Metrology rule verification.
        </p>
      </div>

      {/* 1-Click Demo Presets */}
      <div className="bg-blue-50/70 rounded-xl p-4 sm:p-5 text-slate-800 shadow-sm border border-blue-200 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            SIH Quick-Demo Presets (1-Click Evaluation)
          </p>
          <span className="text-[11px] text-slate-500 hidden sm:inline">Pre-configured test samples</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleRunDemo('almonds-compliant')}
            disabled={isProcessing || isCompressing}
            className="p-3 sm:p-3.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-500 text-left transition flex items-start justify-between group shadow-sm disabled:opacity-50"
          >
            <div className="pr-2">
              <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                Preset A: Roasted Almonds (Compliant)
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Extracts name, MRP, Net Qty 200g, Mfg Date, PIN code, and Consumer Care.
              </p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 flex-shrink-0">
              Run Demo →
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleRunDemo('shampoo-violation')}
            disabled={isProcessing || isCompressing}
            className="p-3 sm:p-3.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 hover:border-rose-500 text-left transition flex items-start justify-between group shadow-sm disabled:opacity-50"
          >
            <div className="pr-2">
              <p className="text-xs font-bold text-slate-900 group-hover:text-rose-700">
                Preset B: Hair Cleanser (Violations)
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Cosmetic seizure: Net Qty "approx 250ml", MRP without taxes, missing Consumer Care.
              </p>
            </div>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200 flex-shrink-0">
              Run Demo →
            </span>
          </button>
        </div>
      </div>

      {/* Error Message Banner */}
      {formError && (
        <div className="p-3.5 sm:p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
          <div className="min-w-0">
            <p className="font-semibold text-xs sm:text-sm">Notice</p>
            <p className="text-xs mt-0.5 text-rose-600">{formError}</p>
          </div>
        </div>
      )}

      {/* Live Processing Indicator */}
      {(isProcessing || isCompressing) && (
        <div className="bg-white rounded-xl p-5 shadow-md border border-blue-200 space-y-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">
                {isCompressing ? 'Preparing Mobile Photos...' : 'Analyzing Legal Metrology Compliance...'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {isCompressing ? 'Optimizing photo for fast cloud OCR' : currentStep}
              </p>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-1.5 rounded-full animate-pulse w-3/4"></div>
          </div>
        </div>
      )}

      {/* Section Header & Progress Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Package Surface Capture Checklist
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload designated package sides. Photos are auto-saved locally so reloads will not lose your progress.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-xs font-mono font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
              {coreSlotsCount}/4 Key Surfaces Captured
            </span>
          </div>
        </div>

        {/* 4 Core Guided Surface Slots */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SURFACE_SLOTS.map((slot) => {
            const SlotIcon = slot.icon;
            const captured = slotImages[slot.key];
            const fileInputId = `slot-file-${slot.key}`;
            const cameraInputId = `slot-camera-${slot.key}`;

            return (
              <div
                key={slot.key}
                className={`rounded-xl border p-4 transition flex flex-col justify-between space-y-3 ${
                  captured
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                }`}
              >
                {/* Dedicated Hidden Inputs for this specific slot */}
                <input
                  id={fileInputId}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    handleCaptureSlot(slot.key, e.target.files?.[0]);
                    e.target.value = '';
                  }}
                  disabled={isProcessing || isCompressing}
                  className="hidden"
                />
                <input
                  id={cameraInputId}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    handleCaptureSlot(slot.key, e.target.files?.[0]);
                    e.target.value = '';
                  }}
                  disabled={isProcessing || isCompressing}
                  className="hidden"
                />

                {/* Slot Title & Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 ${
                        captured
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-50 text-blue-600'
                      }`}
                    >
                      <SlotIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-slate-900">{slot.label}</h3>
                        {slot.recommended && !captured && (
                          <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            Key
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {slot.sublabel}
                      </p>
                      <span className="inline-block text-[10px] font-mono text-slate-400 mt-0.5">
                        {slot.rule}
                      </span>
                    </div>
                  </div>

                  {captured && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Captured
                    </span>
                  )}
                </div>

                {/* Slot Content: Uploaded Preview vs Capture Buttons */}
                {captured ? (
                  <div className="space-y-2 pt-1">
                    <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                      <img
                        src={captured.previewUrl}
                        alt={slot.label}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                        {captured.file.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveCameraModal({ slotKey: slot.key, label: slot.label })}
                          disabled={isProcessing || isCompressing}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-md border border-slate-200 transition text-[11px] flex items-center gap-1"
                          title="Retake photo"
                        >
                          <RotateCw className="w-3 h-3" /> Retake
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSlotImage(slot.key)}
                          disabled={isProcessing || isCompressing}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md border border-rose-200 transition text-[11px] flex items-center gap-1"
                          title="Remove photo"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 space-y-2">
                    <p className="text-[11px] text-slate-400 italic">
                      {slot.hint}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveCameraModal({ slotKey: slot.key, label: slot.label })}
                        disabled={isProcessing || isCompressing}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 min-h-[40px] disabled:opacity-50"
                      >
                        <ScanLine className="w-3.5 h-3.5" />
                        Live Scanner
                      </button>
                      <button
                        type="button"
                        onClick={() => document.getElementById(fileInputId)?.click()}
                        disabled={isProcessing || isCompressing}
                        className="px-3 py-2 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-sm transition flex items-center justify-center gap-1.5 min-h-[40px] disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-600" />
                        Choose File
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 5th Slot: Extra Evidence Images (Optional) */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
          {/* Hidden inputs for extra images */}
          <input
            id="extra-file-input"
            type="file"
            multiple
            accept="image/*"
            onChange={handleAddMultipleExtraFiles}
            disabled={isProcessing || isCompressing}
            className="hidden"
          />

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>Extra Images &amp; Additional Evidence (Optional)</span>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                  Optional
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Barcodes, seals, nutritional tables, top/bottom views, or additional package sides.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveCameraModal({ slotKey: 'extra', label: 'Extra Evidence' })}
                disabled={isProcessing || isCompressing}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-sm transition flex items-center gap-1 min-h-[34px]"
              >
                <Camera className="w-3.5 h-3.5" /> Scanner
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('extra-file-input')?.click()}
                disabled={isProcessing || isCompressing}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1 min-h-[34px]"
              >
                <Plus className="w-3.5 h-3.5" /> Add Photos
              </button>
            </div>
          </div>

          {/* Extra Images Grid */}
          {extraImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {extraImages.map((img, idx) => (
                <div
                  key={img.id}
                  className="bg-white rounded-lg border border-slate-200 p-2 relative group shadow-sm"
                >
                  <div className="relative aspect-square rounded overflow-hidden bg-slate-100">
                    <img
                      src={img.previewUrl}
                      alt={`Extra evidence ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => removeExtraImage(img.id)}
                      disabled={isProcessing || isCompressing}
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded shadow hover:bg-rose-700 transition"
                      title="Remove image"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate mt-1">
                    Evidence #{idx + 1}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={async () => {
            await clearAllDraftImages();
            navigate('/');
          }}
          disabled={isProcessing || isCompressing}
          className="px-5 py-3 border border-slate-300 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-100 transition text-center order-2 sm:order-1"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isProcessing || isCompressing || totalUploaded === 0}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm sm:text-base rounded-xl shadow-md transition disabled:opacity-50 min-h-[48px] order-1 sm:order-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing Declarations &amp; Product Name...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              <span>
                {totalUploaded === 0
                  ? 'Capture At Least 1 Surface to Analyze'
                  : `Analyze Compliance Now (${totalUploaded} Surfaces)`}
              </span>
              <ArrowRight className="w-4 h-4 hidden sm:inline" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
