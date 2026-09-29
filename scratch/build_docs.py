import os

base_dir = r"c:\Users\ibrya\Documents\TECNM\HakaReg\CODE-TEC"

def write_file(path, content):
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

write_file("README.md", '''
# Greenhouse Monitor

Prototipo de sistema de adquisición de datos, telemetría y teleprocesos para invernaderos.
El backend recibe datos simulados de Wokwi o de un simulador Node.js, los procesa y persiste, para un futuro dashboard.

## Requisitos
- Node.js 20+

## Instalación
```bash
npm install
```

## Inicialización
```bash
npm run db:reset
```

## Ejecución
```bash
npm start
```
El servidor correrá en http://localhost:3000.

## Simulación de Telemetría
```bash
npm run simulator:normal
npm run simulator:dry
npm run simulator:heat
npm run simulator:low-water
npm run simulator:disconnect
```

## Pruebas
```bash
npm test
```

## Limitaciones
- Los sensores son simulados.
- Las suscripciones utilizan un modelo mock.
''')

write_file("docs/API.md", '''
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
''')

write_file("docs/TELEMETRY.md", '''
# Flujo de Telemetría

1. **Dispositivo/Simulador**: Genera lecturas y envía `POST /api/telemetry/readings` con Token.
2. **Adquisición**: Express recibe. Rate limiter protege el endpoint. Middleware autentica.
3. **Validación**: Verifica pertenencia a zona y rangos físicos (ej. temp -20 a 80).
4. **Persistencia**: SQLite.
5. **Reglas**: Motor de reglas analiza lecturas y genera alertas/comandos a actuadores.
''')

write_file("docs/RULES.md", '''
# Reglas de Automatización

- **Humedad Baja**: Si `soilMoisture < min` -> Alerta LOW_SOIL_MOISTURE + Bomba ON.
- **Tanque Bajo**: Si `waterLevel < 15` -> Alerta crítica + Bloqueo de Bomba.
- **Temperatura Alta**: Si `temperature > max` -> Alerta HIGH_TEMPERATURE + Ventilador ON.
- **Recuperación**: Variables en rangos normales resuelven alertas y apagan actuadores.
''')

write_file("docs/DEMO.md", '''
# Guion de Demo

1. Ejecutar `npm run db:reset`.
2. Iniciar servidor `npm start`.
3. Ejecutar `npm run simulator:normal`.
4. Ejecutar `npm run simulator:dry`. Ver alerta de humedad baja y bomba encendida.
5. Ejecutar `npm run simulator:normal`. Ver bomba apagada.
6. Ejecutar `npm run simulator:heat`. Ver ventilador.
7. Ejecutar `npm run simulator:low-water`. Ver bloqueo de bomba.
8. Ejecutar `npm run simulator:disconnect`.
''')

write_file("docs/BILLING.md", '''
# Facturación (Billing Mock)
El prototipo implementa estados `demo`, `basic`, `professional`.
No almacena tarjetas ni información bancaria real.
''')
print("Docs generated.")
