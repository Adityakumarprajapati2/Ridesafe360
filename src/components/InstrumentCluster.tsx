import React from 'react';
import { Gauge, Activity, Hand, ShieldAlert, AlertOctagon, Eye, Navigation, ShieldCheck } from 'lucide-react';
import { TelemetryState } from '../types/telemetry';

interface InstrumentClusterProps {
  telemetry: TelemetryState;
  onTriggerDrowsyWarning: () => void;
  onTriggerCrowdedWarning: () => void;
}

export const InstrumentCluster: React.FC<InstrumentClusterProps> = ({
  telemetry,
  onTriggerDrowsyWarning,
  onTriggerCrowdedWarning
}) => {
  // Compute lean rotation angle for dynamic UI display
  const leanRotation = Math.max(-45, Math.min(45, telemetry.leanAngleDeg));

  return (
    <div className="space-y-4">
      
      {/* Top Banner: Staged ADAS Safety Status */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 transition-all ${
        telemetry.currentStage === 'NORMAL'
          ? 'bg-slate-900/80 border-slate-800 text-slate-300'
          : telemetry.currentStage === 'WARN'
          ? 'bg-amber-950/70 border-amber-500/50 text-amber-200 glow-amber'
          : telemetry.currentStage === 'ASSIST'
          ? 'bg-orange-950/80 border-orange-500/60 text-orange-200 glow-amber'
          : 'bg-rose-950/90 border-rose-500 text-rose-100 glow-red animate-pulse-fast'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center font-orbitron font-black text-lg ${
            telemetry.currentStage === 'NORMAL'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : telemetry.currentStage === 'WARN'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : telemetry.currentStage === 'ASSIST'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
              : 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
          }`}>
            {telemetry.currentStage === 'NORMAL' && <ShieldCheck className="w-6 h-6 text-emerald-400" />}
            {telemetry.currentStage === 'WARN' && <ShieldAlert className="w-6 h-6 text-amber-400" />}
            {telemetry.currentStage === 'ASSIST' && <AlertOctagon className="w-6 h-6 text-orange-400" />}
            {telemetry.currentStage === 'SAFE_PULL' && <AlertOctagon className="w-6 h-6 text-rose-400" />}
            {telemetry.currentStage === 'EMERGENCY_CRASH' && <AlertOctagon className="w-6 h-6 text-rose-400" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-semibold text-slate-400">Current Safety Level</span>
              <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase font-orbitron ${
                telemetry.currentStage === 'NORMAL' ? 'bg-emerald-900/60 text-emerald-300' :
                telemetry.currentStage === 'WARN' ? 'bg-amber-900/60 text-amber-300' :
                telemetry.currentStage === 'ASSIST' ? 'bg-orange-900/60 text-orange-300' :
                'bg-rose-900/80 text-rose-200'
              }`}>
                STAGE: {telemetry.currentStage}
              </span>
            </div>
            <h3 className="font-orbitron text-lg font-bold">
              {telemetry.currentStage === 'NORMAL' && 'System Active — Monitoring All Sensors'}
              {telemetry.currentStage === 'WARN' && 'Stage 1 Warning: Vibration & Buzzer Alert Active'}
              {telemetry.currentStage === 'ASSIST' && 'Stage 2 Assist: Limiting Throttle & Pulsing Brakes'}
              {telemetry.currentStage === 'SAFE_PULL' && 'Stage 3 SafePull: Side Stabilizers Deployed!'}
              {telemetry.currentStage === 'EMERGENCY_CRASH' && 'EMERGENCY: Bike Collapse Detected! SOS Dispatched!'}
            </h3>
          </div>
        </div>

        {/* Action Buttons for quick demo testing */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTriggerCrowdedWarning}
            className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-medium transition-all"
          >
            Simulate "Crowded Area" Alert
          </button>
          <button
            onClick={onTriggerDrowsyWarning}
            className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-medium transition-all"
          >
            Simulate "Drowsy / Unwell" Alert
          </button>
        </div>
      </div>

      {/* Main HUD Gauge Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Speedometer Gauge Card */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="absolute top-3 left-4 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <span>Hall Effect Speed Sensor</span>
          </div>

          <div className="my-6 relative flex flex-col items-center justify-center">
            {/* Speed Display */}
            <div className="font-orbitron font-black text-6xl tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-400">
              {telemetry.speedKmh}
            </div>
            <div className="font-orbitron text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              km/h
            </div>

            {/* Sub Speed Limit Indicator */}
            {telemetry.trafficDensity === 'CROWDED' && (
              <div className="mt-2 text-[11px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40 font-bold uppercase animate-bounce">
                Speed Limit: 25 km/h
              </div>
            )}
          </div>

          <div className="w-full flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-3">
            <span>Throttle Limit: <strong className="text-slate-200">{telemetry.throttleLimitedPercent}%</strong></span>
            <span>G-Force: <strong className="text-cyan-400">{telemetry.gForce.toFixed(2)} g</strong></span>
          </div>
        </div>

        {/* MPU6050 Lean Angle Gauge Card */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden hover:border-cyan-500/40 transition-all">
          <div className="absolute top-3 left-4 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>MPU6050 IMU Lean Angle</span>
          </div>

          <div className="my-5 flex flex-col items-center">
            {/* Lean Graphic Visualizer */}
            <div className="w-32 h-20 relative flex items-center justify-center border-b-2 border-slate-700">
              {/* Bike Lean Representation Line */}
              <div 
                className="w-24 h-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-transform duration-200 shadow-md shadow-cyan-500/30"
                style={{ transform: `rotate(${leanRotation}deg)` }}
              />
              <div className="absolute bottom-1 w-3 h-3 rounded-full bg-cyan-400 shadow-lg" />
            </div>

            <div className="mt-3 flex items-baseline gap-1">
              <span className={`font-orbitron font-black text-4xl ${
                Math.abs(telemetry.leanAngleDeg) > 40 ? 'text-rose-400 animate-pulse' : 'text-slate-100'
              }`}>
                {telemetry.leanAngleDeg > 0 ? `+${telemetry.leanAngleDeg}` : telemetry.leanAngleDeg}°
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono mt-0.5">
              {telemetry.leanAngleDeg < -5 ? 'Leaning Left' : telemetry.leanAngleDeg > 5 ? 'Leaning Right' : 'Upright Stable'}
            </span>
          </div>

          <div className="w-full flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-3">
            <span>Tilt Threshold: <strong className="text-slate-200">±45°</strong></span>
            <span>SafePull Ready: <strong className="text-emerald-400">OK (&lt;10°)</strong></span>
          </div>
        </div>

        {/* Rider Drowsiness & Camera AI Card */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden hover:border-cyan-500/40 transition-all">
          <div className="absolute top-3 left-4 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Dashboard Rider Camera AI</span>
          </div>

          <div className="my-4 w-full flex flex-col items-center">
            {/* Helmet Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold mb-3 ${
              telemetry.helmetDetected
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/80 border-rose-500 text-rose-200 animate-pulse'
            }`}>
              <ShieldCheck className="w-4 h-4" />
              <span>{telemetry.helmetDetected ? 'HELMET DETECTED' : 'NO HELMET WARNING!'}</span>
            </div>

            {/* Drowsiness Progress Meter */}
            <div className="w-full space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-400">Rider Drowsiness / Fatigue:</span>
                <span className={`font-mono font-bold ${
                  telemetry.drowsinessLevel > 60 ? 'text-rose-400' : telemetry.drowsinessLevel > 30 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {telemetry.drowsinessLevel}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
                <div 
                  className={`h-full transition-all duration-300 ${
                    telemetry.drowsinessLevel > 60 ? 'bg-rose-500' : telemetry.drowsinessLevel > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${telemetry.drowsinessLevel}%` }}
                />
              </div>
            </div>

            {/* Dizziness Alert Tag */}
            {telemetry.dizzinessDetected && (
              <div className="mt-3 text-[11px] px-2.5 py-1 rounded bg-rose-950 text-rose-200 border border-rose-500 font-bold uppercase animate-pulse">
                ⚠️ Dizziness / Fainting Indicator Triggered
              </div>
            )}
          </div>

          <div className="w-full flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-3">
            <span>Face ML Model: <strong className="text-emerald-400">TFLite 30 FPS</strong></span>
            <span>Rider State: <strong className="text-slate-200">{telemetry.drowsinessLevel > 50 ? 'FAINT / SLEEPY' : 'ALERT'}</strong></span>
          </div>
        </div>
      </div>

      {/* Second Row: Handlebar Grip Status & Environment Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Handlebar Grip Sensors Card */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Hand className="w-5 h-5 text-cyan-400" />
              <h3 className="font-orbitron font-bold text-sm text-slate-200">Capacitive Handlebar Grip Monitoring</h3>
            </div>
            <span className="text-[11px] text-slate-400">Dual Sensor Confirmation</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Left Grip */}
            <div className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${
              telemetry.gripLeft === 'SECURE'
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                : telemetry.gripLeft === 'WEAK'
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                : 'bg-rose-950/60 border-rose-500 text-rose-200 animate-pulse'
            }`}>
              <Hand className="w-7 h-7 mb-1.5" />
              <span className="text-xs text-slate-400 font-medium">Left Handlebar</span>
              <span className="font-orbitron font-bold text-sm mt-0.5">{telemetry.gripLeft}</span>
            </div>

            {/* Right Grip */}
            <div className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${
              telemetry.gripRight === 'SECURE'
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                : telemetry.gripRight === 'WEAK'
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                : 'bg-rose-950/60 border-rose-500 text-rose-200 animate-pulse'
            }`}>
              <Hand className="w-7 h-7 mb-1.5 transform -scale-x-100" />
              <span className="text-xs text-slate-400 font-medium">Right Handlebar</span>
              <span className="font-orbitron font-bold text-sm mt-0.5">{telemetry.gripRight}</span>
            </div>
          </div>
        </div>

        {/* Environment & Road Traffic Conditions Card */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-cyan-400" />
              <h3 className="font-orbitron font-bold text-sm text-slate-200">Front Vision & Environment Context</h3>
            </div>
            <span className="text-[11px] text-slate-400">ESP32-CAM Inference</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs">
              <span className="text-slate-300 font-medium">Traffic Zone Density:</span>
              <span className={`font-bold px-2 py-0.5 rounded ${
                telemetry.trafficDensity === 'CROWDED'
                  ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-950 text-emerald-300'
              }`}>
                {telemetry.trafficDensity === 'CROWDED' ? '⚠️ CROWDED AREA (Go Slow)' : 'NORMAL ROAD'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs">
              <span className="text-slate-300 font-medium">Objects & Vehicles Detected:</span>
              <span className="font-mono text-cyan-400 font-bold">{telemetry.frontObjectsDetected} Vehicles Ahead</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs">
              <span className="text-slate-300 font-medium">Road Surface Status:</span>
              <span className="font-semibold text-slate-200 uppercase">{telemetry.roadCondition}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
