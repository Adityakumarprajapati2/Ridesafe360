export type SensorStatus = 'OPERATIONAL' | 'WARNING' | 'CRITICAL_FAULT' | 'DISCONNECTED';

export interface ComponentHealth {
  id: string;
  name: string;
  category: 'Vision' | 'Motion' | 'Contact' | 'Actuator' | 'Power';
  status: SensorStatus;
  details: string;
  lastPingMs: number;
}

export interface FamilyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  notified: boolean;
}

export interface NearestHospital {
  name: string;
  distanceKm: number;
  phone: string;
  etaMinutes: number;
  status: 'READY' | 'DISPATCHED' | 'NOTIFIED';
}

export interface AlertPopup {
  id: string;
  type: 'DROWSINESS' | 'CROWDED' | 'NO_HELMET' | 'GRIP_LOSS' | 'PART_FAULT' | 'COLLAPSE_WARNING' | 'REAR_PROXIMITY' | 'DISTRACTION' | 'UNSTEADY_RIDER';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  actionText?: string;
  timestamp: string;
}

export type ADASStage = 'NORMAL' | 'WARN' | 'ASSIST' | 'SAFE_PULL' | 'EMERGENCY_CRASH';

export interface TelemetryState {
  // Wi-Fi Connection
  wifiConnected: boolean;
  ipAddress: string;
  signalStrengthDbm: number;
  latencyMs: number;

  // Rider State
  helmetDetected: boolean;
  drowsinessLevel: number; // 0 (alert) to 100 (sleeping/fainted)
  dizzinessDetected: boolean;
  riderDistracted: boolean;
  riderUnsteady: boolean;
  gripLeft: 'SECURE' | 'WEAK' | 'ABSENT';
  gripRight: 'SECURE' | 'WEAK' | 'ABSENT';

  // Motion & Vehicle State
  speedKmh: number;
  leanAngleDeg: number; // negative left, positive right
  gForce: number;
  bikeCollapsed: boolean;

  // Environment & Vision
  trafficDensity: 'EMPTY' | 'MODERATE' | 'CROWDED';
  roadCondition: 'SMOOTH' | 'POTHOLES' | 'DEBRIS';
  frontObjectsDetected: number;
  rearVehicleProximity: boolean;
  recommendedSpeedLimit: number;

  // Actuators & SafePull
  stabilizersDeployed: boolean;
  stabilizerLatchLocked: boolean;
  brakePulseActive: boolean;
  throttleLimitedPercent: number;

  // Power
  batteryVoltage: number; // Nominal 12.6V

  // Safety System Level
  currentStage: ADASStage;
}
