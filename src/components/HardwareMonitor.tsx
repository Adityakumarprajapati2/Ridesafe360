import React, { useState } from 'react';
import { Cpu, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Wrench, Radio } from 'lucide-react';
import { ComponentHealth } from '../types/telemetry';

interface HardwareMonitorProps {
  components: ComponentHealth[];
  onToggleFault: (componentId: string) => void;
  onRunSelfTest: () => void;
  isTesting: boolean;
}

export const HardwareMonitor: React.FC<HardwareMonitorProps> = ({
  components,
  onToggleFault,
  onRunSelfTest,
  isTesting
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const categories = ['ALL', 'Vision', 'Motion', 'Contact', 'Actuator', 'Power'];

  const filteredComponents = filterCategory === 'ALL'
    ? components
    : components.filter(c => c.category === filterCategory);

  const operationalCount = components.filter(c => c.status === 'OPERATIONAL').length;
  const faultCount = components.filter(c => c.status === 'CRITICAL_FAULT' || c.status === 'DISCONNECTED').length;
  const warningCount = components.filter(c => c.status === 'WARNING').length;

  return (
    <div className="space-y-5">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Hardware Modules</p>
            <h4 className="font-orbitron font-bold text-2xl text-slate-100 mt-0.5">{components.length}</h4>
          </div>
          <Cpu className="w-8 h-8 text-cyan-400 opacity-80" />
        </div>

        <div className="bg-slate-900/80 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-400/80 font-medium">Fully Operational</p>
            <h4 className="font-orbitron font-bold text-2xl text-emerald-400 mt-0.5">{operationalCount}</h4>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-400 opacity-80" />
        </div>

        <div className="bg-slate-900/80 border border-amber-500/30 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-400/80 font-medium">Warnings / Degradation</p>
            <h4 className="font-orbitron font-bold text-2xl text-amber-400 mt-0.5">{warningCount}</h4>
          </div>
          <AlertTriangle className="w-8 h-8 text-amber-400 opacity-80" />
        </div>

        <div className="bg-slate-900/80 border border-rose-500/30 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-rose-400/80 font-medium">Hardware Faults</p>
            <h4 className="font-orbitron font-bold text-2xl text-rose-400 mt-0.5">{faultCount}</h4>
          </div>
          <XCircle className="w-8 h-8 text-rose-400 opacity-80" />
        </div>
      </div>

      {/* Hardware Diagnostic Controls Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-orbitron font-bold text-slate-100 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-cyan-400" />
            RideSafe360 Part Health & Diagnostic Manager
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Continuously polling microcontrollers over Wi-Fi (ESP32/Arduino) to ensure bike safety hardware integrity.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-all ${
                  filterCategory === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Self-Test Trigger */}
          <button
            onClick={onRunSelfTest}
            disabled={isTesting}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all shadow-md shadow-cyan-950 whitespace-nowrap disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            {isTesting ? 'Diagnosing...' : 'Full System Self-Test'}
          </button>
        </div>
      </div>

      {/* Component Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredComponents.map(comp => {
          const isFault = comp.status === 'CRITICAL_FAULT' || comp.status === 'DISCONNECTED';
          const isWarn = comp.status === 'WARNING';

          return (
            <div
              key={comp.id}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                isFault
                  ? 'bg-rose-950/40 border-rose-500/60 shadow-lg shadow-rose-950/50'
                  : isWarn
                  ? 'bg-amber-950/30 border-amber-500/40'
                  : 'bg-slate-900/60 border-slate-800 hover:border-cyan-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase font-semibold">
                      {comp.category}
                    </span>
                    <h4 className="font-bold text-sm text-slate-100">{comp.name}</h4>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">{comp.details}</p>
                </div>

                {/* Status Badge */}
                <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase flex items-center gap-1 border shrink-0 ${
                  comp.status === 'OPERATIONAL'
                    ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300'
                    : comp.status === 'WARNING'
                    ? 'bg-amber-950 border-amber-500/40 text-amber-300'
                    : 'bg-rose-950 border-rose-500/60 text-rose-200 animate-pulse'
                }`}>
                  {comp.status === 'OPERATIONAL' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  {comp.status === 'WARNING' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                  {isFault && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                  <span>{comp.status.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Sub bar with response time and simulation toggle */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px] flex items-center gap-1 font-mono">
                  <Radio className="w-3 h-3 text-cyan-400" />
                  Telemetry latency: {comp.lastPingMs} ms
                </span>

                <button
                  onClick={() => onToggleFault(comp.id)}
                  className={`text-[11px] px-2.5 py-1 rounded font-medium border transition-all ${
                    isFault
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900'
                      : 'bg-slate-800 text-rose-300 border-rose-500/30 hover:bg-rose-950'
                  }`}
                >
                  {isFault ? 'Fix Hardware' : 'Simulate Fault'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
