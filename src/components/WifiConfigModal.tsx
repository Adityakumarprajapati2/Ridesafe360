import React, { useState } from 'react';
import { Wifi, X, RefreshCw } from 'lucide-react';
import { TelemetryState } from '../types/telemetry';

interface WifiConfigModalProps {
  telemetry: TelemetryState;
  setTelemetry: React.Dispatch<React.SetStateAction<TelemetryState>>;
  isOpen: boolean;
  onClose: () => void;
}

export const WifiConfigModal: React.FC<WifiConfigModalProps> = ({
  telemetry,
  setTelemetry,
  isOpen,
  onClose
}) => {
  const [ip, setIp] = useState<string>(telemetry.ipAddress);
  const [port, setPort] = useState<string>('8888');
  const [ssid, setSsid] = useState<string>('RideSafe360-ESP32-AP');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setTelemetry(prev => ({
        ...prev,
        wifiConnected: true,
        ipAddress: ip,
        latencyMs: Math.floor(12 + Math.random() * 8)
      }));
      onClose();
    }, 1200);
  };

  const handleDisconnect = () => {
    setTelemetry(prev => ({ ...prev, wifiConnected: false }));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-5">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-cyan-400" />
            <h3 className="font-orbitron font-bold text-slate-100 text-sm">
              Motorcycle Wi-Fi Connectivity Setup
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-slate-300 font-medium block mb-1">Bike Wi-Fi SSID / Access Point</label>
            <input
              type="text"
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-300 font-medium block mb-1">ESP32 IP Address</label>
              <input
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">UDP Packet Port</label>
              <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>Protocol:</span>
            <span className="font-mono text-cyan-400">UDP / WebSockets (Edge AI)</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Target Hardware:</span>
            <span className="font-mono text-slate-200">ESP32-WROVER + Arduino</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          {telemetry.wifiConnected ? (
            <button
              onClick={handleDisconnect}
              className="w-full py-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold text-xs transition-all"
            >
              Disconnect Wi-Fi Link
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Establishing UDP Link...
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4" />
                  Connect to Bike Wi-Fi
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
