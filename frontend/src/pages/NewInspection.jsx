import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createInspection, uploadImages, runAnalysis } from '../features/inspections/inspectionSlice';
import api from '../services/api';
import CameraScannerModal from '../components/common/CameraScannerModal';
import {
  Upload, Camera, Trash2, ShieldCheck, AlertCircle, CheckCircle2,
  Loader2, Tag, ArrowRight, Plus, Sparkles, Eye, FileText, PhoneCall,
  RotateCw, ScanLine, Package
} from 'lucide-react';

const CATEGORIES = [
  'Food & Beverages',
  'Cosmetics & Personal Care',
  'Electronics & Electrical',
  'Chemicals & Detergents',
  'Textiles & Apparel',
  'General Packaged Commodity',
];

const SURFACE_SLOTS = [
  {
    key: 'front', label: 'Front Display Panel (PDP)', sublabel: 'Product Name, Brand Identity & Net Quantity',
    rule: 'Rule 6(1)(b) & Rule 6(1)(c)', icon: Eye, recommended: true, hint: 'Capture the main front face showing the commodity name clearly.',
  },
  {
    key: 'back', label: 'Back Panel (Declarations)', sublabel: 'Manufacturer Name & Address, Mfg/Packing Date',
    rule: 'Rule 6(1)(a) & Rule 6(1)(d)', icon: FileText, recommended: true, hint: 'Capture the declaration text box, ingredients, and manufacturer info.',
  },
  {
    key: 'side', label: 'Side Panel (Consumer Care)', sublabel: 'Helpline No., Email ID, Postal Address & Redressal',
    rule: 'Rule 6(2)', icon: PhoneCall, recommended: false, hint: 'Capture customer support telephone, email, and grievance contact.',
  },
  {
    key: 'mrp', label: 'MRP & Batch Label (Close-Up)', sublabel: 'Retail Price (incl. of all taxes), Unit Sale Price & Batch No.',
    rule: 'Rule 6(1)(e) & Rule 2(m)', icon: Tag, recommended: true, hint: 'Close-up macro photo of the stamped or printed MRP area.',
  },
];

const compressImage = (file, maxWidth = 1600, quality = 0.85) => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/') || file.type.includes('svg')) return resolve(file);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        if (img.width <= maxWidth && img.height <= maxWidth && file.size < 1.5 * 1024 * 1024) return resolve(file);
        const canvas = document.createElement('canvas');
        let width = img.width, height = img.height;
        if (width > height) {
          if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
        } else {
          if (height > maxWidth) { width = Math.round((width * maxWidth) / height); height = maxWidth; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.jpg', { type: 'image/jpeg', lastModified: Date.now() }));
          else resolve(file);
        }, 'image/jpeg', quality);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

export default function NewInspection() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [numProducts, setNumProducts] = useState(1);
  const [activeTab, setActiveTab] = useState(0); // For tabbed navigation
  const [productsData, setProductsData] = useState([{
    id: 0,
    slotImages: { front: null, back: null, side: null, mrp: null },
    extraImages: []
  }]);

  const handleNumProductsChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setNumProducts(val);
    if (activeTab >= val) setActiveTab(Math.max(0, val - 1));
    
    setProductsData(prev => {
      const newData = [...prev];
      if (val > prev.length) {
        for (let i = prev.length; i < val; i++) {
          newData.push({ id: i, slotImages: { front: null, back: null, side: null, mrp: null }, extraImages: [] });
        }
      } else if (val < prev.length) {
        newData.splice(val);
      }
      return newData;
    });
  };

  const [activeCameraModal, setActiveCameraModal] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [formError, setFormError] = useState(null);

  const handleCaptureSlot = async (productIndex, slotKey, rawFile) => {
    if (!rawFile || !rawFile.type.startsWith('image/')) return;
    setIsCompressing(true); setFormError(null);
    try {
      const compressed = await compressImage(rawFile);
      const previewUrl = URL.createObjectURL(compressed);
      setProductsData(prev => {
        const newData = [...prev];
        if (newData[productIndex].slotImages[slotKey]?.previewUrl) URL.revokeObjectURL(newData[productIndex].slotImages[slotKey].previewUrl);
        newData[productIndex].slotImages[slotKey] = { id: `${Date.now()}-${slotKey}`, file: compressed, viewType: slotKey, previewUrl };
        return newData;
      });
    } catch (err) {
      setFormError('Could not process photo. Please try again.');
    } finally {
      setIsCompressing(false);
    }
  };

  const removeSlotImage = (productIndex, slotKey) => {
    setProductsData(prev => {
      const newData = [...prev];
      if (newData[productIndex].slotImages[slotKey]?.previewUrl) URL.revokeObjectURL(newData[productIndex].slotImages[slotKey].previewUrl);
      newData[productIndex].slotImages[slotKey] = null;
      return newData;
    });
  };

  const handleAddExtraFile = async (productIndex, rawFile) => {
    if (!rawFile || !rawFile.type.startsWith('image/')) return;
    setIsCompressing(true); setFormError(null);
    try {
      const compressed = await compressImage(rawFile);
      const id = `extra_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newImg = { id, file: compressed, viewType: 'evidence', previewUrl: URL.createObjectURL(compressed) };
      setProductsData(prev => {
        const newData = [...prev];
        newData[productIndex].extraImages.push(newImg);
        return newData;
      });
    } catch (err) {
      setFormError('Failed to process extra image.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleAddMultipleExtraFiles = async (productIndex, e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files).filter((f) => f.type.startsWith('image/'));
    for (const f of files) await handleAddExtraFile(productIndex, f);
    e.target.value = '';
  };

  const removeExtraImage = (productIndex, id) => {
    setProductsData(prev => {
      const newData = [...prev];
      const img = newData[productIndex].extraImages.find(i => i.id === id);
      if (img?.previewUrl) URL.revokeObjectURL(img.previewUrl);
      newData[productIndex].extraImages = newData[productIndex].extraImages.filter(i => i.id !== id);
      return newData;
    });
  };

  const handleAnalyze = async () => {
    let totalImages = 0;
    for (const pd of productsData) {
      const count = Object.values(pd.slotImages).filter(x => x !== null).length + pd.extraImages.length;
      totalImages += count;
    }
    if (totalImages === 0) {
      setFormError('Please capture or upload at least the Front Display Panel or MRP label for one product.');
      return;
    }

    setIsProcessing(true);
    setFormError(null);

    try {
      setCurrentStep(`Initializing ${numProducts} statutory inspection records in bulk...`);
      
      const uploadPromises = productsData.map(async (pd, idx) => {
        const productImages = [
          ...(pd.slotImages.front ? [pd.slotImages.front] : []),
          ...(pd.slotImages.back ? [pd.slotImages.back] : []),
          ...(pd.slotImages.side ? [pd.slotImages.side] : []),
          ...(pd.slotImages.mrp ? [pd.slotImages.mrp] : []),
          ...pd.extraImages,
        ];
        if (productImages.length === 0) return null;

        const created = await dispatch(createInspection({
          productName: `Bulk Upload Product ${idx + 1}`,
          category: CATEGORIES[0],
          inspectorName: 'Inspector (Legal Metrology HQ)',
        })).unwrap();
        
        const inspectionId = created.id;
        const imageFormData = new FormData();
        const viewTypes = [];
        productImages.forEach((img) => {
          imageFormData.append('images', img.file);
          viewTypes.push(img.viewType);
        });
        imageFormData.append('viewTypes', JSON.stringify(viewTypes));

        await dispatch(uploadImages({ inspectionId, formData: imageFormData })).unwrap();
        return inspectionId;
      });

      const inspectionIds = (await Promise.all(uploadPromises)).filter(id => id !== null);

      setCurrentStep(`Distributing ${inspectionIds.length} products to Worker Pool for parallel OCR & Analysis...`);
      
      const analysisPromises = inspectionIds.map(id => dispatch(runAnalysis(id)).unwrap());
      await Promise.all(analysisPromises);

      navigate('/');
    } catch (err) {
      console.error('Analysis error:', err);
      setFormError(err.message || 'Inspection failed. Please check network or server.');
      setIsProcessing(false);
    }
  };

  // Helper to check if a product has minimum images for progress badge
  const isProductReady = (pd) => {
    return pd.slotImages.front !== null || pd.slotImages.mrp !== null || pd.slotImages.back !== null;
  };

  // The active product being displayed
  const activeProduct = productsData[activeTab];

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-[140px] md:pb-32">
      {activeCameraModal && (
        <CameraScannerModal
          isOpen={!!activeCameraModal}
          slotKey={activeCameraModal.slotKey}
          slotLabel={activeCameraModal.label}
          onClose={() => setActiveCameraModal(null)}
          onCapture={(file) => {
            if (activeCameraModal.slotKey === 'extra') {
              handleAddExtraFile(activeCameraModal.productIndex, file);
            } else {
              handleCaptureSlot(activeCameraModal.productIndex, activeCameraModal.slotKey, file);
            }
          }}
        />
      )}

      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Distributed Compliance Workflow</span>
        </div>
        <h1 className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight">Bulk Commodity Inspection</h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">Upload package surfaces for multiple products simultaneously. Our distributed backend will process them in parallel.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
          <Package className="w-6 h-6" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-900 mb-1">Number of Products to Inspect</label>
          <select 
            value={numProducts} 
            onChange={handleNumProductsChange}
            disabled={isProcessing}
            className="border-slate-300 rounded-lg shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500 block w-48 p-2 border"
          >
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <option key={n} value={n}>{n} {n === 1 ? 'Product' : 'Products'}</option>
            ))}
          </select>
        </div>
      </div>

      {formError && (
        <div className="p-3.5 sm:p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
          <div><p className="font-semibold text-xs sm:text-sm">Notice</p><p className="text-xs mt-0.5 text-rose-600">{formError}</p></div>
        </div>
      )}

      {(isProcessing || isCompressing) && (
        <div className="bg-white rounded-xl p-5 shadow-md border border-blue-200 space-y-3">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-slate-900">{isCompressing ? 'Preparing Mobile Photos...' : 'Parallel Distributed Processing...'}</p>
              <p className="text-xs text-slate-500 mt-0.5">{isCompressing ? 'Optimizing photo for fast upload' : currentStep}</p>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div className="bg-blue-600 h-1.5 rounded-full animate-pulse w-3/4"></div></div>
        </div>
      )}

      {/* TABS NAVIGATION */}
      {numProducts > 1 && (
        <div className="flex overflow-x-auto border-b border-slate-200 pb-2 space-x-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {productsData.map((pd, index) => {
            const isActive = activeTab === index;
            const ready = isProductReady(pd);
            return (
              <button
                key={pd.id}
                onClick={() => setActiveTab(index)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium text-sm transition whitespace-nowrap ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-white text-slate-600 hover:bg-slate-50 border-t border-l border-r border-slate-200'
                }`}
              >
                Product {index + 1}
                {ready && (
                  <CheckCircle2 className={`w-4 h-4 ${isActive ? 'text-blue-200' : 'text-emerald-500'}`} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ACTIVE PRODUCT UPLOAD UI */}
      {activeProduct && (
        <div className="bg-white rounded-b-xl rounded-tr-xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">
              Product #{activeTab + 1} Capture Slots
            </h2>
            <span className="text-xs text-slate-500">
              {Object.values(activeProduct.slotImages).filter(x => x !== null).length}/4 Captured
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SURFACE_SLOTS.map((slot) => {
              const SlotIcon = slot.icon;
              const captured = activeProduct.slotImages[slot.key];
              const fileInputId = `slot-file-${activeTab}-${slot.key}`;
              const cameraInputId = `slot-camera-${activeTab}-${slot.key}`;

              return (
                <div key={slot.key} className={`rounded-xl border p-4 flex flex-col justify-between space-y-3 ${captured ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200 bg-slate-50/50'}`}>
                  <input id={fileInputId} type="file" accept="image/*" onChange={(e) => { handleCaptureSlot(activeTab, slot.key, e.target.files?.[0]); e.target.value = ''; }} disabled={isProcessing} className="hidden" />
                  <input id={cameraInputId} type="file" accept="image/*" capture="environment" onChange={(e) => { handleCaptureSlot(activeTab, slot.key, e.target.files?.[0]); e.target.value = ''; }} disabled={isProcessing} className="hidden" />

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${captured ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-600'}`}><SlotIcon className="w-5 h-5" /></div>
                      <div>
                        <div className="flex items-center gap-1.5"><h3 className="text-sm font-bold text-slate-900">{slot.label}</h3></div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{slot.sublabel}</p>
                      </div>
                    </div>
                    {captured && <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3.5 h-3.5" /> Captured</span>}
                  </div>

                  {captured ? (
                    <div className="space-y-2 pt-1">
                      <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                        <img src={captured.previewUrl} alt={slot.label} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{captured.file.name}</p>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => removeSlotImage(activeTab, slot.key)} disabled={isProcessing} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md border border-rose-200 transition text-[11px] flex items-center gap-1"><Trash2 className="w-3 h-3" /> Remove</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button type="button" onClick={() => setActiveCameraModal({ productIndex: activeTab, slotKey: slot.key, label: slot.label })} disabled={isProcessing} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm"><ScanLine className="w-3.5 h-3.5" /> Live Scanner</button>
                      <button type="button" onClick={() => document.getElementById(fileInputId)?.click()} disabled={isProcessing} className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 flex items-center justify-center gap-1.5 shadow-sm"><Upload className="w-3.5 h-3.5 text-slate-600" /> Choose File</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <input id={`extra-file-input-${activeTab}`} type="file" multiple accept="image/*" onChange={(e) => handleAddMultipleExtraFiles(activeTab, e)} disabled={isProcessing} className="hidden" />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5"><span>Extra Images (Optional)</span></h3>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => document.getElementById(`extra-file-input-${activeTab}`)?.click()} disabled={isProcessing} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 shadow-sm"><Plus className="w-3.5 h-3.5" /> Add Photos</button>
              </div>
            </div>
            {activeProduct.extraImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {activeProduct.extraImages.map((img, idx) => (
                  <div key={img.id} className="bg-white rounded-lg border border-slate-200 p-2 relative">
                    <div className="relative aspect-square rounded overflow-hidden bg-slate-100 border border-slate-200">
                      <img src={img.previewUrl} alt={`Extra ${idx}`} className="w-full h-full object-contain" />
                      <button type="button" onClick={() => removeExtraImage(activeTab, img.id)} disabled={isProcessing} className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded shadow-sm hover:bg-rose-700 transition"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STICKY FOOTER ACTION BAR */}
      <div className="fixed bottom-[60px] md:bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/')} disabled={isProcessing} className="px-5 py-3 border border-slate-300 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-100 text-center transition">Cancel</button>
          <button type="button" onClick={handleAnalyze} disabled={isProcessing} className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base rounded-xl shadow-md disabled:opacity-50 min-h-[48px] transition">
            {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Processing {numProducts} Products...</span></> : <><ShieldCheck className="w-5 h-5" /><span>Bulk Analyze {numProducts} Products</span></>}
          </button>
        </div>
      </div>
    </div>
  );
}
