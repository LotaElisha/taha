import React, { useState, useRef, useCallback, useEffect } from 'react';
import { analyzePlantImage, getAI } from '../services/geminiService';
import { PlantAnalysisResult, Product, Agrodealer, Agrovet } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { calculateDistance } from '../services/geolocationService';
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenAIBlob } from '@google/genai';
import { getCameraStream, setTorch, getTrackCapabilities, CameraCapabilities, getEnvironmentCameraId } from '../services/cameraService';

interface PlantScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

interface DealerSuggestion {
  dealer: Agrodealer | Agrovet;
  distance: number | null;
  products: Product[];
}

type View = 'initial' | 'camera' | 'preview' | 'result';

// Audio Helpers
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function createBlob(data: Float32Array): GenAIBlob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const PlantScannerModal: React.FC<PlantScannerModalProps> = ({ isOpen, onClose, products }) => {
  const { location: userLocation } = useAuth();
  const { locale } = useLanguage();
  const languageName = locale === 'sw' ? 'Swahili' : 'English';

  const translations = {
    en: {
      modalTitle: "Plant Scanner Pro",
      aiLeafDiagnosis: "AI Leaf Diagnosis",
      introDesc: "Our AI identifies thousands of pests and diseases in seconds. Take a clear photo of the affected area or upload a previously taken image.",
      useCamera: "Use Camera",
      uploadImage: "Upload Image",
      discard: "Discard",
      confirmAnalyze: "Confirm & Analyze",
      analyzing: "Analyzing...",
      scanNewPlant: "Scan New Plant",
      aiDiagnosis: "AI Diagnosis",
      talkToExpert: "Talk to Expert",
      causes: "Causes",
      recommendedTreatment: "Recommended Treatment",
      nearbyDealers: "Nearby Stocking Dealers",
      centerLeaf: "Center leaf in the target area",
      cancel: "Cancel",
      startingCamera: "Starting Camera...",
      cameraError: "Camera access failed. Check permissions.",
      analysisError: "Analysis failed. Please try a clearer photo.",
      scanComplete: "SCAN COMPLETE",
      voiceConnecting: "Connecting...",
      voiceListening: "Listening... Speak now",
      voiceSpeaking: "Expert is responding...",
      voiceIdle: "Tap to talk to Expert",
    },
    sw: {
      modalTitle: "Kipima Mimea Pro",
      aiLeafDiagnosis: "Uchunguzi wa Majani kwa AI",
      introDesc: "AI yetu inatambua maelfu ya wadudu na magonjwa kwa sekunde chache. Piga picha wazi ya jani lililoathiriwa au pakia picha ya mmea.",
      useCamera: "Tumia Kamera",
      uploadImage: "Pakia Picha",
      discard: "Futa Picha",
      confirmAnalyze: "Thibitisha na Uchambue",
      analyzing: "Inachambua...",
      scanNewPlant: "Chunguza Mmea Mpya",
      aiDiagnosis: "Utambuzi wa AI",
      talkToExpert: "Ongea na Mtaalamu",
      causes: "Vyanzo na Sababu",
      recommendedTreatment: "Matibabu Yanayopendekezwa",
      nearbyDealers: "Wauzaji wa Karibu Wenye Bidhaa",
      centerLeaf: "Weka jani katikati ya duara",
      cancel: "Ghairi",
      startingCamera: "Kamera inawashwa...",
      cameraError: "Imeshindwa kufikia kamera. Angalia ruhusa.",
      analysisError: "Uchambuzi umeshindwa. Tafadhali piga picha iliyo wazi zaidi.",
      scanComplete: "UCHUNGUZI UMEKAMILIKA",
      voiceConnecting: "Inaunganisha...",
      voiceListening: "Inasikiliza... Ongea sasa",
      voiceSpeaking: "Mtaalamu anajibu...",
      voiceIdle: "Gonga ili uongee na Mtaalamu",
    }
  };

  const t = translations[locale === 'sw' ? 'sw' : 'en'];
  
  const [view, setView] = useState<View>('initial');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PlantAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [suggestedDealers, setSuggestedDealers] = useState<DealerSuggestion[]>([]);
  const [isFindingDealers, setIsFindingDealers] = useState(false);
  
  // Camera State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [capabilities, setCapabilities] = useState<CameraCapabilities>({ hasTorch: false, canSwitch: false });
  const [isShutterActive, setIsShutterActive] = useState(false);

  // Voice Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const nextStartTimeRef = useRef<number>(0);
  const sourceNodesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const isInitInProgressRef = useRef(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }
    setIsTorchOn(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const stopVoice = useCallback(() => {
    if (sessionRef.current) {
      if (typeof sessionRef.current.close === 'function') sessionRef.current.close();
      sessionRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (inputAudioContextRef.current) {
      if (inputAudioContextRef.current.state !== 'closed') {
        inputAudioContextRef.current.close().catch(console.error);
      }
      inputAudioContextRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
      }
      audioContextRef.current = null;
    }
    setIsVoiceActive(false);
    setVoiceStatus('idle');
  }, []);

  const startCamera = async (mode = facingMode) => {
    setCameraError(null);
    setFacingMode(mode);
    setView('camera');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setView('preview');
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    if (view === 'camera' && !streamRef.current && !isInitInProgressRef.current) {
      const initHardware = async () => {
        isInitInProgressRef.current = true;
        setIsCameraLoading(true);
        try {
          const deviceId = facingMode === 'environment' ? await getEnvironmentCameraId() : undefined;
          const stream = await getCameraStream(deviceId, facingMode);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            try {
              await videoRef.current.play();
            } catch (playErr) {
              console.warn("Autoplay policy might require interaction", playErr);
            }
            streamRef.current = stream;
            setCapabilities(getTrackCapabilities(stream));
            setCameraError(null);
          }
        } catch (err) {
          console.error("Camera hardware error:", err);
          setCameraError(t.cameraError);
          setView('initial');
        } finally {
          setIsCameraLoading(false);
          isInitInProgressRef.current = false;
        }
      };
      initHardware();
    }
    
    return () => {
        if (view !== 'camera') {
            stopCamera();
            isInitInProgressRef.current = false;
        }
    };
  }, [view, facingMode, stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
      stopVoice();
    };
  }, [stopCamera, stopVoice]);

  const handleToggleTorch = async () => {
    if (streamRef.current) {
        const newState = !isTorchOn;
        const success = await setTorch(streamRef.current, newState);
        if (success) setIsTorchOn(newState);
    }
  };

  const handleSwitchCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    stopCamera();
    setFacingMode(nextMode);
  };

  const handleTakePicture = () => {
    if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
        setIsShutterActive(true);
        setTimeout(() => setIsShutterActive(false), 150);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            setSelectedImage(dataUrl);
            stopCamera();
            setView('preview');
        }
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    setErrorMessage(null);
    try {
      const [header, base64Data] = selectedImage.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
      const result = await analyzePlantImage(base64Data, mimeType, languageName);
      setAnalysisResult(result);
      setView('result');
    } catch (error) {
      setErrorMessage(t.analysisError);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startVoiceChat = async () => {
    if (!analysisResult || !process.env.API_KEY) return;
    setIsVoiceActive(true);
    setVoiceStatus('connecting');
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const inCtx = new AudioContextClass({ sampleRate: 16000 });
        const outCtx = new AudioContextClass({ sampleRate: 24000 });
        await Promise.all([inCtx.resume(), outCtx.resume()]);
        
        inputAudioContextRef.current = inCtx;
        audioContextRef.current = outCtx;
        nextStartTimeRef.current = outCtx.currentTime;

        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = micStream;
        const ai = getAI();
        
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash',
            callbacks: {
                onopen: () => {
                    setVoiceStatus('listening');
                    const source = inCtx.createMediaStreamSource(micStream);
                    const processor = inCtx.createScriptProcessor(4096, 1, 1);
                    processor.onaudioprocess = (e) => {
                        const pcmBlob = createBlob(e.inputBuffer.getChannelData(0));
                        sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
                    };
                    source.connect(processor);
                    processor.connect(inCtx.destination);
                },
                onmessage: async (msg: LiveServerMessage) => {
                    const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (audioData) {
                        setVoiceStatus('speaking');
                        const buffer = await decodeAudioData(decode(audioData), outCtx, 24000, 1);
                        const source = outCtx.createBufferSource();
                        source.buffer = buffer;
                        source.connect(outCtx.destination);
                        const startTime = Math.max(outCtx.currentTime, nextStartTimeRef.current);
                        source.start(startTime);
                        nextStartTimeRef.current = startTime + buffer.duration;
                        sourceNodesRef.current.add(source);
                        source.onended = () => {
                            sourceNodesRef.current.delete(source);
                            if (sourceNodesRef.current.size === 0) setVoiceStatus('listening');
                        };
                    }
                },
                onclose: () => stopVoice(),
                onerror: () => stopVoice()
            },
            config: {
                responseModalities: [Modality.AUDIO],
                systemInstruction: `You are an expert agronomist. Diagnosis: ${analysisResult.diagnosis}. Causes: ${analysisResult.causes}. Recommendations: ${analysisResult.recommendations}. Help the farmer with follow-up questions. Respond in ${languageName}.`
            }
        });
        sessionRef.current = await sessionPromise;
    } catch (e) {
        stopVoice();
    }
  };

  useEffect(() => {
    if (view === 'result' && analysisResult?.suggestedProductTypes) {
      setIsFindingDealers(true);
      const matched = products.filter(p => 
        analysisResult.suggestedProductTypes.some(term => 
          p.name.toLowerCase().includes(term.toLowerCase()) || p.description.toLowerCase().includes(term.toLowerCase())
        )
      );
      const dealersMap = matched.reduce((acc: Record<string, DealerSuggestion>, p) => {
          if (!acc[p.vendor.id]) {
              acc[p.vendor.id] = { 
                  dealer: p.vendor, 
                  products: [], 
                  distance: userLocation && p.vendor.coords ? calculateDistance(userLocation.lat, userLocation.lon, p.vendor.coords.lat, p.vendor.coords.lon) : null 
              };
          }
          acc[p.vendor.id].products.push(p);
          return acc;
      }, {} as Record<string, DealerSuggestion>);
      setSuggestedDealers((Object.values(dealersMap) as DealerSuggestion[]).sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999)));
      setIsFindingDealers(false);
    }
  }, [view, analysisResult, products, userLocation]);

  const resetState = () => {
    setView('initial');
    setSelectedImage(null);
    setAnalysisResult(null);
    setErrorMessage(null);
    stopCamera();
    stopVoice();
    isInitInProgressRef.current = false;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-0 md:p-4 animate-fade-in">
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-none md:rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-2xl max-w-4xl w-full h-full max-h-[100vh] md:max-h-[85vh] flex flex-col overflow-hidden transition-all duration-300 ease-out">
        
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-4 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md z-20">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <h2 className="text-xl font-black bg-gradient-to-r from-brand-700 to-emerald-600 dark:from-brand-400 dark:to-emerald-300 bg-clip-text text-transparent tracking-tight">
              {t.modalTitle}
            </h2>
          </div>
          <button 
            onClick={() => { onClose(); resetState(); }} 
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 cursor-pointer"
            aria-label="Close Scanner"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* View Decider */}
        {view === 'camera' ? (
          <div className="flex-grow relative bg-zinc-950 flex items-center justify-center overflow-hidden">
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline 
              className={`h-full w-full object-cover transition-opacity duration-500 ${isCameraLoading ? 'opacity-0' : 'opacity-100'}`} 
            />
            
            {isShutterActive && <div className="absolute inset-0 bg-white z-50 animate-shutter"></div>}

            {/* Viewfinder Diagnostic Overlay (HUD) */}
            {!isCameraLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
                <div className="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center">
                  
                  {/* HUD Brackets */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-lg shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                  
                  {/* Glowing Laser Scan Line */}
                  <div className="absolute left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-laser-scan"></div>
                  
                  {/* Technical Orbit Reticles */}
                  <div className="w-60 h-60 border-2 border-emerald-500/20 rounded-full flex items-center justify-center relative">
                    <div className="w-56 h-56 border border-dashed border-emerald-500/30 rounded-full animate-tech-spin"></div>
                    <div className="absolute w-48 h-48 border border-emerald-500/40 rounded-full animate-tech-spin-reverse"></div>
                    <div className="absolute w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></div>
                  </div>
                </div>
                
                {/* Overlay Prompt */}
                <p className="mt-8 text-center text-white/95 text-xs font-bold bg-black/60 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/10 tracking-wide shadow-lg uppercase">
                  {t.centerLeaf}
                </p>
              </div>
            )}

            {/* Translucent Glass Controls */}
            {!isCameraLoading && (
              <div className="absolute top-6 right-6 flex flex-col gap-3.5 z-20">
                {capabilities.hasTorch && (
                  <button 
                    onClick={handleToggleTorch} 
                    className={`p-3.5 rounded-2xl backdrop-blur-xl border transition-all duration-300 cursor-pointer ${
                      isTorchOn 
                        ? 'bg-amber-400 border-amber-300 text-amber-950 shadow-[0_0_20px_rgba(251,191,36,0.6)] scale-110' 
                        : 'bg-black/50 border-white/10 hover:border-white/20 text-white hover:bg-black/70'
                    }`}
                    aria-label="Toggle Flashlight"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14H11V21L20 10H13Z"/></svg>
                  </button>
                )}
                {capabilities.canSwitch && (
                  <button 
                    onClick={handleSwitchCamera} 
                    className="p-3.5 rounded-2xl bg-black/50 border border-white/10 hover:border-white/20 text-white backdrop-blur-xl hover:bg-black/70 active:scale-95 transition-all duration-300 cursor-pointer"
                    aria-label="Switch Camera"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  </button>
                )}
              </div>
            )}

            {/* Shutter Button Grid */}
            {!isCameraLoading && (
              <div className="absolute bottom-8 left-0 right-0 flex justify-between items-center px-10 z-20">
                <button 
                  onClick={resetState} 
                  className="text-white/90 text-sm font-bold bg-black/60 hover:bg-black/80 px-5 py-2.5 rounded-2xl border border-white/10 hover:border-white/20 backdrop-blur-md transition-all active:scale-95 shadow-md cursor-pointer"
                >
                  {t.cancel}
                </button>
                
                <button 
                  onClick={handleTakePicture} 
                  className="w-20 h-20 bg-white/25 rounded-full p-1.5 backdrop-blur-md transform active:scale-90 transition-all hover:scale-105 border border-white/40 shadow-2xl flex items-center justify-center cursor-pointer"
                  aria-label="Take Photo"
                >
                  <div className="w-full h-full rounded-full border-4 border-white/60 bg-gradient-to-tr from-emerald-500 to-brand-500 hover:from-emerald-400 hover:to-brand-400 transition-all duration-300"></div>
                </button>
                
                {/* Spacer balance */}
                <div className="w-[78px] invisible"></div>
              </div>
            )}

            {/* Camera Initialization Loader */}
            {isCameraLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 z-30">
                <div className="w-14 h-14 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(16,185,129,0.2)]"></div>
                <p className="text-white/80 text-sm font-semibold tracking-wider animate-pulse">{t.startingCamera}</p>
              </div>
            )}
          </div>
        ) : view === 'initial' ? (
          <div className="flex-grow flex flex-col items-center justify-center p-6 md:p-12 text-center space-y-8 bg-gradient-to-br from-brand-900 via-brand-950 to-emerald-950 text-white overflow-y-auto relative">
             
             {/* Dynamic Mesh Overlays */}
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
             <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-brand-500/10 blur-[85px] pointer-events-none" />
             <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-72 h-72 rounded-full bg-emerald-500/10 blur-[85px] pointer-events-none" />

             {/* technical glowing target graphic */}
             <div className="relative z-10 w-36 h-36 flex items-center justify-center">
                {/* Spinning dashed orbit circle */}
                <div className="absolute inset-0 border-2 border-dashed border-brand-300/30 rounded-full animate-tech-spin"></div>
                <div className="absolute inset-2 border border-dotted border-emerald-400/20 rounded-full animate-tech-spin-reverse"></div>
                
                {/* Inner central badge */}
                <div className="w-24 h-24 bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-emerald-400 shadow-xl relative">
                  <svg className="w-11 h-11 filter drop-shadow-[0_2px_8px_rgba(52,211,153,0.3)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <div className="absolute -bottom-1 bg-brand-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-md uppercase tracking-widest border border-white/10 scale-95">
                    AI PRO
                  </div>
                </div>
             </div>

             {/* Headline block */}
             <div className="max-w-md mx-auto space-y-3 z-10">
                <h3 className="text-3xl font-black text-white leading-tight tracking-tight">
                  {t.aiLeafDiagnosis}
                </h3>
                <p className="text-brand-100/80 text-sm leading-relaxed max-w-sm mx-auto">
                  {t.introDesc}
                </p>
             </div>
             
             {/* Action triggers */}
             <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-sm z-10">
                <button 
                  onClick={() => startCamera()} 
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-brand-600 hover:from-emerald-600 hover:to-brand-700 text-white font-black rounded-2xl shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span>{t.useCamera}</span>
                </button>
                <button 
                  onClick={triggerFileUpload}
                  className="w-full py-4 bg-white/10 hover:bg-white/15 text-white font-black rounded-2xl border border-white/20 shadow-sm backdrop-blur-md transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                  </svg>
                  <span>{t.uploadImage}</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
             </div>
             
             {cameraError && (
               <p className="text-red-300 text-xs font-semibold bg-red-950/40 border border-red-500/20 px-4 py-2.5 rounded-xl z-10 animate-fade-in shadow-inner">
                 ⚠️ {cameraError}
               </p>
             )}
          </div>
        ) : view === 'preview' ? (
          <div className="flex-grow flex flex-col items-center p-6 space-y-6 bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 overflow-y-auto">
             <div className="relative group rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-zinc-800 transition-all duration-300">
                <img src={selectedImage!} className="max-h-[50vh] object-cover" alt="Preview" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none"></div>
                <div className="absolute top-4 left-4 bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-md uppercase tracking-wider">
                  {t.scanComplete}
                </div>
             </div>
             
             {errorMessage && (
               <p className="text-red-500 dark:text-red-400 text-xs font-semibold bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 px-4 py-2.5 rounded-xl animate-fade-in">
                 ⚠️ {errorMessage}
               </p>
             )}

             <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <button 
                  onClick={resetState} 
                  className="flex-1 py-3.5 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-2xl font-black text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-all cursor-pointer active:scale-[0.98]"
                >
                  {t.discard}
                </button>
                <button 
                  onClick={handleAnalyze} 
                  disabled={isAnalyzing} 
                  className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-brand-600 hover:from-emerald-600 hover:to-brand-700 text-white rounded-2xl font-black shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2 active:scale-[0.98]"
                >
                  {isAnalyzing ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      <span>{t.analyzing}</span>
                    </>
                  ) : t.confirmAnalyze}
                </button>
             </div>
          </div>
        ) : (
          <main className="flex-grow p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-8 bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
             
             {/* Left Column - Specimen Image Frame */}
             <div className="md:col-span-5 space-y-6">
                <div className="bg-white dark:bg-zinc-800 p-2.5 rounded-3xl shadow-xl border border-zinc-200/60 dark:border-zinc-700/60">
                  <div className="relative rounded-2xl overflow-hidden shadow-md">
                      <img src={selectedImage!} className="w-full object-cover max-h-[40vh] md:max-h-[50vh]" alt="Analyzed specimen" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"></div>
                      <div className="absolute top-4 left-4 bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-md uppercase tracking-wider">
                          {t.scanComplete}
                      </div>
                  </div>
                </div>
                <button 
                  onClick={resetState} 
                  className="w-full py-3.5 bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-black text-sm text-zinc-800 dark:text-zinc-100 shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
                >
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{t.scanNewPlant}</span>
                </button>
             </div>

             {/* Right Column - AI Diagnostic Report Card */}
             <div className="md:col-span-7 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-xl border border-zinc-200/50 dark:border-zinc-700/50 space-y-6 h-fit">
                
                {/* AI diagnosis header details */}
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                        <p className="text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] uppercase tracking-widest">{t.aiDiagnosis}</p>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-zinc-950 dark:text-white leading-tight">{analysisResult?.diagnosis}</h3>
                </div>

                {/* Voice consult call-out panel */}
                <div className="bg-gradient-to-r from-emerald-500/5 to-brand-500/5 dark:from-emerald-500/10 dark:to-brand-500/5 border border-emerald-500/20 dark:border-emerald-500/10 p-4 rounded-2xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-1">
                          🗣️ {locale === 'sw' ? 'Mshauri wa Sauti wa AI' : 'AI Voice Consultant'}
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {isVoiceActive ? (
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 animate-pulse">
                              {voiceStatus === 'connecting' ? t.voiceConnecting : 
                               voiceStatus === 'listening' ? t.voiceListening : 
                               voiceStatus === 'speaking' ? t.voiceSpeaking : t.voiceIdle}
                            </span>
                          ) : (
                            locale === 'sw' ? 'Uliza maswali ya ziada kwa sauti' : 'Ask follow-up questions in real-time'
                          )}
                        </p>
                    </div>
                    
                    <button 
                        onClick={isVoiceActive ? stopVoice : startVoiceChat} 
                        className={`relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 cursor-pointer shadow-md ${
                          isVoiceActive 
                            ? voiceStatus === 'listening' 
                              ? 'bg-emerald-500 text-white animate-voice-listening shadow-emerald-500/30' 
                              : voiceStatus === 'speaking'
                                ? 'bg-rose-500 text-white animate-voice-speaking shadow-rose-500/30'
                                : 'bg-amber-500 text-white animate-pulse shadow-amber-500/30'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105 active:scale-95'
                        }`}
                        title={t.talkToExpert}
                        aria-label={t.talkToExpert}
                    >
                        {isVoiceActive && (
                            <span className={`absolute inset-0 rounded-2xl border-2 animate-ping opacity-75 ${
                              voiceStatus === 'listening' ? 'border-emerald-400' : 'border-rose-400'
                            }`}></span>
                        )}
                        {isVoiceActive && voiceStatus === 'connecting' && (
                            <div className="absolute inset-0 border-2 border-dashed border-white rounded-2xl animate-spin"></div>
                        )}
                        
                        <svg className="w-5 h-5 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                        </svg>
                    </button>
                </div>

                {/* Details reports */}
                <div className="space-y-5">
                    <div className="space-y-1.5">
                        <p className="font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-[10px]">{t.causes}</p>
                        <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200/30 dark:border-zinc-800/30">
                          {analysisResult?.causes}
                        </p>
                    </div>
                    
                    <div className="space-y-1.5">
                        <p className="font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-[10px]">{t.recommendedTreatment}</p>
                        <div className="text-emerald-950 dark:text-emerald-100 text-sm leading-relaxed bg-emerald-500/5 dark:bg-emerald-500/10 p-5 rounded-2xl border-l-4 border-emerald-500 shadow-inner relative overflow-hidden">
                            <div className="absolute right-2 bottom-2 text-emerald-500/5 dark:text-emerald-400/5 pointer-events-none transform translate-y-2 translate-x-2">
                                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17 8C8 10 5.9 16.17 6 21c4-1 9-4 11-13z" />
                                    <path d="M2 2c10 2 12.9 8.17 13 13c-4-1-9-4-11-13z" />
                                </svg>
                            </div>
                            <div className="relative z-10 font-medium">
                                {analysisResult?.recommendations}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Nearby Stockists (Geo-aware distance badge) */}
                {suggestedDealers.length > 0 && (
                    <div className="pt-6 border-t border-zinc-200/50 dark:border-zinc-800/50">
                        <p className="font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-[10px] mb-3">{t.nearbyDealers}</p>
                        <div className="grid grid-cols-1 gap-2.5">
                            {suggestedDealers.slice(0, 3).map(d => (
                                <div 
                                    key={d.dealer.id} 
                                    className="flex justify-between items-center p-3.5 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/40 group hover:bg-emerald-500/5 dark:hover:bg-emerald-500/5 hover:border-emerald-500/30 dark:hover:border-emerald-500/20 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <span className="font-bold text-sm text-zinc-800 dark:text-zinc-100 leading-none">{d.dealer.name}</span>
                                    </div>
                                    {d.distance && (
                                        <span className="text-[10px] bg-emerald-100/60 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-full font-black tracking-wider uppercase tabular-nums">
                                          ~{d.distance.toFixed(1)} km
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
             </div>
          </main>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
      
      {/* Visual HUD + Custom animations */}
      <style>{`
        @keyframes shutter { 0% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; } }
        .animate-shutter { animation: shutter 0.15s ease-out forwards; }
        
        @keyframes laser-scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .animate-laser-scan {
          animation: laser-scan 3.5s linear infinite;
        }

        @keyframes voice-pulse-listening {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 20px rgba(16, 185, 129, 0.5); }
        }
        @keyframes voice-pulse-speaking {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 20px rgba(244, 63, 94, 0.5); }
        }
        .animate-voice-listening {
          animation: voice-pulse-listening 1.5s infinite ease-in-out;
        }
        .animate-voice-speaking {
          animation: voice-pulse-speaking 1.2s infinite ease-in-out;
        }

        @keyframes tech-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-tech-spin {
          animation: tech-spin 25s linear infinite;
        }
        .animate-tech-spin-reverse {
          animation: tech-spin 18s linear infinite reverse;
        }
      `}</style>
    </div>
  );
};

export default PlantScannerModal;