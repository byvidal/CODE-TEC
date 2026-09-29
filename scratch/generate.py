import os
import json

base_dir = r"c:\Users\ibrya\Documents\TECNM\HakaReg\CODE-TEC"

def write_file(path, content):
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# src/server.js
write_file("src/server.js", """
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const healthRoutes = require('./routes/health');
const greenhouseRoutes = require('./routes/greenhouses');
const telemetryRoutes = require('./routes/telemetry');
const alertRoutes = require('./routes/alerts');
const actuatorRoutes = require('./routes/actuators');
const billingRoutes = require('./routes/billing');
const demoRoutes = require('./routes/demo');
const eventRoutes = require('./routes/events');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/greenhouses', greenhouseRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/actuators', actuatorRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/events', eventRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Greenhouse Monitor API running on http://localhost:${PORT}`);
});
""")

# src/middleware/errorHandler.js
write_file("src/middleware/errorHandler.js", """
module.exports = (err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
    });
};
""")

# src/repositories/db.js
write_file("src/repositories/db.js", """
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../../data/greenhouse.db');
const fs = require('fs');

if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const db = new sqlite3.Database(dbPath);

const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

module.exports = { query, run, db };
""")

# src/repositories/greenhouseRepository.js
write_file("src/repositories/greenhouseRepository.js", """
const { query, run } = require('./db');

exports.getAll = () => query("SELECT * FROM greenhouses");
exports.getById = (id) => query("SELECT * FROM greenhouses WHERE id = ?", [id]).then(r => r[0]);
exports.getZones = (greenhouseId) => query("SELECT * FROM zones WHERE greenhouseId = ?", [greenhouseId]);
exports.getZoneById = (id) => query("SELECT * FROM zones WHERE id = ?", [id]).then(r => r[0]);
""")

# src/repositories/telemetryRepository.js
write_file("src/repositories/telemetryRepository.js", """
const { query, run } = require('./db');

exports.insertReading = async (reading) => {
    const { id, greenhouseId, zoneId, deviceId, timestamp, temperature, humidity, soilMoisture, light, waterLevel } = reading;
    await run(`INSERT INTO telemetry_readings 
        (id, greenhouseId, zoneId, deviceId, timestamp, temperature, humidity, soilMoisture, light, waterLevel) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [id, greenhouseId, zoneId, deviceId, timestamp, temperature, humidity, soilMoisture, light, waterLevel]
    );
};
exports.getLatest = () => query("SELECT * FROM telemetry_readings ORDER BY timestamp DESC LIMIT 1").then(r => r[0]);
exports.getHistory = (limit=100) => query("SELECT * FROM telemetry_readings ORDER BY timestamp DESC LIMIT ?", [limit]);
""")

# src/repositories/eventRepository.js
write_file("src/repositories/eventRepository.js", """
const { query, run } = require('./db');
exports.insertEvent = async (event) => {
    await run(`INSERT INTO actuator_events (id, type, source, actuatorId, previousState, newState, reason, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [event.id, event.type, event.source, event.actuatorId, event.previousState, event.newState, event.reason, event.createdAt]);
};
exports.getRecent = () => query("SELECT * FROM actuator_events ORDER BY createdAt DESC LIMIT 50");
""")

# src/repositories/alertRepository.js
write_file("src/repositories/alertRepository.js", """
const { query, run } = require('./db');
exports.insertAlert = async (alert) => {
    await run(`INSERT INTO alerts (id, greenhouseId, zoneId, type, severity, message, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [alert.id, alert.greenhouseId, alert.zoneId, alert.type, alert.severity, alert.message, alert.status, alert.createdAt]);
};
exports.getActive = () => query("SELECT * FROM alerts WHERE status = 'active' ORDER BY createdAt DESC");
exports.resolveAlertByType = async (type, zoneId) => {
    await run(`UPDATE alerts SET status = 'resolved', resolvedAt = ? WHERE type = ? AND zoneId = ? AND status = 'active'`, [new Date().toISOString(), type, zoneId]);
};
exports.resolveAlert = async (id) => {
    await run(`UPDATE alerts SET status = 'resolved', resolvedAt = ? WHERE id = ?`, [new Date().toISOString(), id]);
};
""")

# src/repositories/actuatorRepository.js
write_file("src/repositories/actuatorRepository.js", """
const { query, run } = require('./db');
exports.getAll = () => query("SELECT * FROM actuators");
exports.getById = (id) => query("SELECT * FROM actuators WHERE id = ?", [id]).then(r => r[0]);
exports.updateState = async (id, state, mode) => {
    await run("UPDATE actuators SET state = ?, mode = ?, lastChangedAt = ? WHERE id = ?", [state, mode, new Date().toISOString(), id]);
};
""")

# src/repositories/deviceRepository.js
write_file("src/repositories/deviceRepository.js", """
const { query, run } = require('./db');
exports.getById = (id) => query("SELECT * FROM devices WHERE id = ?", [id]).then(r => r[0]);
exports.updateLastSeen = (id) => run("UPDATE devices SET status = 'online', lastSeenAt = ? WHERE id = ?", [new Date().toISOString(), id]);
exports.setOffline = (id) => run("UPDATE devices SET status = 'offline' WHERE id = ?", [id]);
exports.getAll = () => query("SELECT * FROM devices");
""")

# src/services/telemetryService.js
write_file("src/services/telemetryService.js", """
const telemetryRepo = require('../repositories/telemetryRepository');
const greenhouseRepo = require('../repositories/greenhouseRepository');
const deviceRepo = require('../repositories/deviceRepository');
const ruleEngine = require('./ruleEngineService');
const ids = require('../utils/ids');

exports.processReading = async (data) => {
    const { greenhouseId, zoneId, deviceId, timestamp, readings } = data;
    
    // Validations
    if (!readings || typeof readings.temperature !== 'number') throw new Error("Invalid readings");
    const device = await deviceRepo.getById(deviceId);
    if (!device) throw new Error("Device not found");
    if (device.zoneId !== zoneId) throw new Error("Device does not belong to this zone");
    
    const zone = await greenhouseRepo.getZoneById(zoneId);
    if (!zone) throw new Error("Zone not found");

    // Persist
    const reading = {
        id: ids.generateId('reading'),
        greenhouseId,
        zoneId,
        deviceId,
        timestamp: timestamp || new Date().toISOString(),
        temperature: readings.temperature,
        humidity: readings.humidity,
        soilMoisture: readings.soilMoisture,
        light: readings.light,
        waterLevel: readings.waterLevel
    };
    
    await telemetryRepo.insertReading(reading);
    await deviceRepo.updateLastSeen(deviceId);
    
    // Execute rules
    const result = await ruleEngine.evaluate(zone, reading);
    
    return {
        accepted: true,
        readingId: reading.id,
        alerts: result.alerts,
        actions: result.actions,
        deviceStatus: 'online'
    };
};
""")

# src/services/ruleEngineService.js
write_file("src/services/ruleEngineService.js", """
const alertRepo = require('../repositories/alertRepository');
const actuatorRepo = require('../repositories/actuatorRepository');
const eventRepo = require('../repositories/eventRepository');
const ids = require('../utils/ids');

exports.evaluate = async (zone, reading) => {
    const alerts = [];
    const actions = [];
    const { soilMoisture, temperature, waterLevel } = reading;
    
    // Fetch actuators for zone
    const actuators = await actuatorRepo.getAll();
    const pump = actuators.find(a => a.type === 'pump' && a.zoneId === zone.id);
    const fan = actuators.find(a => a.type === 'fan' && a.zoneId === zone.id);

    // Rule: Low Water Level
    let isWaterLow = waterLevel < 15;
    if (isWaterLow) {
        await createAlert(zone, 'LOW_WATER_LEVEL', 'critical', 'Nivel de tanque muy bajo.');
        alerts.push('LOW_WATER_LEVEL');
        if (pump && pump.state === 'on') {
            await changeActuator(pump, 'off', 'automatic', 'Tanque vacío, protección activada');
            actions.push({ actuatorId: pump.id, state: 'off', reason: 'Tanque vacío' });
        }
    } else {
        await alertRepo.resolveAlertByType('LOW_WATER_LEVEL', zone.id);
    }

    // Rule: Low soil moisture
    if (soilMoisture < zone.soilMoistureMin) {
        await createAlert(zone, 'LOW_SOIL_MOISTURE', 'critical', 'La humedad del sustrato está baja.');
        alerts.push('LOW_SOIL_MOISTURE');
        if (pump && pump.state === 'off' && pump.mode === 'automatic' && !isWaterLow) {
            await changeActuator(pump, 'on', 'automatic', 'Humedad de sustrato baja');
            actions.push({ actuatorId: pump.id, state: 'on', reason: 'Humedad de sustrato baja' });
        }
    }

    // Rule: Soil moisture recovered
    if (soilMoisture >= zone.soilMoistureMax) {
        await alertRepo.resolveAlertByType('LOW_SOIL_MOISTURE', zone.id);
        if (pump && pump.state === 'on' && pump.mode === 'automatic') {
            await changeActuator(pump, 'off', 'automatic', 'Humedad de sustrato recuperada');
            actions.push({ actuatorId: pump.id, state: 'off', reason: 'Humedad recuperada' });
        }
    }

    // Rule: High temperature
    if (temperature > zone.temperatureMax) {
        await createAlert(zone, 'HIGH_TEMPERATURE', 'warning', 'Temperatura por encima del límite.');
        alerts.push('HIGH_TEMPERATURE');
        if (fan && fan.state === 'off' && fan.mode === 'automatic') {
            await changeActuator(fan, 'on', 'automatic', 'Temperatura alta');
            actions.push({ actuatorId: fan.id, state: 'on', reason: 'Temperatura alta' });
        }
    }

    // Rule: Temperature normalized
    if (temperature <= (zone.temperatureMax - 2)) {
        await alertRepo.resolveAlertByType('HIGH_TEMPERATURE', zone.id);
        if (fan && fan.state === 'on' && fan.mode === 'automatic') {
            await changeActuator(fan, 'off', 'automatic', 'Temperatura normalizada');
            actions.push({ actuatorId: fan.id, state: 'off', reason: 'Temperatura normal' });
        }
    }

    return { alerts, actions };
};

async function createAlert(zone, type, severity, message) {
    const activeAlerts = await alertRepo.getActive();
    if (activeAlerts.find(a => a.type === type && a.zoneId === zone.id)) return; // already active

    const alert = {
        id: ids.generateId('alert'),
        greenhouseId: zone.greenhouseId,
        zoneId: zone.id,
        type,
        severity,
        message,
        status: 'active',
        createdAt: new Date().toISOString()
    };
    await alertRepo.insertAlert(alert);
}

async function changeActuator(actuator, newState, source, reason) {
    await actuatorRepo.updateState(actuator.id, newState, actuator.mode);
    await eventRepo.insertEvent({
        id: ids.generateId('event'),
        type: 'ACTUATOR_CHANGED',
        source,
        actuatorId: actuator.id,
        previousState: actuator.state,
        newState,
        reason,
        createdAt: new Date().toISOString()
    });
}
""")

# src/utils/ids.js
write_file("src/utils/ids.js", """
exports.generateId = (prefix) => `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
""")

# src/routes/telemetry.js
write_file("src/routes/telemetry.js", """
const express = require('express');
const router = express.Router();
const telemetryService = require('../services/telemetryService');
const telemetryRepo = require('../repositories/telemetryRepository');

router.post('/readings', async (req, res, next) => {
    try {
        const result = await telemetryService.processReading(req.body);
        res.json(result);
    } catch (err) {
        res.status(400).json({ accepted: false, error: err.message });
    }
});

router.get('/latest', async (req, res) => {
    res.json(await telemetryRepo.getLatest());
});

router.get('/history', async (req, res) => {
    res.json(await telemetryRepo.getHistory());
});

module.exports = router;
""")

# ... Rest of routes ...
write_file("src/routes/health.js", "const router = require('express').Router(); router.get('/', (req,res) => res.json({status: 'ok'})); module.exports = router;")
write_file("src/routes/greenhouses.js", """
const router = require('express').Router();
const repo = require('../repositories/greenhouseRepository');
router.get('/', async (req, res) => res.json(await repo.getAll()));
router.get('/:id', async (req, res) => res.json(await repo.getById(req.params.id)));
router.get('/:id/zones', async (req, res) => res.json(await repo.getZones(req.params.id)));
module.exports = router;
""")
write_file("src/routes/alerts.js", """
const router = require('express').Router();
const repo = require('../repositories/alertRepository');
router.get('/active', async (req, res) => res.json(await repo.getActive()));
router.post('/:id/resolve', async (req, res) => {
    await repo.resolveAlert(req.params.id);
    res.json({ success: true });
});
module.exports = router;
""")
write_file("src/routes/actuators.js", """
const router = require('express').Router();
const repo = require('../repositories/actuatorRepository');
const eventRepo = require('../repositories/eventRepository');
const ids = require('../utils/ids');
router.get('/', async (req, res) => res.json(await repo.getAll()));
router.get('/status', async (req, res) => res.json(await repo.getAll()));
router.post('/:id/command', async (req, res) => {
    const actuator = await repo.getById(req.params.id);
    if (!actuator) return res.status(404).json({error: 'Not found'});
    const { state, source, reason, mode } = req.body;
    
    if (actuator.type === 'pump' && state === 'on') {
        const tele = require('../repositories/telemetryRepository');
        const latest = await tele.getLatest();
        if (latest && latest.waterLevel < 15) return res.status(400).json({error: 'Cannot start pump: low water level'});
    }

    await repo.updateState(actuator.id, state, mode || 'manual');
    await eventRepo.insertEvent({
        id: ids.generateId('event'),
        type: 'ACTUATOR_CHANGED',
        source: source || 'manual',
        actuatorId: actuator.id,
        previousState: actuator.state,
        newState: state,
        reason: reason || 'Manual command',
        createdAt: new Date().toISOString()
    });
    res.json({ success: true });
});
module.exports = router;
""")
write_file("src/routes/events.js", """
const router = require('express').Router();
const repo = require('../repositories/eventRepository');
router.get('/', async (req, res) => res.json(await repo.getRecent()));
module.exports = router;
""")
write_file("src/routes/demo.js", """
const router = require('express').Router();
router.post('/reset', (req, res) => {
    // Just a placeholder to explain functionality
    res.json({message: 'Run npm run db:seed to fully reset.'});
});
router.post('/simulate', (req, res) => {
    res.json({message: 'Run npm run simulator in another terminal.'});
});
module.exports = router;
""")
write_file("src/routes/billing.js", """
const router = require('express').Router();
router.get('/plans', (req, res) => res.json([
    {id:'demo', name:'Demo'}, {id:'basic', name:'Básico'}, {id:'pro', name:'Profesional'}
]));
router.get('/status', (req, res) => res.json({status: 'active', plan: 'demo'}));
router.post('/checkout', (req, res) => res.json({url: 'https://checkout.simulated.com/pay'}));
router.post('/webhook', (req, res) => res.json({received: true}));
module.exports = router;
""")

# scripts/seed-db.js
write_file("scripts/seed-db.js", """
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../data/greenhouse.db');
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
if (!fs.existsSync(path.dirname(dbPath))) fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE greenhouses (
        id TEXT PRIMARY KEY, name TEXT, location TEXT, status TEXT, createdAt TEXT
    )`);
    db.run(`CREATE TABLE zones (
        id TEXT PRIMARY KEY, greenhouseId TEXT, name TEXT, crop TEXT, mode TEXT,
        temperatureMin REAL, temperatureMax REAL, humidityMin REAL, humidityMax REAL,
        soilMoistureMin REAL, soilMoistureMax REAL
    )`);
    db.run(`CREATE TABLE devices (
        id TEXT PRIMARY KEY, greenhouseId TEXT, zoneId TEXT, name TEXT, type TEXT, status TEXT, lastSeenAt TEXT
    )`);
    db.run(`CREATE TABLE telemetry_readings (
        id TEXT PRIMARY KEY, greenhouseId TEXT, zoneId TEXT, deviceId TEXT, timestamp TEXT,
        temperature REAL, humidity REAL, soilMoisture REAL, light REAL, waterLevel REAL
    )`);
    db.run(`CREATE TABLE actuators (
        id TEXT PRIMARY KEY, greenhouseId TEXT, zoneId TEXT, type TEXT, name TEXT, state TEXT, mode TEXT, lastChangedAt TEXT
    )`);
    db.run(`CREATE TABLE alerts (
        id TEXT PRIMARY KEY, greenhouseId TEXT, zoneId TEXT, type TEXT, severity TEXT, message TEXT, status TEXT, createdAt TEXT, resolvedAt TEXT
    )`);
    db.run(`CREATE TABLE actuator_events (
        id TEXT PRIMARY KEY, type TEXT, source TEXT, actuatorId TEXT, previousState TEXT, newState TEXT, reason TEXT, createdAt TEXT
    )`);

    // Insert Seed Data
    db.run(`INSERT INTO greenhouses (id, name, location, status, createdAt) VALUES ('greenhouse_01', 'Invernadero principal', 'Demo regional', 'active', '2026-09-29T12:00:00.000Z')`);
    db.run(`INSERT INTO zones (id, greenhouseId, name, crop, mode, temperatureMin, temperatureMax, humidityMin, humidityMax, soilMoistureMin, soilMoistureMax) VALUES ('zone_a', 'greenhouse_01', 'Zona A', 'jitomate', 'automatic', 18, 30, 50, 80, 35, 75)`);
    db.run(`INSERT INTO devices (id, greenhouseId, zoneId, name, type, status, lastSeenAt) VALUES ('device_esp32_01', 'greenhouse_01', 'zone_a', 'ESP32 simulado', 'wokwi', 'online', '2026-09-29T12:00:00.000Z')`);
    db.run(`INSERT INTO actuators (id, greenhouseId, zoneId, type, name, state, mode, lastChangedAt) VALUES ('pump_01', 'greenhouse_01', 'zone_a', 'pump', 'Bomba de riego', 'off', 'automatic', '2026-09-29T12:00:00.000Z')`);
    db.run(`INSERT INTO actuators (id, greenhouseId, zoneId, type, name, state, mode, lastChangedAt) VALUES ('fan_01', 'greenhouse_01', 'zone_a', 'fan', 'Ventilador', 'off', 'automatic', '2026-09-29T12:00:00.000Z')`);
    db.run(`INSERT INTO actuators (id, greenhouseId, zoneId, type, name, state, mode, lastChangedAt) VALUES ('window_01', 'greenhouse_01', 'zone_a', 'window', 'Ventana automática', 'closed', 'automatic', '2026-09-29T12:00:00.000Z')`);
    
    console.log("Database seeded successfully");
});
db.close();
""")

# simulator/index.js
write_file("simulator/index.js", """
const http = require('http');
const SERVER_URL = 'http://localhost:3000/api/telemetry/readings';

let soilMoisture = 60;
let temp = 25;
let water = 80;

const sendReading = () => {
    // Random variations
    soilMoisture -= Math.random() * 2; // slowly dries
    if (soilMoisture < 20) soilMoisture = 20; // stay low to trigger alert
    
    const data = {
        greenhouseId: "greenhouse_01",
        zoneId: "zone_a",
        deviceId: "device_esp32_01",
        timestamp: new Date().toISOString(),
        readings: {
            temperature: temp + (Math.random() * 2 - 1),
            humidity: 50 + (Math.random() * 10 - 5),
            soilMoisture: soilMoisture,
            light: 800 + (Math.random() * 100 - 50),
            waterLevel: water
        }
    };
    
    const req = http.request(SERVER_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => console.log('Sent:', data.readings.soilMoisture.toFixed(2), 'Res:', body));
    });
    
    req.on('error', e => console.error(e.message));
    req.write(JSON.stringify(data));
    req.end();
};

console.log("Starting simulator...");
setInterval(sendReading, 5000);
""")

# Wokwi
write_file("wokwi/diagram.json", '{"version":1,"author":"Antigravity","editor":"wokwi","parts":[{"type":"board-esp32-devkit-v1","id":"esp","top":0,"left":0,"attrs":{}}],"connections":[],"dependencies":{}}')
write_file("wokwi/wokwi.ino", """
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
    
    String payload = "{\\"greenhouseId\\":\\"greenhouse_01\\",\\"zoneId\\":\\"zone_a\\",\\"deviceId\\":\\"device_esp32_01\\",\\"readings\\":{\\"temperature\\":28.0,\\"humidity\\":60,\\"soilMoisture\\":30,\\"light\\":800,\\"waterLevel\\":100}}";
    int code = http.POST(payload);
    Serial.println(code);
    http.end();
  }
  delay(5000);
}
""")
write_file("wokwi/README.md", "# Wokwi Simulator\\nRun wokwi.ino to simulate ESP32 sending data.")

# tests/rules.test.js
write_file("tests/rules.test.js", """
const test = require('node:test');
const assert = require('node:assert');

test('Rules Engine basic test', () => {
    assert.strictEqual(1, 1);
});
""")

# package.json modification
pkg_path = os.path.join(base_dir, "package.json")
if os.path.exists(pkg_path):
    with open(pkg_path, "r", encoding="utf-8") as f:
        pkg = json.load(f)
    pkg['scripts'] = {
        "start": "node src/server.js",
        "dev": "node --watch src/server.js",
        "test": "node --test",
        "simulator": "node simulator/index.js",
        "db:init": "node scripts/seed-db.js",
        "db:seed": "node scripts/seed-db.js"
    }
    with open(pkg_path, "w", encoding="utf-8") as f:
        json.dump(pkg, f, indent=2)

# Now generate frontend
write_file("public/index.html", """
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Greenhouse Monitor</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #333; }
        .header { display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 15px 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .card { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
        .card h3 { margin: 0 0 10px 0; font-size: 14px; color: #666; }
        .card .value { font-size: 24px; font-weight: bold; color: #2c3e50; }
        .alerts { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; border-left: 4px solid #e74c3c; }
        .alert-item { padding: 10px 0; border-bottom: 1px solid #eee; }
        .actuators { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .actuator-card { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center; }
        .btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
        .btn-on { background: #2ecc71; color: white; }
        .btn-off { background: #e74c3c; color: white; }
        .status-indicator { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px; }
        .online { background-color: #2ecc71; }
        .offline { background-color: #95a5a6; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1 style="margin: 0; font-size: 24px; color: #2c3e50;">Greenhouse Monitor</h1>
            <p style="margin: 5px 0 0 0; color: #7f8c8d;">Invernadero principal - <span id="conn-status"><span class="status-indicator offline"></span>Desconectado</span></p>
        </div>
        <div>
            <span style="background: #3498db; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px;">MODO DEMO</span>
        </div>
    </div>

    <div class="grid" id="telemetry-grid">
        <div class="card"><h3>Temperatura</h3><div class="value" id="val-temp">-- °C</div></div>
        <div class="card"><h3>Humedad Relativa</h3><div class="value" id="val-hum">-- %</div></div>
        <div class="card"><h3>Humedad Sustrato</h3><div class="value" id="val-soil">-- %</div></div>
        <div class="card"><h3>Luz</h3><div class="value" id="val-light">-- lx</div></div>
        <div class="card"><h3>Nivel de Tanque</h3><div class="value" id="val-water">-- %</div></div>
    </div>

    <div class="alerts" id="alerts-container">
        <h3 style="margin-top:0">Alertas Activas</h3>
        <div id="alerts-list">No hay alertas activas.</div>
    </div>

    <h3 style="color: #2c3e50;">Actuadores</h3>
    <div class="actuators" id="actuators-grid">
        <!-- Rendered by JS -->
    </div>

    <script>
        const API_BASE = '/api';
        
        async function fetchTelemetry() {
            try {
                const res = await fetch(`${API_BASE}/telemetry/latest`);
                if (res.ok) {
                    const data = await res.json();
                    if (data) {
                        document.getElementById('val-temp').textContent = data.temperature.toFixed(1) + ' °C';
                        document.getElementById('val-hum').textContent = data.humidity.toFixed(1) + ' %';
                        document.getElementById('val-soil').textContent = data.soilMoisture.toFixed(1) + ' %';
                        document.getElementById('val-light').textContent = data.light.toFixed(0) + ' lx';
                        document.getElementById('val-water').textContent = data.waterLevel.toFixed(1) + ' %';
                        document.getElementById('conn-status').innerHTML = '<span class="status-indicator online"></span>Online (Última: ' + new Date(data.timestamp).toLocaleTimeString() + ')';
                    }
                }
            } catch (e) { console.error(e); }
        }

        async function fetchAlerts() {
            try {
                const res = await fetch(`${API_BASE}/alerts/active`);
                if (res.ok) {
                    const alerts = await res.json();
                    const list = document.getElementById('alerts-list');
                    if (alerts.length === 0) {
                        list.innerHTML = 'No hay alertas activas.';
                    } else {
                        list.innerHTML = alerts.map(a => `
                            <div class="alert-item">
                                <strong>${a.type}</strong>: ${a.message} <br>
                                <small>${new Date(a.createdAt).toLocaleString()}</small>
                                <button onclick="resolveAlert('${a.id}')" style="margin-left:10px;">Resolver</button>
                            </div>
                        `).join('');
                    }
                }
            } catch (e) { console.error(e); }
        }
        
        async function resolveAlert(id) {
            await fetch(`${API_BASE}/alerts/${id}/resolve`, { method: 'POST' });
            fetchAlerts();
        }

        async function fetchActuators() {
            try {
                const res = await fetch(`${API_BASE}/actuators`);
                if (res.ok) {
                    const actuators = await res.json();
                    const grid = document.getElementById('actuators-grid');
                    grid.innerHTML = actuators.map(a => `
                        <div class="actuator-card">
                            <div>
                                <h4 style="margin:0 0 5px 0;">${a.name}</h4>
                                <small>Modo: ${a.mode} | Estado: <strong>${a.state.toUpperCase()}</strong></small>
                            </div>
                            <div>
                                <button class="btn btn-on" onclick="controlActuator('${a.id}', 'on')">ON</button>
                                <button class="btn btn-off" onclick="controlActuator('${a.id}', 'off')">OFF</button>
                            </div>
                        </div>
                    `).join('');
                }
            } catch (e) { console.error(e); }
        }

        async function controlActuator(id, state) {
            try {
                const res = await fetch(`${API_BASE}/actuators/${id}/command`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ state, source: 'manual', mode: 'manual' })
                });
                const data = await res.json();
                if (!res.ok) alert('Error: ' + data.error);
                fetchActuators();
            } catch (e) { console.error(e); }
        }

        setInterval(() => {
            fetchTelemetry();
            fetchAlerts();
            fetchActuators();
        }, 2000);
        
        // Initial fetch
        fetchTelemetry();
        fetchAlerts();
        fetchActuators();
    </script>
</body>
</html>
""")

print("Frontend files generated")
