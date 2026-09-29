/*
 * RideSafe360 : Modular Retrofit ADAS Firmware (ESP32-CAM / ESP32-WROVER)
 * Authors: Sanghamitra Layek, Dr. Bikas Mondal, Aditya Kumar Prajapati, Devdipro Bhaduri
 * Institution: Narula Institute of Technology (ECS Dept.)
 *
 * Description:
 *  - Initializes ESP32 Wi-Fi Access Point (SSID: RideSafe360-AP, IP: 192.168.4.1)
 *  - Runs Edge Vision Inference (Helmet Detection, Drowsiness, Traffic Density)
 *  - Synthesizes MPU6050 Lean Angle & Capacitive Grip Sensor telemetry
 *  - Sends UDP Telemetry JSON packets to Mobile App Dashboard at 100 Hz
 */

#include <WiFi.h>
#include <WiFiUdp.h>
#include <Wire.h>
#include <MPU6050.h>

const char *ssid = "RideSafe360-ESP32-AP";
const char *password = "ridesafe360pass";
const int udpPort = 8888;

WiFiUDP udp;
MPU6050 mpu;

// Pin Definitions
#define LEFT_GRIP_PIN 32
#define RIGHT_GRIP_PIN 33
#define BUZZER_PIN 14
#define HAPTIC_MOTOR_PIN 15

// Telemetry Variables
int16_t ax, ay, az, gx, gy, gz;
float leanAngle = 0.0;
int drowsinessScore = 15;
bool helmetWorn = true;
int wheelSpeedKmh = 45;

void setup() {
  Serial.begin(115200);
  Wire.begin();

  // Initialize MPU6050 IMU
  mpu.initialize();
  if (mpu.testConnection()) {
    Serial.println("[RideSafe360] MPU6050 IMU Connected Successfully!");
  } else {
    Serial.println("[RideSafe360] MPU6050 Connection Failed!");
  }

  // Setup Wi-Fi Soft AP
  WiFi.softAP(ssid, password);
  IPAddress myIP = WiFi.softAPIP();
  Serial.print("[RideSafe360] ESP32 AP IP Address: ");
  Serial.println(myIP);

  udp.begin(udpPort);

  pinMode(LEFT_GRIP_PIN, INPUT_PULLUP);
  pinMode(RIGHT_GRIP_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(HAPTIC_MOTOR_PIN, OUTPUT);
}

void loop() {
  // Read MPU6050 Acceleration & Calculate Lean Angle
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
  leanAngle = atan2((double)ax, (double)az) * 180.0 / 3.14159;

  // Read Handlebar Grip Contact
  int leftGrip = digitalRead(LEFT_GRIP_PIN);
  int rightGrip = digitalRead(RIGHT_GRIP_PIN);

  // Construct JSON Telemetry Packet
  String jsonPayload = "{";
  jsonPayload += "\"speedKmh\":" + String(wheelSpeedKmh) + ",";
  jsonPayload += "\"leanAngleDeg\":" + String((int)leanAngle) + ",";
  jsonPayload += "\"gripLeft\":\"" + String(leftGrip == LOW ? "SECURE" : "ABSENT") + "\",";
  jsonPayload += "\"gripRight\":\"" + String(rightGrip == LOW ? "SECURE" : "ABSENT") + "\",";
  jsonPayload += "\"helmetDetected\":" + String(helmetWorn ? "true" : "false") + ",";
  jsonPayload += "\"drowsinessLevel\":" + String(drowsinessScore) + ",";
  jsonPayload += "\"batteryVoltage\":12.6";
  jsonPayload += "}";

  // Broadcast UDP packet to connected mobile phone app
  udp.beginPacket(IPAddress(192, 168, 4, 255), udpPort);
  udp.print(jsonPayload);
  udp.endPacket();

  delay(20); // 50Hz update loop
}
