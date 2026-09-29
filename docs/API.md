# API REST

## Telemetría
- `POST /api/telemetry/readings`: Enviar telemetría.
  - Headers: `Authorization: Bearer <token>`
- `GET /api/telemetry/latest`: Última lectura.
- `GET /api/telemetry/history`: Historial.

## Dispositivos
- `GET /api/devices`: Lista de dispositivos.

## Alertas
- `GET /api/alerts/active`: Alertas activas.
- `POST /api/alerts/:id/resolve`: Resolver alerta.

## Actuadores
- `GET /api/actuators`: Estado.
- `POST /api/actuators/:id/command`: Enviar comando (on/off).
