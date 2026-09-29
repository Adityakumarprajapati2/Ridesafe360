import React from 'react';
import { Shield, Lock, Unlock, PlayCircle, Cpu } from 'lucide-react';
import { TelemetryState } from '../types/telemetry';

interface SafePullVisualizerProps {
  telemetry: TelemetryState;
  onSetStage: (stage: 'NORMAL' | 'WARN' | 'ASSIST' | 'SAFE_PULL') => void;
}

export const SafePullVisualizer: React.FC<SafePullVisualizerProps> = ({
  telemetry,
  onSetStage
}) => {
  return (
    <div className="space-y-6">
      
      {/* Interactive Stage Control Selector */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-orbitron font-bold text-slate-100 text-base flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Staged Safety Intervention Architecture (RideSafe360 Patent)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Proactive multi-stage safety response based on fusion of Vision AI, MPU6050 IMU lean angle, wheel speed, and handlebar grip contact.
            </p>
          </div>

          <div className="text-xs font-mono px-3 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold">
            Active: STAGE {telemetry.currentStage}
          </div>
        </div>

        {/* 3 Stages Workflow Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Stage 1: WARN */}
          <div
            onClick={() => onSetStage('WARN')}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              telemetry.currentStage === 'WARN'
                ? 'bg-amber-950/60 border-amber-500 text-amber-200 glow-amber'
                : 'bg-slate-950/60 border-slate-800 hover:border-amber-500/40 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                STAGE 1
              </span>
              <PlayCircle className="w-4 h-4 text-amber-400" />
            </div>
            <h4 className="font-orbitron font-bold text-base mt-2">WARN (Alert Rider)</h4>
            <p className="text-xs text-slate-400 mt-1">
              Triggers haptic grip vibrators, dashboard warning buzzer, LED flash, and popup alert on rider's phone.
            </p>
            <div className="mt-3 text-[11px] font-mono text-amber-400">
              Condition: Drowsiness / No Helmet / Weak Grip
            </div>
          </div>

          {/* Stage 2: ASSIST */}
          <div
            onClick={() => onSetStage('ASSIST')}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              telemetry.currentStage === 'ASSIST'
                ? 'bg-orange-950/60 border-orange-500 text-orange-200 glow-amber'
                : 'bg-slate-950/60 border-slate-800 hover:border-orange-500/40 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 font-bold">
                STAGE 2
              </span>
              <PlayCircle className="w-4 h-4 text-orange-400" />
            </div>
            <h4 className="font-orbitron font-bold text-base mt-2">ASSIST (Speed Control)</h4>
            <p className="text-xs text-slate-400 mt-1">
              Gently limits throttle (e.g. max 50%) and applies light brake pulses (&le;0.3g deceleration) if rider is unresponsive.
            </p>
            <div className="mt-3 text-[11px] font-mono text-orange-400">
              Condition: Persistent WARN + Zero Grip
            </div>
          </div>

          {/* Stage 3: SAFE PULL */}
          <div
            onClick={() => onSetStage('SAFE_PULL')}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              telemetry.currentStage === 'SAFE_PULL'
                ? 'bg-rose-950/70 border-rose-500 text-rose-200 glow-red'
                : 'bg-slate-950/60 border-slate-800 hover:border-rose-500/40 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                STAGE 3
              </span>
              <PlayCircle className="w-4 h-4 text-rose-400" />
            </div>
            <h4 className="font-orbitron font-bold text-base mt-2">SAFE PULL (Stabilizer)</h4>
            <p className="text-xs text-slate-400 mt-1">
              Deploys side stabilizer wheels via linear actuators, engages mechanical locks, safely crawls motorcycle to roadside.
            </p>
            <div className="mt-3 text-[11px] font-mono text-rose-400">
              Condition: Speed &lt;20km/h & Lean &lt;10°
            </div>
          </div>
        </div>
      </div>

      {/* Mechanical Stabilizer Arm & Actuator Status Visualizer */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h3 className="font-orbitron font-bold text-slate-200 text-sm">
              SafePull Side Stabilizer Wheels & Actuator Controller
            </h3>
          </div>

          <button
            onClick={() => onSetStage(telemetry.currentStage === 'SAFE_PULL' ? 'NORMAL' : 'SAFE_PULL')}
            className={`text-xs px-3 py-1 rounded-lg font-bold border transition-all ${
              telemetry.stabilizersDeployed
                ? 'bg-rose-950 text-rose-200 border-rose-500/60 hover:bg-rose-900'
                : 'bg-cyan-950 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900'
            }`}
          >
            {telemetry.stabilizersDeployed ? 'Retract Stabilizers' : 'Deploy Side Stabilizers Now'}
          </button>
        </div>

        {/* Diagram Graphic of Motorcycle with Side Wheels */}
        <div className="bg-slate-950 rounded-xl p-6 border border-slate-800/80 flex flex-col items-center justify-center relative overflow-hidden">
          
          <div className="w-full max-w-md relative flex items-center justify-center py-8">
            {/* Central Bike Body */}
            <div className="w-24 h-40 rounded-2xl bg-slate-800 border-2 border-cyan-500/60 flex flex-col items-center justify-between p-3 z-10 shadow-xl">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-[10px] font-bold text-cyan-300">
                HEAD
              </div>
              <div className="text-center font-orbitron text-xs font-black text-slate-100">
                BIKE FRAME
              </div>
              <div className="w-10 h-6 rounded bg-slate-700 border border-slate-600 flex items-center justify-center text-[9px] font-mono text-slate-300">
                12V BAT
              </div>
            </div>

            {/* Left Stabilizer Arm */}
            <div className={`absolute left-4 sm:left-12 flex items-center transition-all duration-500 ${
              telemetry.stabilizersDeployed ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-40'
            }`}>
              <div className="w-16 h-3 bg-gradient-to-r from-amber-500 to-rose-500 rounded-l-md shadow-lg" />
              <div className="w-10 h-10 rounded-full bg-slate-700 border-4 border-amber-400 flex items-center justify-center text-xs font-bold text-amber-300 shadow-md">
                W1
              </div>
            </div>

            {/* Right Stabilizer Arm */}
            <div className={`absolute right-4 sm:right-12 flex items-center transition-all duration-500 ${
              telemetry.stabilizersDeployed ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-40'
            }`}>
              <div className="w-10 h-10 rounded-full bg-slate-700 border-4 border-amber-400 flex items-center justify-center text-xs font-bold text-amber-300 shadow-md">
                W2
              </div>
              <div className="w-16 h-3 bg-gradient-to-l from-amber-500 to-rose-500 rounded-r-md shadow-lg" />
            </div>
          </div>

          {/* Sub Status bar for mechanical locking latch */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs border-t border-slate-800 pt-4 mt-2">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Actuator Arm State:</span>
              <span className={`font-bold font-mono ${telemetry.stabilizersDeployed ? 'text-rose-400' : 'text-slate-400'}`}>
                {telemetry.stabilizersDeployed ? 'EXTENDED (DEPLOYED)' : 'RETRACTED'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Mechanical Latch Lock:</span>
              <span className={`font-bold font-mono flex items-center gap-1 ${
                telemetry.stabilizerLatchLocked ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {telemetry.stabilizerLatchLocked ? <Lock className="w-3.5 h-3.5 text-emerald-400" /> : <Unlock className="w-3.5 h-3.5 text-amber-400" />}
                {telemetry.stabilizerLatchLocked ? 'LOCKED' : 'UNLOCKED'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Brake Assist Status:</span>
              <span className={`font-bold font-mono ${telemetry.brakePulseActive ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`}>
                {telemetry.brakePulseActive ? 'PULSED BRAKING' : 'INACTIVE'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
