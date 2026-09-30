#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// --- CONFIGURACIÓN DE RED Y API ---
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// IMPORTANTE: Cambia "YOUR_LOCAL_IP" por la IP de tu computadora (ej. 192.168.1.XX) si usas Wokwi local
const char* serverUrl = "http://192.168.20.35:3000/api/telemetry/readings";
const char* actuatorsUrl = "http://192.168.20.35:3000/api/actuators/zone/zone_a";

// IMPORTANTE: Sustituye con tu token real configurado en el backend
const char* deviceToken = "Bearer TU_TOKEN_DE_DISPOSITIVO"; 

// --- CONFIGURACIÓN DE PINES (HARDWARE) ---
#define SENSOR_TEMP_PIN 34 // Pin ADC simulando termistor/sensor
#define SENSOR_HUM_PIN  35 // Pin ADC simulando humedad
#define RELAY_PUMP_PIN  2  // Pin digital para Bomba de Agua (LED azul en Wokwi)
#define RELAY_FAN_PIN   4  // Pin digital para Ventilador (LED verde en Wokwi)

void setup() {
  Serial.begin(115200);
  
  // Configuración de actuadores
  pinMode(RELAY_PUMP_PIN, OUTPUT);
  pinMode(RELAY_FAN_PIN, OUTPUT);
  
  Serial.print("Conectando a WiFi...");
  WiFi.begin(ssid, password);
  while(WiFi.status() != WL_CONNECTED) { 
    delay(500); 
    Serial.print("."); 
  }
  Serial.println("\n¡Conectado a WiFi!");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    
    // ====================================================================
    // 1. UPLINK: Adquisición de Datos Reales y Dinámicos
    // ====================================================================
    
    // Lectura analógica de los sensores (0 a 4095 en ESP32)
    int rawTemp = analogRead(SENSOR_TEMP_PIN);
    int rawHum = analogRead(SENSOR_HUM_PIN);
    
    // Mapeo básico a magnitudes físicas reales
    float realTemp = (rawTemp / 4095.0) * 50.0; // 0 a 50 °C
    float realHum = (rawHum / 4095.0) * 100.0;  // 0 a 100 %
    
    // Empaquetamiento JSON dinámico
    StaticJsonDocument<512> doc;
    doc["greenhouseId"] = "greenhouse_01";
    doc["zoneId"] = "zone_a";
    doc["deviceId"] = "device_esp32_01";
    
    JsonObject readings = doc.createNestedObject("readings");
    readings["temperature"] = realTemp;
    readings["humidity"] = realHum;
    readings["soilMoisture"] = 40.0; // Fijo para demo rápida
    readings["light"] = 800;
    readings["waterLevel"] = 100;

    String payload;
    serializeJson(doc, payload);

    // Enviar datos
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", deviceToken); // ¡Integridad y seguridad validada!
    
    int postCode = http.POST(payload);
    Serial.printf("⬆️ [UPLINK] Telemetría enviada. Temp: %.1f°C | HTTP Code: %d\n", realTemp, postCode);
    http.end();


    // ====================================================================
    // 2. DOWNLINK: Teleproceso (Actuación bidireccional)
    // ====================================================================
    
    http.begin(actuatorsUrl);
    http.addHeader("Authorization", deviceToken); 
    
    int getCode = http.GET();
    if (getCode == 200) {
      String response = http.getString();
      
      StaticJsonDocument<1024> actDoc;
      DeserializationError error = deserializeJson(actDoc, response);
      
      if (!error) {
        JsonArray array = actDoc.as<JsonArray>();
        for (JsonVariant v : array) {
          String type = v["type"].as<String>();
          String state = v["state"].as<String>();
          
          if (type == "pump") {
            digitalWrite(RELAY_PUMP_PIN, state == "on" ? HIGH : LOW);
            Serial.printf("⬇️ [DOWNLINK] Bomba (Pump) -> %s\n", state.c_str());
          } 
          else if (type == "fan") {
            digitalWrite(RELAY_FAN_PIN, state == "on" ? HIGH : LOW);
            Serial.printf("⬇️ [DOWNLINK] Ventilador (Fan) -> %s\n", state.c_str());
          }
        }
      } else {
        Serial.println("❌ Error parseando JSON de actuadores");
      }
    } else {
       Serial.printf("❌ [DOWNLINK] Error en red: %d\n", getCode);
    }
    http.end();
  }
  
  Serial.println("----------------------------------------");
  delay(5000); // Frecuencia de muestreo
}
