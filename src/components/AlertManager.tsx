import React from 'react';
import { AlertTriangle, ShieldAlert, X, Hand, Eye, Navigation, Wrench } from 'lucide-react';
import { AlertPopup } from '../types/telemetry';

interface AlertManagerProps {
  alerts: AlertPopup[];
  onDismissAlert: (id: string) => void;
  onTriggerSOSNow: () => void;
}

export const AlertManager: React.FC<AlertManagerProps> = ({
  alerts,
  onDismissAlert,
  onTriggerSOSNow
}) => {
  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-50 px-4 max-w-xl mx-auto space-y-3 pointer-events-none">
      {alerts.map(alert => {
        const isCritical = alert.severity === 'CRITICAL';
        const isWarning = alert.severity === 'WARNING';

        return (
          <div
            key={alert.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all animate-bounce-short ${
              isCritical
                ? 'bg-rose-950/95 border-rose-500 text-rose-100 glow-red'
                : isWarning
                ? 'bg-amber-950/95 border-amber-500 text-amber-100 glow-amber'
                : 'bg-cyan-950/95 border-cyan-500 text-cyan-100 glow-cyan'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {/* Icon based on Alert Type */}
                <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                  isCritical ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse' :
                  isWarning ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' :
                  'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                }`}>
                  {alert.type === 'DROWSINESS' && <Eye className="w-7 h-7" />}
                  {alert.type === 'CROWDED' && <Navigation className="w-7 h-7" />}
                  {alert.type === 'GRIP_LOSS' && <Hand className="w-7 h-7" />}
                  {alert.type === 'PART_FAULT' && <Wrench className="w-7 h-7" />}
                  {alert.type === 'NO_HELMET' && <ShieldAlert className="w-7 h-7" />}
                  {alert.type === 'COLLAPSE_WARNING' && <AlertTriangle className="w-7 h-7" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold bg-black/40 border border-white/10">
                      RIDER SAFETY ALERT
                    </span>
                    <span className="text-xs font-mono text-slate-400">{alert.timestamp}</span>
                  </div>

                  <h3 className="font-orbitron font-extrabold text-lg tracking-wide mt-1 leading-snug">
                    {alert.title}
                  </h3>
                  <p className="text-sm font-medium mt-1 opacity-90 leading-relaxed">
                    {alert.message}
                  </p>

                  {/* Context Action Buttons */}
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {alert.type === 'DROWSINESS' && (
                      <button
                        onClick={onTriggerSOSNow}
                        className="text-xs px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow"
                      >
                        Request Immediate SOS Help
                      </button>
                    )}
                    {alert.type === 'CROWDED' && (
                      <span className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/30 border border-amber-400/50 font-bold text-amber-200">
                        ⚡ Speed Limiter Engaged (&lt;25 km/h)
                      </span>
                    )}
                    {alert.type === 'PART_FAULT' && (
                      <span className="text-xs px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700 text-slate-300 font-mono">
                        SafePull Fail-safe Mode Active
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Close / Acknowledge Button */}
              <button
                onClick={() => onDismissAlert(alert.id)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-300 transition-all shrink-0"
                title="Acknowledge Alert"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
