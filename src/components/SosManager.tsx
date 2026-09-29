import React, { useState, useEffect } from 'react';
import { AlertTriangle, PhoneCall, Building2, MapPin, CheckCircle, ShieldAlert, Send } from 'lucide-react';
import { TelemetryState, FamilyContact, NearestHospital } from '../types/telemetry';
import { soundEffects } from '../utils/audio';

interface SosManagerProps {
  telemetry: TelemetryState;
  onCancelSOS: () => void;
  isOpen: boolean;
}

export const SosManager: React.FC<SosManagerProps> = ({
  telemetry,
  onCancelSOS,
  isOpen
}) => {
  const [countdown, setCountdown] = useState<number>(10);
  const [sosSent, setSosSent] = useState<boolean>(false);
  const gpsLocation = {
    lat: 22.5726,
    lng: 88.3639
  };

  const [familyContacts, setFamilyContacts] = useState<FamilyContact[]>([
    { id: '1', name: 'Sanghamitra (Family Contact)', relation: 'Spouse', phone: '+91 98301 23456', notified: false },
    { id: '2', name: 'Dr. Bikas Mondal', relation: 'Emergency Contact', phone: '+91 98310 98765', notified: false }
  ]);

  const [hospitals, setHospitals] = useState<NearestHospital[]>([
    { name: 'Narayana Health Trauma Center', distanceKm: 1.2, phone: '+91 33 2582 8000', etaMinutes: 4, status: 'READY' },
    { name: 'Kolkata Apollo Emergency Care', distanceKm: 2.8, phone: '+91 33 2320 3040', etaMinutes: 8, status: 'READY' }
  ]);

  // Handle countdown & audio siren
  useEffect(() => {
    if (!isOpen) return;

    setCountdown(10);
    setSosSent(false);

    // Play siren sound
    soundEffects.playSirenSOS();

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          triggerAutomaticDispatch();
          return 0;
        }
        soundEffects.playWarningBeep();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const triggerAutomaticDispatch = () => {
    setSosSent(true);
    soundEffects.playCriticalAlarm();

    // Mark contacts as notified
    setFamilyContacts(prev => prev.map(c => ({ ...c, notified: true })));
    setHospitals(prev => prev.map(h => ({ ...h, status: 'DISPATCHED' })));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-rose-500 rounded-3xl max-w-2xl w-full p-6 shadow-2xl shadow-rose-950 glow-red space-y-6">
        
        {/* Top Emergency Header */}
        <div className="flex items-center justify-between border-b border-rose-500/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500 flex items-center justify-center text-rose-400 animate-pulse">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-widest px-2 py-0.5 rounded bg-rose-950 border border-rose-800">
                  CRITICAL SOS ALERT
                </span>
                <span className="text-xs text-slate-400 font-mono">GPS LOCKED</span>
              </div>
              <h2 className="font-orbitron font-black text-xl text-slate-100 tracking-wide mt-0.5">
                AUTOMATED EMERGENCY DISPATCH
              </h2>
            </div>
          </div>

          <button
            onClick={onCancelSOS}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all"
          >
            Close Window
          </button>
        </div>

        {/* Countdown Banner / Dispatch Status */}
        {!sosSent ? (
          <div className="bg-rose-950/80 border border-rose-500/80 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <span className="text-xs uppercase font-bold text-rose-300 tracking-wider">
                Rider Impairment / Collapse Detected
              </span>
              <h3 className="font-orbitron font-bold text-lg text-white mt-0.5">
                Broadcasting Emergency SOS in {countdown} Seconds...
              </h3>
              <p className="text-xs text-rose-200/80 mt-1">
                Sensors confirm bike tilt angle ({telemetry.leanAngleDeg}°) or rider unresponsive state. Press cancel below if you are safe.
              </p>
            </div>

            <div className="flex flex-col items-center shrink-0">
              <div className="w-20 h-20 rounded-full border-4 border-rose-500 flex items-center justify-center font-orbitron font-black text-3xl text-rose-300 animate-pulse">
                {countdown}s
              </div>
              <button
                onClick={onCancelSOS}
                className="mt-3 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs tracking-wider uppercase shadow-lg shadow-emerald-950 transition-all border border-emerald-400"
              >
                I AM OK — CANCEL SOS
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-950/80 border border-emerald-500/80 rounded-2xl p-4 flex items-center gap-4 text-emerald-200">
            <CheckCircle className="w-10 h-10 text-emerald-400 shrink-0" />
            <div>
              <h3 className="font-orbitron font-bold text-base text-white">
                SOS Dispatched Successfully!
              </h3>
              <p className="text-xs text-emerald-300/90">
                Emergency contacts and nearest trauma response teams have received your exact GPS coordinates and telemetry.
              </p>
            </div>
          </div>
        )}

        {/* Bike Telemetry & Location Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>Current GPS Incident Location</span>
            </div>
            <p className="font-mono font-bold text-slate-200 text-sm">
              {gpsLocation.lat.toFixed(4)}° N, {gpsLocation.lng.toFixed(4)}° E
            </p>
            <p className="text-[11px] text-slate-400">Near Narula Institute of Technology, Agarpara, Kolkata</p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Crash & Rider Telemetry Snapshot</span>
            </div>
            <p className="font-mono text-slate-300 text-xs">
              Bike Tilt: <strong className="text-rose-400">{telemetry.leanAngleDeg}°</strong> | Speed: <strong className="text-white">{telemetry.speedKmh} km/h</strong>
            </p>
            <p className="font-mono text-slate-300 text-xs">
              Grip: <strong className="text-rose-400">{telemetry.gripLeft}</strong> | Drowsiness: <strong className="text-rose-400">{telemetry.drowsinessLevel}%</strong>
            </p>
          </div>
        </div>

        {/* Section 1: Saved Family Emergency Contacts */}
        <div className="space-y-3">
          <h3 className="font-orbitron font-bold text-sm text-slate-200 flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-cyan-400" />
            1. Automated Family & Guardian Alerts (SMS / Direct Call)
          </h3>

          <div className="space-y-2">
            {familyContacts.map(contact => (
              <div
                key={contact.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-100">{contact.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono">
                      {contact.relation}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{contact.phone}</p>
                </div>

                <div className="flex items-center gap-2">
                  {contact.notified ? (
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> SMS Sent
                    </span>
                  ) : (
                    <button
                      onClick={triggerAutomaticDispatch}
                      className="text-xs px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" /> Notify Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Nearest Trauma Hospital Dispatch */}
        <div className="space-y-3">
          <h3 className="font-orbitron font-bold text-sm text-slate-200 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            2. Nearest Hospital & Ambulance Response Team
          </h3>

          <div className="space-y-2">
            {hospitals.map((hosp, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-100">{hosp.name}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 font-mono">
                    <span>Distance: <strong className="text-cyan-400">{hosp.distanceKm} km</strong></span>
                    <span>Ambulance ETA: <strong className="text-emerald-400">{hosp.etaMinutes} mins</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1 ${
                    hosp.status === 'DISPATCHED'
                      ? 'bg-rose-950 border-rose-500 text-rose-300 animate-pulse'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}>
                    {hosp.status === 'DISPATCHED' ? '🚑 Ambulance Dispatched' : 'Trauma Ready'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
