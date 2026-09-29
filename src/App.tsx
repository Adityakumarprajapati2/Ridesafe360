import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { InstrumentCluster } from './components/InstrumentCluster';
import { HardwareMonitor } from './components/HardwareMonitor';
import { SafePullVisualizer } from './components/SafePullVisualizer';
import { AlertManager } from './components/AlertManager';
import { SosManager } from './components/SosManager';
import { TelemetrySimulator } from './components/TelemetrySimulator';
import { WifiConfigModal } from './components/WifiConfigModal';
import { LiveCameraFeeds } from './components/LiveCameraFeeds';

import { TelemetryState, ComponentHealth, AlertPopup } from './types/telemetry';
import { soundEffects } from './utils/audio';

export function App() {
  const [activeTab, setActiveTab] = useState<'hud' | 'hardware' | 'cameras' | 'safepull' | 'sos'>('cameras');

  // Core Telemetry State
  const [telemetry, setTelemetry] = useState<TelemetryState>({
    wifiConnected: true,
    ipAddress: '192.168.4.1',
    signalStrengthDbm: -56,
    latencyMs: 14,

    helmetDetected: true,
    drowsinessLevel: 10,
    dizzinessDetected: false,
    riderDistracted: false,
    riderUnsteady: false,
    gripLeft: 'SECURE',
    gripRight: 'SECURE',

    speedKmh: 42,
    leanAngleDeg: 4,
    gForce: 1.02,
    bikeCollapsed: false,

    trafficDensity: 'EMPTY',
    roadCondition: 'SMOOTH',
    frontObjectsDetected: 1,
    rearVehicleProximity: false,
    recommendedSpeedLimit: 60,

    stabilizersDeployed: false,
    stabilizerLatchLocked: false,
    brakePulseActive: false,
    throttleLimitedPercent: 100,

    batteryVoltage: 12.6,
    currentStage: 'NORMAL'
  });

  // Hardware Components State
  const [components, setComponents] = useState<ComponentHealth[]>([
    { id: 'cam_front', name: 'Front Road Camera (ESP32-CAM)', category: 'Vision', status: 'OPERATIONAL', details: 'Detecting road crowdedness & safe speed limit (30 FPS)', lastPingMs: 12 },
    { id: 'cam_rear', name: 'Rear Proximity Camera', category: 'Vision', status: 'OPERATIONAL', details: 'Approaching vehicle & blindspot monitoring active', lastPingMs: 15 },
    { id: 'cam_rider', name: 'Dashboard Rider Camera', category: 'Vision', status: 'OPERATIONAL', details: 'Rider gaze tracking & posture stability active', lastPingMs: 10 },
    { id: 'imu_mpu6050', name: 'MPU6050 6-DOF IMU Sensor', category: 'Motion', status: 'OPERATIONAL', details: 'Roll/Pitch lean angle & G-force acceleration streaming', lastPingMs: 8 },
    { id: 'grip_sensors', name: 'Handlebar Capacitive Grip Sensors', category: 'Contact', status: 'OPERATIONAL', details: 'Left & Right hand contact confirmed (SECURE)', lastPingMs: 11 },
    { id: 'hall_speed', name: 'Hall Effect Wheel Speed Sensor', category: 'Motion', status: 'OPERATIONAL', details: 'Measuring wheel pulses for precise km/h calculation', lastPingMs: 9 },
    { id: 'actuator_side', name: 'SafePull Side Stabilizer Wheels', category: 'Actuator', status: 'OPERATIONAL', details: 'Linear actuators & side wheels retracted', lastPingMs: 18 },
    { id: 'latch_lock', name: 'Mechanical Locking Latch', category: 'Actuator', status: 'OPERATIONAL', details: 'Solenoid locking mechanism disengaged', lastPingMs: 14 },
    { id: 'haptic_buzzer', name: 'Haptic Grip Motors & Buzzer', category: 'Contact', status: 'OPERATIONAL', details: 'Alert vibrators ready', lastPingMs: 12 },
    { id: 'power_unit', name: '12V Power Unit & Regulators', category: 'Power', status: 'OPERATIONAL', details: '12.6V supply voltage nominal | Fuses intact', lastPingMs: 6 }
  ]);

  // Alert Popups Queue
  const [alerts, setAlerts] = useState<AlertPopup[]>([]);
  const [isSosOpen, setIsSosOpen] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isWifiModalOpen, setIsWifiModalOpen] = useState<boolean>(false);
  const [isSelfTesting, setIsSelfTesting] = useState<boolean>(false);

  // Sensor Fusion Decision Engine
  useEffect(() => {
    let stage: TelemetryState['currentStage'] = 'NORMAL';
    let deployStab = false;
    let lockLatch = false;
    let brakePulse = false;
    let throttleLimit = 100;

    // Check Hardware Faults
    const hasFault = components.some(c => c.status === 'CRITICAL_FAULT' || c.status === 'DISCONNECTED');
    if (hasFault) {
      addAlertUnique({
        id: 'PART_FAULT_ALERT',
        type: 'PART_FAULT',
        severity: 'WARNING',
        title: '⚠️ HARDWARE PART FAULT DETECTED',
        message: 'One or more safety components report a malfunction or connection loss. Fail-safe mode enabled.',
        timestamp: new Date().toLocaleTimeString()
      });
    }

    // Rule 1: Rider Impairment / Drowsiness / Dizziness / Unsteady
    if (telemetry.drowsinessLevel > 60 || telemetry.dizzinessDetected || telemetry.riderUnsteady) {
      stage = 'WARN';
      soundEffects.playWarningBeep();

      addAlertUnique({
        id: 'DROWSY_ALERT',
        type: 'DROWSINESS',
        severity: 'CRITICAL',
        title: '🛑 HOLD FOR A MINUTE — UNSTEADY / UNWELL RIDER',
        message: 'Rider instability or fatigue detected! Please hold handlebars firmly, slow down, and pull over safely to rest.',
        timestamp: new Date().toLocaleTimeString()
      });

      if (telemetry.gripLeft === 'ABSENT' || telemetry.gripRight === 'ABSENT') {
        stage = 'ASSIST';
        throttleLimit = 40;
        brakePulse = true;

        if (telemetry.speedKmh < 25) {
          stage = 'SAFE_PULL';
          deployStab = true;
          lockLatch = true;
        }
      }
    }

    // Rule 2: Crowded Area Traffic Warning
    if (telemetry.trafficDensity === 'CROWDED') {
      addAlertUnique({
        id: 'CROWDED_ALERT',
        type: 'CROWDED',
        severity: 'WARNING',
        title: '⚠️ GO SLOW — CROUDED AREA AHEAD',
        message: `Front camera detected heavy pedestrian/vehicle density. Speed limit set to ${telemetry.recommendedSpeedLimit} km/h.`,
        timestamp: new Date().toLocaleTimeString()
      });
      throttleLimit = Math.min(throttleLimit, 50);
    }

    // Rule 3: No Helmet Warning
    if (!telemetry.helmetDetected) {
      addAlertUnique({
        id: 'NO_HELMET_ALERT',
        type: 'NO_HELMET',
        severity: 'WARNING',
        title: '⚠️ SAFETY WARNING: NO HELMET DETECTED',
        message: 'Rider camera indicates no helmet worn. Please wear your protective helmet before riding.',
        timestamp: new Date().toLocaleTimeString()
      });
    }

    // Rule 4: Rider Distracted (Looking Away)
    if (telemetry.riderDistracted) {
      addAlertUnique({
        id: 'DISTRACTION_ALERT',
        type: 'DISTRACTION',
        severity: 'WARNING',
        title: '👁️ STAY FOCUS — KEEP EYES ON ROAD',
        message: 'Dashboard camera detected rider looking away from the road. Please maintain focus.',
        timestamp: new Date().toLocaleTimeString()
      });
    }

    // Rule 5: Rear Vehicle Proximity Alert
    if (telemetry.rearVehicleProximity) {
      addAlertUnique({
        id: 'REAR_PROXIMITY_ALERT',
        type: 'REAR_PROXIMITY',
        severity: 'WARNING',
        title: '⚠️ STAY ALERT — VEHICLE BEHIND YOU',
        message: 'Rear camera vision detected a vehicle approaching rapidly in your blindspot.',
        timestamp: new Date().toLocaleTimeString()
      });
    }

    // Rule 6: Loss of Grip Warning
    if (telemetry.gripLeft === 'ABSENT' && telemetry.gripRight === 'ABSENT' && stage === 'NORMAL') {
      stage = 'WARN';
      addAlertUnique({
        id: 'GRIP_LOSS_ALERT',
        type: 'GRIP_LOSS',
        severity: 'WARNING',
        title: '✋ WARNING: BOTH HANDS OFF HANDLEBARS',
        message: 'Grip sensors report zero contact. Please grip the handlebars securely.',
        timestamp: new Date().toLocaleTimeString()
      });
    }

    // Rule 7: Bike Collapse / Crash Trigger
    if (Math.abs(telemetry.leanAngleDeg) > 50 || telemetry.bikeCollapsed) {
      stage = 'EMERGENCY_CRASH';
      setIsSosOpen(true);
    }

    setTelemetry(prev => ({
      ...prev,
      currentStage: stage,
      stabilizersDeployed: deployStab,
      stabilizerLatchLocked: lockLatch,
      brakePulseActive: brakePulse,
      throttleLimitedPercent: throttleLimit
    }));

  }, [
    telemetry.drowsinessLevel,
    telemetry.dizzinessDetected,
    telemetry.riderUnsteady,
    telemetry.riderDistracted,
    telemetry.rearVehicleProximity,
    telemetry.gripLeft,
    telemetry.gripRight,
    telemetry.trafficDensity,
    telemetry.helmetDetected,
    telemetry.leanAngleDeg,
    telemetry.bikeCollapsed,
    telemetry.speedKmh,
    components
  ]);

  // Prevent Duplicate Alerts of the Same Type
  const addAlertUnique = (newAlert: AlertPopup) => {
    setAlerts(prev => {
      if (prev.some(a => a.type === newAlert.type)) return prev;
      return [newAlert, ...prev].slice(0, 2);
    });
  };

  const handleClearAlert = (type: string) => {
    setAlerts(prev => prev.filter(a => a.type !== type));
  };

  const handleTriggerCustomAlert = (title: string, message: string, type: any, severity: any) => {
    addAlertUnique({
      id: `${type}_ALERT`,
      type,
      severity,
      title,
      message,
      timestamp: new Date().toLocaleTimeString()
    });
  };

  const handleDismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleToggleHardwareFault = (componentId: string) => {
    setComponents(prev => prev.map(c => {
      if (c.id === componentId) {
        const nextStatus = c.status === 'OPERATIONAL' ? 'CRITICAL_FAULT' : 'OPERATIONAL';
        return {
          ...c,
          status: nextStatus,
          details: nextStatus === 'CRITICAL_FAULT' ? 'SIGNAL DISCONNECTED / FAULT INJECTED' : 'Operational OK'
        };
      }
      return c;
    }));
  };

  const handleRunSelfTest = () => {
    setIsSelfTesting(true);
    setTimeout(() => {
      setIsSelfTesting(false);
      setComponents(prev => prev.map(c => ({
        ...c,
        status: 'OPERATIONAL',
        details: 'Self-test verified: Signal nominal',
        lastPingMs: Math.floor(6 + Math.random() * 10)
      })));
      setAlerts(prev => prev.filter(a => a.type !== 'PART_FAULT'));
    }, 1500);
  };

  const handleTriggerDrowsyWarning = () => {
    setTelemetry(prev => ({
      ...prev,
      drowsinessLevel: 85,
      dizzinessDetected: true,
      gripLeft: 'WEAK'
    }));
  };

  const handleTriggerCrowdedWarning = () => {
    setTelemetry(prev => ({
      ...prev,
      trafficDensity: 'CROWDED',
      recommendedSpeedLimit: 20,
      frontObjectsDetected: 6
    }));
  };

  const handleSimulateCollapse = () => {
    setTelemetry(prev => ({
      ...prev,
      leanAngleDeg: -58,
      bikeCollapsed: true,
      gripLeft: 'ABSENT',
      gripRight: 'ABSENT'
    }));
    setIsSosOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* App Header & Navbar */}
      <Header
        telemetry={telemetry}
        onOpenWifiConfig={() => setIsWifiModalOpen(true)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onTriggerManualSOS={() => setIsSosOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Pop-up Alert Manager */}
      <AlertManager
        alerts={alerts}
        onDismissAlert={handleDismissAlert}
        onTriggerSOSNow={() => setIsSosOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'hud' && (
          <InstrumentCluster
            telemetry={telemetry}
            onTriggerDrowsyWarning={handleTriggerDrowsyWarning}
            onTriggerCrowdedWarning={handleTriggerCrowdedWarning}
          />
        )}

        {activeTab === 'cameras' && (
          <LiveCameraFeeds
            telemetry={telemetry}
            setTelemetry={setTelemetry}
            onTriggerAlert={handleTriggerCustomAlert}
            onClearAlert={handleClearAlert}
          />
        )}

        {activeTab === 'hardware' && (
          <HardwareMonitor
            components={components}
            onToggleFault={handleToggleHardwareFault}
            onRunSelfTest={handleRunSelfTest}
            isTesting={isSelfTesting}
          />
        )}

        {activeTab === 'safepull' && (
          <SafePullVisualizer
            telemetry={telemetry}
            onSetStage={(stage) => setTelemetry(prev => ({ ...prev, currentStage: stage }))}
          />
        )}

        {activeTab === 'sos' && (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
              <h2 className="font-orbitron font-bold text-xl text-slate-100">
                AI SOS Emergency & Hospital Dispatch Center
              </h2>
              <p className="text-sm text-slate-400 max-w-lg mx-auto">
                Monitors bike tilt, crash G-forces, and rider responsiveness to automatically alert family members and request emergency medical dispatch.
              </p>
              <button
                onClick={() => setIsSosOpen(true)}
                className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm tracking-wider uppercase shadow-xl shadow-rose-950 border border-rose-400 transition-all animate-pulse"
              >
                Launch Live SOS Dispatch Simulator
              </button>
            </div>
          </div>
        )}
      </main>

      {/* SOS Modal Window */}
      <SosManager
        telemetry={telemetry}
        onCancelSOS={() => {
          setIsSosOpen(false);
          setTelemetry(prev => ({ ...prev, bikeCollapsed: false, leanAngleDeg: 0 }));
        }}
        isOpen={isSosOpen}
      />

      {/* Telemetry Simulator Drawer */}
      <TelemetrySimulator
        telemetry={telemetry}
        setTelemetry={setTelemetry}
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onSimulateCollapse={handleSimulateCollapse}
      />

      {/* Wi-Fi Config Modal */}
      <WifiConfigModal
        telemetry={telemetry}
        setTelemetry={setTelemetry}
        isOpen={isWifiModalOpen}
        onClose={() => setIsWifiModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        RideSafe360 ADAS Project &copy; 2026 — Narula Institute of Technology (Electronics & Computer Science)
      </footer>
    </div>
  );
}
