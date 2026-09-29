# Documentación de API REST

- `GET /api/health`: Estado del sistema.
- `GET /api/greenhouses`: Lista de invernaderos.
- `GET /api/telemetry/latest`: Última lectura registrada.
- `POST /api/telemetry/readings`: Envío de telemetría desde dispositivo (body: greenhouseId, zoneId, deviceId, timestamp, readings).
- `GET /api/alerts/active`: Alertas no resueltas.
- `POST /api/alerts/:id/resolve`: Resuelve una alerta.
- `GET /api/actuators`: Estado de actuadores.
- `POST /api/actuators/:id/command`: Ejecuta una acción manual sobre un actuador.
