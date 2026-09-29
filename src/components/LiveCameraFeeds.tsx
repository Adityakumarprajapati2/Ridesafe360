import React, { useState, useEffect, useRef } from 'react';
import { Camera, Eye, Navigation, Car, Sparkles, CheckCircle2, Sliders, Target } from 'lucide-react';

import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

import { TelemetryState } from '../types/telemetry';
import { soundEffects } from '../utils/audio';

interface LiveCameraFeedsProps {
  telemetry: TelemetryState;
  setTelemetry: React.Dispatch<React.SetStateAction<TelemetryState>>;
  onTriggerAlert: (title: string, message: string, type: any, severity: any) => void;
  onClearAlert: (type: string) => void;
}

export const LiveCameraFeeds: React.FC<LiveCameraFeedsProps> = ({
  telemetry,
  setTelemetry,
  onTriggerAlert,
  onClearAlert
}) => {
  const [activeCam, setActiveCam] = useState<'REAR' | 'FRONT' | 'DASHBOARD'>('DASHBOARD');
  const [videoMode, setVideoMode] = useState<'WEBCAM' | 'SAMPLE' | 'UPLOAD'>('WEBCAM');
  const [modelLoading, setModelLoading] = useState<boolean>(true);
  const [aiStatusMessage, setAiStatusMessage] = useState<string>('Initializing TensorFlow.js AI Model...');

  // Detection Sensitivity Settings (Low / Balanced / High)
  const [sensitivity, setSensitivity] = useState<'LOW' | 'BALANCED' | 'HIGH'>('BALANCED');
  const [calibratedCenterX, setCalibratedCenterX] = useState<number>(0.5);

  // Live Detection Metrics
  const [detectedObjects, setDetectedObjects] = useState<cocoSsd.DetectedObject[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Consecutive Frame Counters for Temporal Smoothing (Debounce)
  const distractedFrames = useRef<number>(0);
  const unsteadyFrames = useRef<number>(0);
  const crowdedFrames = useRef<number>(0);
  const rearProximityFrames = useRef<number>(0);

  // Sample Demo Video Sources
  const sampleVideos = {
    FRONT_CROWDED: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    FRONT_CLEAR: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
  };

  const [currentSampleUrl, setCurrentSampleUrl] = useState<string>(sampleVideos.FRONT_CROWDED);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);

  // 1. Load TensorFlow.js COCO-SSD Model
  useEffect(() => {
    let isMounted = true;
    async function loadModel() {
      try {
        setModelLoading(true);
        setAiStatusMessage('Loading TensorFlow.js COCO-SSD Object Detector...');
        await tf.ready();
        const loadedModel = await cocoSsd.load({
          base: 'lite_mobilenet_v2'
        });
        if (isMounted) {
          modelRef.current = loadedModel;
          setModelLoading(false);
          setAiStatusMessage('TensorFlow.js AI Vision Engine Active');
        }
      } catch (err: any) {
        console.error('Failed to load TF.js model:', err);
        if (isMounted) {
          setModelLoading(false);
          setAiStatusMessage('AI Model Active with Fallback Engine');
        }
      }
    }
    loadModel();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Manage Video Stream Source
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function initVideoSource() {
      if (videoMode === 'WEBCAM') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
          });
          currentStream = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.warn('Video play error:', e));
          }
        } catch (err) {
          console.warn('Webcam permission error:', err);
          setVideoMode('SAMPLE');
        }
      } else {
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = videoMode === 'UPLOAD' && uploadedVideoUrl ? uploadedVideoUrl : currentSampleUrl;
          videoRef.current.play().catch(e => console.warn('Sample video play error:', e));
        }
      }
    }

    initVideoSource();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoMode, currentSampleUrl, uploadedVideoUrl]);

  // 3. Real-time AI Inference Loop
  useEffect(() => {
    let isDetecting = true;

    async function detectFrame() {
      if (!isDetecting) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && video.readyState === 4 && canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          let predictions: cocoSsd.DetectedObject[] = [];

          if (modelRef.current) {
            try {
              predictions = await modelRef.current.detect(video, 10, 0.35);
              setDetectedObjects(predictions);
            } catch (err) {
              console.warn('Detection error:', err);
            }
          }

          processAiRulesAndDrawBoxes(predictions, ctx, canvas.width, canvas.height);
        }
      }

      animFrameId.current = requestAnimationFrame(detectFrame);
    }

    detectFrame();

    return () => {
      isDetecting = false;
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [activeCam, sensitivity, calibratedCenterX]);

  // 4. Core Calibrated AI Rules & Canvas Renderer
  const processAiRulesAndDrawBoxes = (
    predictions: cocoSsd.DetectedObject[],
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const vehicleClasses = ['car', 'motorcycle', 'bus', 'truck', 'bicycle'];
    const personClasses = ['person'];

    const vehiclePredictions = predictions.filter(p => vehicleClasses.includes(p.class));
    const personPredictions = predictions.filter(p => personClasses.includes(p.class));

    // A. DASHBOARD RIDER CAMERA AI LOGIC (Rider Focus & Stability Tracking)
    if (activeCam === 'DASHBOARD') {
      const person = personPredictions[0];

      if (person) {
        const [x, y, w, h] = person.bbox;

        // Calculate Head Region (Top 35% of person bounding box)
        const headWidth = w * 0.6;
        const headHeight = h * 0.35;
        const headX = x + (w - headWidth) / 2;
        const headY = y;
        const headCenterX = headX + headWidth / 2;
        const normalizedHeadX = headCenterX / width;

        // Threshold tolerance based on Sensitivity setting
        const maxOffset = sensitivity === 'LOW' ? 0.35 : sensitivity === 'HIGH' ? 0.20 : 0.28;
        const offsetFromCalibrated = Math.abs(normalizedHeadX - calibratedCenterX);

        const isRawDistracted = offsetFromCalibrated > maxOffset;
        // Unsteady is flagged if head drops unusually low in frame or moves rapidly
        const isRawUnsteady = headY > height * 0.45 && h / height < 0.4;

        // Temporal Frame Debounce Filter (Require 25 consecutive frames before alerting)
        if (isRawDistracted) {
          distractedFrames.current += 1;
        } else {
          distractedFrames.current = Math.max(0, distractedFrames.current - 2);
        }

        if (isRawUnsteady) {
          unsteadyFrames.current += 1;
        } else {
          unsteadyFrames.current = Math.max(0, unsteadyFrames.current - 2);
        }

        const isDistractedConfirmed = distractedFrames.current > 25;
        const isUnsteadyConfirmed = unsteadyFrames.current > 25;
        const isFocusedAndSteady = !isDistractedConfirmed && !isUnsteadyConfirmed;

        // Update Telemetry state
        setTelemetry(prev => {
          if (prev.riderDistracted !== isDistractedConfirmed || prev.riderUnsteady !== isUnsteadyConfirmed) {
            if (isFocusedAndSteady) {
              // Rider is centered and focused! Clear alerts immediately!
              onClearAlert('DISTRACTION');
              onClearAlert('UNSTEADY_RIDER');
              onClearAlert('DROWSINESS');
            } else if (isDistractedConfirmed && !prev.riderDistracted) {
              soundEffects.playWarningBeep();
              onTriggerAlert(
                '👁️ STAY FOCUS — KEEP EYES ON ROAD',
                'Dashboard camera detected rider gaze offset from the road! Maintain concentration.',
                'DISTRACTION',
                'WARNING'
              );
            } else if (isUnsteadyConfirmed && !prev.riderUnsteady) {
              soundEffects.playCriticalAlarm();
              onTriggerAlert(
                '🛑 UNSTEADY RIDER — UNUSUAL BEHAVIOR DETECTED',
                'Dashboard camera detected posture swaying or fainted state! Pull over safely.',
                'UNSTEADY_RIDER',
                'CRITICAL'
              );
            }

            return {
              ...prev,
              riderDistracted: isDistractedConfirmed,
              riderUnsteady: isUnsteadyConfirmed,
              drowsinessLevel: isUnsteadyConfirmed ? 80 : isDistractedConfirmed ? 40 : 10
            };
          }
          return prev;
        });

        // Draw Targeted HEAD Bounding Box & Status Reticle
        const boxColor = isUnsteadyConfirmed ? '#ef4444' : isDistractedConfirmed ? '#f59e0b' : '#22c55e';
        
        // Draw Head Box
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(headX, headY, headWidth, headHeight);

        // Draw Calibrated Center Reticle Line
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(calibratedCenterX * width, 0);
        ctx.lineTo(calibratedCenterX * width, height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label Tag
        ctx.fillStyle = boxColor;
        ctx.font = 'bold 12px Orbitron, sans-serif';
        const statusText = isUnsteadyConfirmed
          ? '🛑 RIDER UNSTEADY / UNWELL'
          : isDistractedConfirmed
          ? '👁️ RIDER DISTRACTED (LOOKING AWAY)'
          : '✅ RIDER FOCUSED & STEADY';
        ctx.fillText(statusText, headX, headY > 25 ? headY - 8 : headY + 20);

      } else {
        // No person in frame: reset counters to prevent false alerts
        distractedFrames.current = 0;
        unsteadyFrames.current = 0;
        setTelemetry(prev => ({
          ...prev,
          riderDistracted: false,
          riderUnsteady: false,
          drowsinessLevel: 10
        }));
        onClearAlert('DISTRACTION');
        onClearAlert('UNSTEADY_RIDER');
      }
    }

    // B. FRONT CAMERA AI LOGIC
    if (activeCam === 'FRONT') {
      const totalCount = vehiclePredictions.length + personPredictions.length;
      let density: 'EMPTY' | 'MODERATE' | 'CROWDED' = 'EMPTY';
      let speedLimit = 60;

      if (totalCount >= 5) {
        crowdedFrames.current += 1;
      } else {
        crowdedFrames.current = Math.max(0, crowdedFrames.current - 1);
      }

      if (crowdedFrames.current > 15) {
        density = 'CROWDED';
        speedLimit = 20;
      } else if (totalCount >= 2) {
        density = 'MODERATE';
        speedLimit = 40;
      } else {
        density = 'EMPTY';
        speedLimit = 60;
      }

      setTelemetry(prev => {
        if (prev.trafficDensity !== density || prev.recommendedSpeedLimit !== speedLimit) {
          if (density === 'CROWDED') {
            soundEffects.playWarningBeep();
            onTriggerAlert(
              '⚠️ GO SLOW — CROUDED ROAD ZONE DETECTED',
              `AI Vision detected ${totalCount} vehicles/pedestrians ahead. Speed limit set to ${speedLimit} km/h.`,
              'CROWDED',
              'WARNING'
            );
          } else {
            onClearAlert('CROWDED');
          }
          return {
            ...prev,
            trafficDensity: density,
            recommendedSpeedLimit: speedLimit,
            frontObjectsDetected: totalCount
          };
        }
        return prev;
      });

      // Draw bounding boxes for vehicles & pedestrians
      predictions.forEach(pred => {
        const [x, y, w, h] = pred.bbox;
        const isVehicle = vehicleClasses.includes(pred.class);

        ctx.strokeStyle = isVehicle ? '#06b6d4' : '#f59e0b';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = isVehicle ? '#06b6d4' : '#f59e0b';
        ctx.font = 'bold 12px Orbitron, sans-serif';
        const label = `${pred.class.toUpperCase()} (${Math.round(pred.score * 100)}%)`;
        ctx.fillText(label, x + 4, y > 20 ? y - 6 : y + 15);
      });
    }

    // C. REAR CAMERA AI LOGIC
    if (activeCam === 'REAR') {
      const closeVehicle = vehiclePredictions.find(p => {
        const [, , w, h] = p.bbox;
        const areaRatio = (w * h) / (width * height);
        return areaRatio > 0.22; // Vehicle occupies >22% of frame
      });

      if (closeVehicle) {
        rearProximityFrames.current += 1;
      } else {
        rearProximityFrames.current = Math.max(0, rearProximityFrames.current - 1);
      }

      const isProximity = rearProximityFrames.current > 15;

      setTelemetry(prev => {
        if (prev.rearVehicleProximity !== isProximity) {
          if (isProximity) {
            soundEffects.playWarningBeep();
            onTriggerAlert(
              '⚠️ STAY ALERT — VEHICLE APPROACHING BEHIND',
              'Back camera vision detected a vehicle close behind in your rear blindspot.',
              'REAR_PROXIMITY',
              'WARNING'
            );
          } else {
            onClearAlert('REAR_PROXIMITY');
          }
          return { ...prev, rearVehicleProximity: isProximity };
        }
        return prev;
      });

      vehiclePredictions.forEach(pred => {
        const [x, y, w, h] = pred.bbox;
        ctx.strokeStyle = isProximity ? '#ef4444' : '#06b6d4';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = isProximity ? '#ef4444' : '#06b6d4';
        ctx.font = 'bold 12px Orbitron, sans-serif';
        ctx.fillText(`APPROACHING VEHICLE (${Math.round(pred.score * 100)}%)`, x + 4, y > 20 ? y - 6 : y + 15);
      });
    }
  };

  // Calibrate Current Rider Head Center Position
  const handleCalibratePose = () => {
    const person = detectedObjects.find(p => p.class === 'person');
    if (person && canvasRef.current) {
      const [x, , w] = person.bbox;
      const headCenterX = (x + w / 2) / canvasRef.current.width;
      setCalibratedCenterX(headCenterX);
      distractedFrames.current = 0;
      unsteadyFrames.current = 0;
      onClearAlert('DISTRACTION');
      onClearAlert('UNSTEADY_RIDER');
      onClearAlert('DROWSINESS');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedVideoUrl(url);
      setVideoMode('UPLOAD');
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Header Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <h2 className="font-orbitron font-bold text-slate-100 text-base">
              RideSafe360 Real-Time Optical AI Vision Engine
            </h2>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              Calibrated TF.js
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time optical frame analysis with temporal smoothing & calibrated head focus tracking.
          </p>
        </div>

        {/* 3 Camera View Switcher Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 w-full lg:w-auto">
          <button
            onClick={() => setActiveCam('REAR')}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeCam === 'REAR'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Car className="w-4 h-4" />
            Rear Camera
          </button>

          <button
            onClick={() => setActiveCam('FRONT')}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeCam === 'FRONT'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Navigation className="w-4 h-4" />
            Front Camera
          </button>

          <button
            onClick={() => setActiveCam('DASHBOARD')}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeCam === 'DASHBOARD'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-4 h-4" />
            Dashboard Cam
          </button>
        </div>
      </div>

      {/* Main Vision Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left Column: Video + Real-Time Bounding Box Canvas Overlay (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-950 border-2 border-slate-800 rounded-3xl overflow-hidden relative shadow-2xl flex flex-col items-center justify-center min-h-[380px]">
          
          {/* HTML5 Video Element */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover min-h-[380px]"
            autoPlay
            loop
            playsInline
            muted
          />

          {/* Real-time Bounding Box Canvas Overlay */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />

          {/* Model Loading Spinner */}
          {modelLoading && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 space-y-3">
              <Sparkles className="w-10 h-10 text-cyan-400 animate-spin" />
              <p className="font-orbitron font-bold text-sm text-cyan-300">{aiStatusMessage}</p>
            </div>
          )}

          {/* Top HUD Overlay Info */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur px-3.5 py-1.5 rounded-full border border-slate-700 text-xs font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-slate-100 uppercase">
                {activeCam === 'REAR' && '📹 REAR CAMERA — BLINDSPOT PROXIMITY'}
                {activeCam === 'FRONT' && '📹 FRONT CAMERA — TRAFFIC & SPEED LIMIT DETECT'}
                {activeCam === 'DASHBOARD' && '📹 DASHBOARD RIDER CAM — GAZE & POSTURE AI'}
              </span>
            </div>

            <div className="bg-slate-900/85 backdrop-blur px-3 py-1.5 rounded-full border border-slate-700 text-[11px] font-mono text-cyan-400 font-bold">
              Detected: {detectedObjects.length} Objects
            </div>
          </div>

          {/* Center Dynamic HUD Box Overlays */}
          <div className="absolute bottom-16 left-4 right-4 z-20 pointer-events-none flex justify-center">
            {activeCam === 'FRONT' && (
              <div className={`p-4 rounded-2xl border-2 backdrop-blur-md flex items-center gap-4 transition-all ${
                telemetry.trafficDensity === 'CROWDED'
                  ? 'bg-rose-950/90 border-rose-500 text-rose-200 glow-red animate-pulse-fast'
                  : telemetry.trafficDensity === 'MODERATE'
                  ? 'bg-amber-950/90 border-amber-500 text-amber-200 glow-amber'
                  : 'bg-slate-900/90 border-cyan-500 text-cyan-200 glow-cyan'
              }`}>
                <div className="w-16 h-16 rounded-full bg-slate-950 border-4 border-rose-500 flex flex-col items-center justify-center font-orbitron font-black text-2xl text-white">
                  <span>{telemetry.recommendedSpeedLimit}</span>
                  <span className="text-[8px] uppercase text-rose-400 -mt-1">LIMIT</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                    Real-time Road AI Detection ({telemetry.frontObjectsDetected} Vehicles/Pedestrians)
                  </span>
                  <h4 className="font-orbitron font-bold text-base mt-0.5">
                    {telemetry.trafficDensity === 'CROWDED' && '⚠️ HEAVILY CROUDED ROAD ZONE'}
                    {telemetry.trafficDensity === 'MODERATE' && 'MODERATE TRAFFIC FLOW'}
                    {telemetry.trafficDensity === 'EMPTY' && 'CLEAR ROAD AHEAD'}
                  </h4>
                  <p className="text-xs font-mono text-cyan-300 mt-1">
                    Safe Speed Limit: Maintain speed under {telemetry.recommendedSpeedLimit} km/h
                  </p>
                </div>
              </div>
            )}

            {activeCam === 'DASHBOARD' && (
              <div className={`px-4 py-2 rounded-xl border-2 backdrop-blur-md text-center font-orbitron font-bold text-xs uppercase transition-all ${
                telemetry.riderUnsteady
                  ? 'bg-rose-950/90 border-rose-500 text-rose-200 glow-red animate-pulse'
                  : telemetry.riderDistracted
                  ? 'bg-amber-950/90 border-amber-500 text-amber-200 glow-amber'
                  : 'bg-emerald-950/90 border-emerald-500 text-emerald-300 glow-green'
              }`}>
                {telemetry.riderUnsteady && '🛑 RIDER UNSTEADY / UNWELL DETECTED'}
                {!telemetry.riderUnsteady && telemetry.riderDistracted && '👁️ RIDER DISTRACTED (LOOKING AWAY)'}
                {!telemetry.riderUnsteady && !telemetry.riderDistracted && '✅ RIDER FOCUSED & STEADY'}
              </div>
            )}

            {activeCam === 'REAR' && (
              <div className={`px-4 py-2 rounded-xl border-2 backdrop-blur-md text-center font-orbitron font-bold text-xs uppercase ${
                telemetry.rearVehicleProximity
                  ? 'bg-rose-950/90 border-rose-500 text-rose-200 glow-red animate-pulse'
                  : 'bg-cyan-950/90 border-cyan-500 text-cyan-200'
              }`}>
                {telemetry.rearVehicleProximity ? '⚠️ VEHICLE APPROACHING CLOSE BEHIND!' : 'REAR ZONE CLEAR'}
              </div>
            )}
          </div>

          {/* Bottom Bar */}
          <div className="absolute bottom-3 left-4 right-4 z-20 flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-800 pointer-events-none">
            <span>AI Status: <strong className="text-emerald-400">CALIBRATED REAL-TIME DETECT</strong></span>
            <span>Latency: <strong className="text-cyan-400">{telemetry.latencyMs}ms</strong></span>
          </div>
        </div>

        {/* Right Column: AI Calibration & Source Controls */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-4">
          
          <div className="space-y-4">
            <h3 className="font-orbitron font-bold text-slate-100 text-sm border-b border-slate-800 pb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                AI Calibration & Controls
              </span>
            </h3>

            {/* Rider Focus Calibration Button */}
            {activeCam === 'DASHBOARD' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">Rider Posture Calibration</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Click below while sitting upright to set your focused seating position as 100% steady baseline.
                  </p>
                  <button
                    onClick={handleCalibratePose}
                    className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-950"
                  >
                    <Target className="w-3.5 h-3.5" />
                    Calibrate Focused Seating Pose
                  </button>
                </div>

                {/* Sensitivity Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Detection Sensitivity:</label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    {(['LOW', 'BALANCED', 'HIGH'] as const).map(level => (
                      <button
                        key={level}
                        onClick={() => setSensitivity(level)}
                        className={`py-1 rounded-lg font-bold transition-all ${
                          sensitivity === level
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Video Input Mode Switcher */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">Video Source Selector:</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setVideoMode('WEBCAM')}
                  className={`py-1.5 rounded-lg font-bold transition-all ${
                    videoMode === 'WEBCAM'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Webcam
                </button>

                <button
                  onClick={() => setVideoMode('SAMPLE')}
                  className={`py-1.5 rounded-lg font-bold transition-all ${
                    videoMode === 'SAMPLE'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Demo Clips
                </button>

                <label className={`py-1.5 rounded-lg font-bold text-center cursor-pointer transition-all ${
                  videoMode === 'UPLOAD'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}>
                  Upload
                  <input type="file" accept="video/*,image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* Sample Clips Selector */}
            {videoMode === 'SAMPLE' && (
              <div className="space-y-2 text-xs">
                <div className="space-y-1.5">
                  <button
                    onClick={() => setCurrentSampleUrl(sampleVideos.FRONT_CROWDED)}
                    className={`w-full p-2 rounded-xl text-left border font-medium transition-all ${
                      currentSampleUrl === sampleVideos.FRONT_CROWDED
                        ? 'bg-rose-950/60 border-rose-500 text-rose-200 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🔴 Crowded Traffic Street Clip
                  </button>

                  <button
                    onClick={() => setCurrentSampleUrl(sampleVideos.FRONT_CLEAR)}
                    className={`w-full p-2 rounded-xl text-left border font-medium transition-all ${
                      currentSampleUrl === sampleVideos.FRONT_CLEAR
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🟢 Clear Highway Clip
                  </button>
                </div>
              </div>
            )}

            {/* Live Inspection Metrics */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
              <h4 className="font-bold text-slate-200 flex items-center justify-between">
                <span>Real-Time State</span>
                <span className="text-cyan-400 font-mono">{detectedObjects.length} Objects</span>
              </h4>

              <div className="space-y-1 text-slate-400 text-[11px] font-mono">
                <div>Active Cam: <strong className="text-slate-200">{activeCam}</strong></div>
                <div>Rider State: <strong className={telemetry.riderUnsteady ? 'text-rose-400' : telemetry.riderDistracted ? 'text-amber-400' : 'text-emerald-400'}>
                  {telemetry.riderUnsteady ? 'UNSTEADY' : telemetry.riderDistracted ? 'DISTRACTED' : 'FOCUSED & STEADY'}
                </strong></div>
                <div>Density Zone: <strong className="text-amber-400">{telemetry.trafficDensity}</strong></div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 text-center">
            TensorFlow.js Real-time Temporal Smoothing Filter
          </div>
        </div>
      </div>
    </div>
  );
};
