import React from 'react';
import { Cpu, X, AlertTriangle, ShieldCheck, Activity, Gauge, Hand, Eye } from 'lucide-react';
import { TelemetryState } from '../types/telemetry';

interface TelemetrySimulatorProps {
  telemetry: TelemetryState;
  setTelemetry: React.Dispatch<React.SetStateAction<TelemetryState>>;
  isOpen: boolean;
  onClose: () => void;
  onSimulateCollapse: () => void;
}

export const TelemetrySimulator: React.FC<TelemetrySimulatorProps> = ({
  telemetry,
  setTelemetry,
  isOpen,
  onClose,
  onSimulateCollapse
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-cyan-500/30 p-5 overflow-y-auto shadow-2xl flex flex-col justify-between">
      
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h3 className="font-orbitron font-bold text-slate-100 text-sm">
              Live Sensor & Telemetry Simulator
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Speed Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Vehicle Speed
            </span>
            <span className="font-mono text-cyan-400">{telemetry.speedKmh} km/h</span>
          </div>
          <input
            type="range"
            min="0"
            max="120"
            value={telemetry.speedKmh}
            onChange={(e) => setTelemetry(prev => ({ ...prev, speedKmh: Number(e.target.value) }))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>

        {/* MPU6050 Lean Angle Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" /> Lean Angle (MPU6050)
            </span>
            <span className="font-mono text-cyan-400">{telemetry.leanAngleDeg}°</span>
          </div>
          <input
            type="range"
            min="-60"
            max="60"
            value={telemetry.leanAngleDeg}
            onChange={(e) => setTelemetry(prev => ({ ...prev, leanAngleDeg: Number(e.target.value) }))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>

        {/* Drowsiness % Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-rose-400" /> Rider Drowsiness Level
            </span>
            <span className="font-mono text-rose-400">{telemetry.drowsinessLevel}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={telemetry.drowsinessLevel}
            onChange={(e) => setTelemetry(prev => ({ ...prev, drowsinessLevel: Number(e.target.value) }))}
            className="w-full accent-rose-500 cursor-pointer"
          />
        </div>

        {/* Handlebar Grip Status Selectors */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Hand className="w-3.5 h-3.5 text-cyan-400" /> Handlebar Grip Status
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(['SECURE', 'WEAK', 'ABSENT'] as const).map(grip => (
              <button
                key={grip}
                onClick={() => setTelemetry(prev => ({ ...prev, gripLeft: grip, gripRight: grip }))}
                className={`text-xs py-1.5 rounded font-medium border transition-all ${
                  telemetry.gripLeft === grip
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {grip}
              </button>
            ))}
          </div>
        </div>

        {/* Helmet Worn Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Helmet Detected
          </span>
          <button
            onClick={() => setTelemetry(prev => ({ ...prev, helmetDetected: !prev.helmetDetected }))}
            className={`text-xs px-3 py-1 rounded font-bold border transition-all ${
              telemetry.helmetDetected
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-950 text-rose-300 border-rose-500/40'
            }`}
          >
            {telemetry.helmetDetected ? 'YES (WORN)' : 'NO (WARNING)'}
          </button>
        </div>

        {/* Traffic Density Toggle */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">
            Traffic Zone Environment
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(['EMPTY', 'MODERATE', 'CROWDED'] as const).map(density => (
              <button
                key={density}
                onClick={() => setTelemetry(prev => ({ ...prev, trafficDensity: density }))}
                className={`text-xs py-1.5 rounded font-medium border transition-all ${
                  telemetry.trafficDensity === density
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {density}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Emergency Crash Simulation Trigger */}
      <div className="pt-4 border-t border-slate-800 space-y-2">
        <button
          onClick={() => {
            onSimulateCollapse();
            onClose();
          }}
          className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-950 border border-rose-400 transition-all flex items-center justify-center gap-2 animate-pulse"
        >
          <AlertTriangle className="w-4 h-4" />
          SIMULATE BIKE COLLAPSE / CRASH
        </button>
        <p className="text-[10px] text-slate-500 text-center">
          Triggers high tilt + 0 grip to test AI SOS emergency alert system.
        </p>
      </div>
    </div>
  );
};
