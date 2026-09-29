# Arquitectura del Sistema

El sistema implementa una arquitectura por capas:

1. **Adquisición**: Wokwi o Simulador envían lecturas mediante HTTP POST.
2. **Validación y Persistencia**: Se validan los datos en el servicio y se persisten en SQLite.
3. **Motor de Reglas**: Se evalúan variables como humedad del sustrato, temperatura y nivel del tanque para generar alertas y accionar simuladamente actuadores (bombas, ventiladores).
4. **Dashboard Web**: Interfaz simple en HTML/JS que hace polling periódico para mostrar el estado en tiempo real, alertas y controles manuales.

## Entidades Principales
- **Greenhouse / Zone**: Jerarquía física del invernadero.
- **Device**: Dispositivos simulados (ESP32).
- **Telemetry**: Lecturas de los sensores.
- **Actuators**: Bombas, ventiladores y ventanas.
- **Alerts / Events**: Historial de incidentes y acciones tomadas.
