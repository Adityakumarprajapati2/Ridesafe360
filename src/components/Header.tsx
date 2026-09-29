import React from 'react';
import { Wifi, WifiOff, Battery, Shield, AlertTriangle, Cpu, Radio, Camera } from 'lucide-react';
import { TelemetryState } from '../types/telemetry';

interface HeaderProps {
  telemetry: TelemetryState;
  onOpenWifiConfig: () => void;
  onOpenSimulator: () => void;
  onTriggerManualSOS: () => void;
  activeTab: 'hud' | 'hardware' | 'cameras' | 'safepull' | 'sos';
  setActiveTab: (tab: 'hud' | 'hardware' | 'cameras' | 'safepull' | 'sos') => void;
}

export const Header: React.FC<HeaderProps> = ({
  telemetry,
  onOpenWifiConfig,
  onOpenSimulator,
  onTriggerManualSOS,
  activeTab,
  setActiveTab
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur border-b border-cyan-500/20 sticky top-0 z-40 px-3 py-2.5">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
        
        {/* Brand & Connectivity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-orbitron font-black text-lg shadow-sm">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-orbitron font-bold text-base tracking-wider text-slate-100">
                  RideSafe<span className="text-cyan-400">360</span>
                </h1>
                <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50 font-semibold">
                  ADAS v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Multi-Sensor Proactive Safety Hub</p>
            </div>
          </div>

          {/* Wi-Fi Direct Connection Status Badge */}
          <button
            onClick={onOpenWifiConfig}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${
              telemetry.wifiConnected
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-300 hover:bg-rose-900/60'
            }`}
          >
            {telemetry.wifiConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="font-medium hidden sm:inline">ESP32-AP</span>
                <span className="text-[10px] text-emerald-400/80 font-mono">({telemetry.latencyMs}ms)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-medium">Bike Wi-Fi Disconnected</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Diagnostics & Telemetry Info */}
        <div className="flex items-center gap-2">
          {/* Battery Status */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
            <Battery className={`w-4 h-4 ${telemetry.batteryVoltage < 11.5 ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}`} />
            <span className="font-mono text-slate-200">{telemetry.batteryVoltage.toFixed(1)}V</span>
          </div>

          {/* Simulator Toggle Button */}
          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-cyan-500/30 text-cyan-300 transition-all font-medium"
            title="Open Bike Telemetry & Sensor Simulator"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Sensor Sim</span>
          </button>

          {/* Manual SOS Panic Button */}
          <button
            onClick={onTriggerManualSOS}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold tracking-wide shadow-lg shadow-rose-950 border border-rose-400 transition-all animate-pulse"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>SOS</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto mt-2.5 flex items-center gap-1 border-t border-slate-800 pt-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('hud')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'hud'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          Rider HUD Cluster
        </button>

        <button
          onClick={() => setActiveTab('cameras')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'cameras'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          Live Cameras & AI Vision
        </button>

        <button
          onClick={() => setActiveTab('hardware')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'hardware'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          Parts Health & Diagnostics
        </button>

        <button
          onClick={() => setActiveTab('safepull')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'safepull'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          SafePull & ADAS Assist
        </button>

        <button
          onClick={() => setActiveTab('sos')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'sos'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          SOS & Hospital Dispatch
        </button>
      </div>
    </header>
  );
};
