import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Sparkles, Check } from 'lucide-react';

export default function CameraScannerModal({
  isOpen,
  onClose,
  onCapture,
  slotLabel = 'Package Surface',
  slotKey = 'front',
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
  const [cameraError, setCameraError] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedFlash, setCapturedFlash] = useState(false);

  // Start video stream when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera(facingMode);

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async (mode) => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by your browser.');
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('[CameraScannerModal] getUserMedia error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission denied. Please allow camera access in browser settings or use the file upload option.');
      } else {
        setCameraError('Unable to access camera on this device. Please use standard file upload.');
      }
    }
  };

  const flipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleSnap = () => {
    if (!videoRef.current || isCapturing) return;

    setIsCapturing(true);
    setCapturedFlash(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const fileName = `camera_${slotKey}_${Date.now()}.jpg`;
            const file = new File([blob], fileName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            onCapture(file);
            stopCamera();
            onClose();
          }
          setIsCapturing(false);
          setCapturedFlash(false);
        },
        'image/jpeg',
        0.9
      );
    } catch (err) {
      console.error('[CameraScannerModal] Snap error:', err);
      setIsCapturing(false);
      setCapturedFlash(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 text-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/50 z-10">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-blue-400" />
            <span className="text-xs sm:text-sm font-semibold truncate">
              Scanner: {slotLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Viewfinder Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[340px] sm:min-h-[420px] overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center max-w-sm space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
              <p className="text-sm font-medium text-slate-200">{cameraError}</p>
              <p className="text-xs text-slate-400">
                You can still capture or upload packaging photos using the "Choose File" button.
              </p>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold text-white transition"
              >
                Return to Inspection Form
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Target Framing Reticle */}
              <div className="absolute inset-8 sm:inset-12 pointer-events-none flex items-center justify-center">
                <div className="w-full h-full border-2 border-emerald-400/70 rounded-xl relative shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                  {/* Corner Accent Marks */}
                  <span className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl"></span>
                  <span className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr"></span>
                  <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl"></span>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br"></span>

                  <div className="absolute inset-x-0 bottom-3 text-center">
                    <span className="bg-black/60 text-emerald-300 text-[11px] font-medium px-3 py-1 rounded-full backdrop-blur-sm shadow">
                      Align {slotLabel} clearly
                    </span>
                  </div>
                </div>
              </div>

              {/* Shutter White Flash Animation */}
              {capturedFlash && (
                <div className="absolute inset-0 bg-white animate-out fade-out duration-300 pointer-events-none"></div>
              )}
            </>
          )}
        </div>

        {/* Footer Shutter Controls */}
        {!cameraError && (
          <div className="p-4 bg-slate-800/90 border-t border-slate-700/50 flex items-center justify-around z-10">
            <button
              type="button"
              onClick={flipCamera}
              className="p-3 text-slate-300 hover:text-white hover:bg-slate-700/80 rounded-full transition"
              title="Switch Front/Back Camera"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            {/* Main Shutter Button */}
            <button
              type="button"
              onClick={handleSnap}
              disabled={isCapturing}
              className="w-16 h-16 rounded-full border-4 border-white bg-blue-600 hover:bg-blue-500 active:scale-95 transition shadow-lg flex items-center justify-center group disabled:opacity-50"
              title="Snap Packaging Photo"
            >
              <div className="w-12 h-12 rounded-full bg-white group-hover:bg-blue-100 transition"></div>
            </button>

            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-3 text-slate-300 hover:text-white hover:bg-slate-700/80 rounded-full transition"
              title="Cancel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
