#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// --- CONFIGURACIÓN DE RED Y API ---
const char* ssid = "Wokwi-GUEST";
const char* password = "";

const char* serverUrl = "https://TU-LINK.pinggy.link/api/telemetry/readings";
const char* actuatorsUrl = "https://TU-LINK.pinggy.link/api/actuators/zone/zone_a";
const char* deviceToken = "Bearer demo-device-token"; 

// --- CONFIGURACIÓN DE PINES (HARDWARE) ---
#define SENSOR_TEMP_PIN   34 // Potenciómetro (Temperatura)
#define SENSOR_HUM_PIN    35 // Potenciómetro (Humedad)
#define SENSOR_SOIL_PIN   32 // Potenciómetro (Humedad del suelo)
#define SENSOR_LIGHT_PIN  33 // Módulo LDR (Luz)
#define SENSOR_WATER_PIN  25 // Potenciómetro (Nivel de agua)

#define RELAY_PUMP_PIN    2  // LED azul (Bomba)
#define RELAY_FAN_PIN     4  // LED verde (Ventilador)

void setup() {
  Serial.begin(115200);
  
  pinMode(RELAY_PUMP_PIN, OUTPUT);
  pinMode(RELAY_FAN_PIN, OUTPUT);
  
  Serial.print("Conectando a la red WiFi simulada...");
  WiFi.begin(ssid, password);
  while(WiFi.status() != WL_CONNECTED) { 
    delay(500); 
    Serial.print("."); 
  }
  Serial.println("\n¡Conectado a WiFi!");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    
    // ==========================================
    // 1. UPLINK: Lectura de los 5 Sensores
    // ==========================================
    int rawTemp  = analogRead(SENSOR_TEMP_PIN);
    int rawHum   = analogRead(SENSOR_HUM_PIN);
    int rawSoil  = analogRead(SENSOR_SOIL_PIN);
    int rawLight = analogRead(SENSOR_LIGHT_PIN);
    int rawWater = analogRead(SENSOR_WATER_PIN);
    
    // Mapeo de valores (ajustados para simular datos reales)
    float realTemp  = (rawTemp / 4095.0) * 50.0;   // 0 a 50 °C
    float realHum   = (rawHum / 4095.0) * 100.0;   // 0 a 100 %
    float realSoil  = (rawSoil / 4095.0) * 100.0;  // 0 a 100 %
    float realLight = (rawLight / 4095.0) * 1000.0;// 0 a 1000 lux
    float realWater = (rawWater / 4095.0) * 100.0; // 0 a 100 % tanque
    
    StaticJsonDocument<512> doc;
    doc["greenhouseId"] = "greenhouse_01";
    doc["zoneId"] = "zone_a";
    doc["deviceId"] = "device_esp32_01";
    
    JsonObject readings = doc.createNestedObject("readings");
    readings["temperature"]  = realTemp;
    readings["humidity"]     = realHum;
    readings["soilMoisture"] = realSoil;
    readings["light"]        = realLight;
    readings["waterLevel"]   = realWater;

    String payload;
    serializeJson(doc, payload);

    // Enviar al Servidor
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", deviceToken);
    
    int postCode = http.POST(payload);
    Serial.printf("⬆️ [UPLINK] T:%.1f°C | H:%.1f%% | Suelo:%.1f%% | Luz:%.1f | Agua:%.1f%% -> Code: %d\n", 
                  realTemp, realHum, realSoil, realLight, realWater, postCode);
    http.end();

    // ==========================================
    // 2. DOWNLINK: Revisar estado de los Actuadores
    // ==========================================
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
          } 
          else if (type == "fan") {
            digitalWrite(RELAY_FAN_PIN, state == "on" ? HIGH : LOW);
          }
        }
      }
    }
    http.end();
  }
  
  Serial.println("----------------------------------------");
  delay(5000); // Muestreo cada 5 segundos
}
