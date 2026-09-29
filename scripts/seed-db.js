const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.resolve(__dirname, '../data/greenhouse.db'));

const now = new Date().toISOString();

db.serialize(() => {
    db.run(`INSERT OR IGNORE INTO greenhouses (id, name, location, status, createdAt) VALUES ('greenhouse_01', 'Invernadero Demo', 'Regional', 'active', ?)`, [now]);
    db.run(`INSERT OR IGNORE INTO zones (id, greenhouseId, name, crop, mode, temperatureMin, temperatureMax, humidityMin, humidityMax, soilMoistureMin, soilMoistureMax, createdAt) VALUES ('zone_a', 'greenhouse_01', 'Zona A', 'jitomate', 'automatic', 18, 30, 40, 80, 35, 75, ?)`, [now]);
    db.run(`INSERT OR IGNORE INTO devices (id, greenhouseId, zoneId, name, type, status, deviceToken, createdAt) VALUES ('device_esp32_01', 'greenhouse_01', 'zone_a', 'ESP32 simulado', 'wokwi', 'offline', 'demo-device-token', ?)`, [now]);
    db.run(`INSERT OR IGNORE INTO actuators (id, greenhouseId, zoneId, type, name, state, mode, createdAt) VALUES ('pump_01', 'greenhouse_01', 'zone_a', 'pump', 'Bomba', 'off', 'automatic', ?)`, [now]);
    db.run(`INSERT OR IGNORE INTO actuators (id, greenhouseId, zoneId, type, name, state, mode, createdAt) VALUES ('fan_01', 'greenhouse_01', 'zone_a', 'fan', 'Ventilador', 'off', 'automatic', ?)`, [now]);

    console.log("Database seeded successfully with demo data.");
});
db.close();
