import os
import json

base_dir = r"c:\Users\ibrya\Documents\TECNM\HakaReg\CODE-TEC"

def write_file(path, content):
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

write_file("README.md", """
# Greenhouse Monitor

Sistema de adquisición de datos, telemetría y teleprocesos para invernaderos inteligentes.
Recibe datos de sensores (simulados en Wokwi o Node.js), los valida, almacena, y los muestra en un dashboard en tiempo real. 
Genera alertas y simula el control de actuadores de forma automática o manual.

## Instalación

```bash
npm install
```

## Configuración y Ejecución

1. Inicializar la base de datos (SQLite):
   ```bash
   npm run db:seed
   ```
2. Iniciar el servidor backend y frontend:
   ```bash
   npm start
   ```
   (El servidor corre en http://localhost:3000)

## Simulación de Telemetría

Puedes enviar datos al servidor utilizando el simulador incluido en Node.js:
```bash
npm run simulator
```

También puedes usar **Wokwi** cargando los archivos de la carpeta `wokwi/`.

## Pruebas
```bash
npm test
```
""")

write_file("docs/ARCHITECTURE.md", """
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
""")

write_file("docs/API.md", """
# Documentación de API REST

- `GET /api/health`: Estado del sistema.
- `GET /api/greenhouses`: Lista de invernaderos.
- `GET /api/telemetry/latest`: Última lectura registrada.
- `POST /api/telemetry/readings`: Envío de telemetría desde dispositivo (body: greenhouseId, zoneId, deviceId, timestamp, readings).
- `GET /api/alerts/active`: Alertas no resueltas.
- `POST /api/alerts/:id/resolve`: Resuelve una alerta.
- `GET /api/actuators`: Estado de actuadores.
- `POST /api/actuators/:id/command`: Ejecuta una acción manual sobre un actuador.
""")

write_file("docs/WOKWI_SETUP.md", """
# Configuración Wokwi

1. Abre [Wokwi](https://wokwi.com/).
2. Crea un nuevo proyecto ESP32.
3. Sustituye el contenido de `diagram.json` y `sketch.ino` por los archivos que están en `wokwi/` en este repositorio.
4. Asegúrate de configurar la IP local de tu computadora en lugar de `YOUR_LOCAL_IP`.
5. Ejecuta la simulación.
""")

write_file("docs/DEMO.md", """
# Guion de Demostración

1. Ejecuta `npm run db:seed` y `npm start`.
2. Abre `http://localhost:3000` en tu navegador para ver el Dashboard.
3. En otra terminal, ejecuta `npm run simulator`.
4. Observa cómo llegan los datos al Dashboard (se actualiza automáticamente cada 2 segundos).
5. En el simulador, la humedad de sustrato descenderá paulatinamente. 
6. Al cruzar el umbral bajo (35%), se generará una **alerta crítica** visible en la interfaz, y la bomba de riego cambiará a estado **ON**.
7. Puedes probar apagar la bomba **manualmente** haciendo clic en los controles del dashboard.
""")

write_file("docs/BUSINESS_MODEL.md", """
# Modelo de Negocio

El sistema Greenhouse Monitor se comercializa a través de un modelo SaaS (Software as a Service) por suscripciones:

- **Demo/Free**: Funcionalidades limitadas, 1 invernadero.
- **Básico**: Hasta 3 zonas, historial 30 días, automatización básica.
- **Profesional**: Historial 1 año, reportes avanzados, alertas críticas SMS/Correo.
- **Institucional**: Contratos anuales, personalización, instalación de hardware.

La facturación simulada utilizará pasarelas externas (Stripe/MercadoPago) a través del flujo de Checkout para no almacenar información de tarjetas localmente.
""")
print("Docs generated")
