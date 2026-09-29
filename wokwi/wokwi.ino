#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "Wokwi-GUEST";
const char* password = "";
const char* serverUrl = "http://YOUR_LOCAL_IP:3000/api/telemetry/readings";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while(WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("Connected!");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    String payload = "{\"greenhouseId\":\"greenhouse_01\",\"zoneId\":\"zone_a\",\"deviceId\":\"device_esp32_01\",\"readings\":{\"temperature\":28.0,\"humidity\":60,\"soilMoisture\":30,\"light\":800,\"waterLevel\":100}}";
    int code = http.POST(payload);
    Serial.println(code);
    http.end();
  }
  delay(5000);
}
