import React, { useEffect, useRef, useState } from 'react';
import { getEnvironmentCameraId, getAvailableCameras } from '../services/cameraService';

// ZXing is loaded lazily on first scan to keep the initial bundle small.
let zxingModulePromise: Promise<typeof import('@zxing/browser')> | null = null;
const loadZxing = () => {
  if (!zxingModulePromise) {
    zxingModulePromise = import('@zxing/browser');
  }
  return zxingModulePromise;
};

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (text: string) => void;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const initScanner = async (preferredDeviceId?: string) => {
    if (!videoRef.current) return;
    
    setIsInitializing(true);
    setError(null);

    try {
      if (!codeReaderRef.current) {
        const ZXingBrowser = await loadZxing();
        codeReaderRef.current = new ZXingBrowser.BrowserMultiFormatReader();
      }
      
      const codeReader = codeReaderRef.current;
      codeReader.reset();

      // Attempt to find the best camera if none provided
      const deviceId = preferredDeviceId || await getEnvironmentCameraId();
      
      if (!mountedRef.current) return;

      await codeReader.decodeFromVideoDevice(deviceId || null, videoRef.current, (result: any, err: any) => {
        if (result && mountedRef.current) {
          onScanSuccess(result.getText());
        }
        // NotFoundException is normal while scanning
      });
      
      if (mountedRef.current) setIsInitializing(false);
    } catch (err: any) {
      console.error('Barcode scanner error:', err);
      if (mountedRef.current) {
        setError("Failed to start camera. Please ensure permissions are granted.");
        setIsInitializing(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    if (isOpen) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        initScanner();
      }, 100);
      return () => {
        clearTimeout(timer);
        mountedRef.current = false;
        if (codeReaderRef.current) {
          codeReaderRef.current.reset();
        }
      };
    }
    return () => {
        mountedRef.current = false;
    };
  }, [isOpen]);

  const handleSwitchCamera = async () => {
    const devices = await getAvailableCameras();
    if (devices.length < 2) return;
    
    const currentId = codeReaderRef.current?.deviceId;
    const nextDevice = devices.find(d => d.deviceId !== currentId) || devices[0];
    initScanner(nextDevice.deviceId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-0 md:p-4">
      <div className="bg-black rounded-none md:rounded-2xl shadow-2xl max-w-2xl w-full h-full md:max-h-[80vh] flex flex-col relative overflow-hidden">
        
        {/* Overlay UI */}
        <header className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-6 bg-gradient-to-b from-black/70 to-transparent">
          <div>
            <h2 className="text-xl font-bold text-white">Scan Barcode</h2>
            <p className="text-xs text-white/60">Place code inside the frame</p>
          </div>
          <button onClick={onClose} className="text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <video 
          ref={videoRef} 
          muted 
          playsInline 
          className="w-full h-full object-cover"
        />

        {/* Scan Area Guide */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="w-64 h-64 relative border-2 border-white/30 rounded-3xl bg-black/10 backdrop-blur-[1px]">
                <div className="absolute -top-1 -left-1 border-t-4 border-l-4 border-brand-green w-12 h-12 rounded-tl-3xl"></div>
                <div className="absolute -top-1 -right-1 border-t-4 border-r-4 border-brand-green w-12 h-12 rounded-tr-3xl"></div>
                <div className="absolute -bottom-1 -left-1 border-b-4 border-l-4 border-brand-green w-12 h-12 rounded-bl-3xl"></div>
                <div className="absolute -bottom-1 -right-1 border-b-4 border-r-4 border-brand-green w-12 h-12 rounded-br-3xl"></div>
                <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-brand-green shadow-[0_0_10px_#16a34a] animate-scan-line"></div>
            </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-6 z-20">
             <button 
              onClick={handleSwitchCamera}
              className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all border border-white/20"
              title="Switch Camera"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </button>
        </div>

        {isInitializing && (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-30">
            <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white font-medium">Initializing Camera...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-8 text-center z-40">
            <p className="text-red-400 font-bold mb-4">{error}</p>
            <button onClick={() => initScanner()} className="px-6 py-2 bg-brand-green text-white rounded-full font-bold">Try Again</button>
          </div>
        )}

      </div>
       <style>{`
            @keyframes scan {
                0% { transform: translateY(-110px); opacity: 0; }
                20% { opacity: 1; }
                80% { opacity: 1; }
                100% { transform: translateY(110px); opacity: 0; }
            }
            .animate-scan-line {
                animation: scan 2s ease-in-out infinite;
            }
        `}</style>
    </div>
  );
};

export default BarcodeScannerModal;