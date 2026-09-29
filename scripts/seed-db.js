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
