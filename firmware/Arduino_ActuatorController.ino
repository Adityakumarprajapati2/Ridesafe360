/*
 * RideSafe360 : SafePull Actuator Controller Firmware (Arduino Uno/Nano)
 * Controls Side Stabilizer Wheels Linear Actuators, Mechanical Locking Latch, and Pulsed Brake Servos
 */

#include <Servo.h>

Servo leftStabilizerServo;
Servo rightStabilizerServo;
Servo brakePulseServo;

#define LATCH_SOLENOID_PIN 8
#define HAZARD_LIGHTS_PIN 9

void setup() {
  Serial.begin(9600);

  leftStabilizerServo.attach(3);   // Left stabilizer arm
  rightStabilizerServo.attach(5);  // Right stabilizer arm
  brakePulseServo.attach(6);      // Brake pulse actuator

  pinMode(LATCH_SOLENOID_PIN, OUTPUT);
  pinMode(HAZARD_LIGHTS_PIN, OUTPUT);

  // Retract side wheels by default
  retractStabilizers();
}

void retractStabilizers() {
  leftStabilizerServo.write(0);
  rightStabilizerServo.write(0);
  digitalWrite(LATCH_SOLENOID_PIN, LOW); // Latch unlocked
  digitalWrite(HAZARD_LIGHTS_PIN, LOW);
  Serial.println("[Arduino] Stabilizers Retracted. Bike in Normal Mode.");
}

void deploySafePullStabilizers() {
  Serial.println("[Arduino] Deploying SafePull Side Stabilizer Wheels...");
  
  // 1. Swing stabilizer arms out
  leftStabilizerServo.write(90);
  rightStabilizerServo.write(90);
  delay(1000);

  // 2. Engage mechanical locking latch (holds load safely)
  digitalWrite(LATCH_SOLENOID_PIN, HIGH);
  
  // 3. Flash hazard warning lights
  digitalWrite(HAZARD_LIGHTS_PIN, HIGH);
  Serial.println("[Arduino] SafePull Stabilizers Deployed & Mechanically Locked!");
}

void loop() {
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();

    if (cmd == "DEPLOY_SAFEPULL") {
      deploySafePullStabilizers();
    } else if (cmd == "RETRACT_STABILIZERS") {
      retractStabilizers();
    }
  }
}
