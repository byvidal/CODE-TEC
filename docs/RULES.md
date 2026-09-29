# Reglas de Automatización

- **Humedad Baja**: Si `soilMoisture < min` -> Alerta LOW_SOIL_MOISTURE + Bomba ON.
- **Tanque Bajo**: Si `waterLevel < 15` -> Alerta crítica + Bloqueo de Bomba.
- **Temperatura Alta**: Si `temperature > max` -> Alerta HIGH_TEMPERATURE + Ventilador ON.
- **Recuperación**: Variables en rangos normales resuelven alertas y apagan actuadores.
