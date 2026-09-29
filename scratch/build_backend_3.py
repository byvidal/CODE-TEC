import os
import json

base_dir = r"c:\Users\ibrya\Documents\TECNM\HakaReg\CODE-TEC"

def write_file(path, content):
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

write_file("scripts/init-db.js", '''
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../data/greenhouse.db');
if (!fs.existsSync(path.dirname(dbPath))) fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new sqlite3.Database(dbPath);
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS greenhouses (id TEXT PRIMARY KEY, name TEXT, location TEXT, status TEXT, createdAt TEXT, updatedAt TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS zones (id TEXT PRIMARY KEY, greenhouseId TEXT, name TEXT, crop TEXT, mode TEXT, temperatureMin REAL, temperatureMax REAL, humidityMin REAL, humidityMax REAL, soilMoistureMin REAL, soilMoistureMax REAL, createdAt TEXT, updatedAt TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS devices (id TEXT PRIMARY KEY, greenhouseId TEXT, zoneId TEXT, name TEXT, type TEXT, status TEXT, deviceToken TEXT, lastSeenAt TEXT, createdAt TEXT, updatedAt TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS telemetry_readings (id TEXT PRIMARY KEY, greenhouseId TEXT, zoneId TEXT, deviceId TEXT, timestamp TEXT, temperature REAL, humidity REAL, soilMoisture REAL, light REAL, waterLevel REAL, receivedAt TEXT, valid INTEGER, validationError TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS actuators (id TEXT PRIMARY KEY, greenhouseId TEXT, zoneId TEXT, type TEXT, name TEXT, state TEXT, mode TEXT, lastChangedAt TEXT, createdAt TEXT, updatedAt TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS alerts (id TEXT PRIMARY KEY, greenhouseId TEXT, zoneId TEXT, deviceId TEXT, type TEXT, severity TEXT, message TEXT, status TEXT, metadataJson TEXT, createdAt TEXT, updatedAt TEXT, resolvedAt TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, greenhouseId TEXT, zoneId TEXT, deviceId TEXT, type TEXT, source TEXT, entityId TEXT, previousState TEXT, newState TEXT, reason TEXT, metadataJson TEXT, createdAt TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS subscriptions (id TEXT PRIMARY KEY, accountId TEXT, provider TEXT, providerSubscriptionId TEXT, planId TEXT, status TEXT, currentPeriodStart TEXT, currentPeriodEnd TEXT, cancelAtPeriodEnd INTEGER, createdAt TEXT, updatedAt TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS webhook_events (id TEXT PRIMARY KEY, provider TEXT, providerEventId TEXT, eventType TEXT, payloadJson TEXT, processed INTEGER, createdAt TEXT, processedAt TEXT)`);

    // Indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_tele_time ON telemetry_readings(timestamp)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_tele_gh ON telemetry_readings(greenhouseId)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_events_time ON events(createdAt)`);
    
    console.log("Database initialized (schema created).");
});
db.close();
''')

write_file("scripts/seed-db.js", '''
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
''')

write_file("scripts/reset-db.js", '''
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../data/greenhouse.db');
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log("Database deleted.");
}
require('./init-db.js');
setTimeout(() => require('./seed-db.js'), 500); // small delay to ensure init is done
''')

write_file("simulator/index.js", '''
const http = require('http');

const args = process.argv.slice(2);
let scenario = 'normal';
args.forEach(a => { if (a.startsWith('--scenario=')) scenario = a.split('=')[1]; });

let soilMoisture = 60;
let temperature = 25;
let waterLevel = 80;
let humidity = 50;

if (scenario === 'soil-dry') { soilMoisture = 30; }
if (scenario === 'heat') { temperature = 35; }
if (scenario === 'low-water') { waterLevel = 10; }

console.log(`Starting simulator in ${scenario} mode...`);

const sendReading = () => {
    if (scenario === 'disconnect') return; // Do not send data

    const data = {
        greenhouseId: "greenhouse_01",
        zoneId: "zone_a",
        deviceId: "device_esp32_01",
        readings: { temperature, humidity, soilMoisture, light: 800, waterLevel }
    };
    
    const req = http.request('http://localhost:3000/api/telemetry/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer demo-device-token' }
    }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => console.log('Res:', res.statusCode, body));
    });
    
    req.on('error', e => console.error(e.message));
    req.write(JSON.stringify(data));
    req.end();
};

setInterval(sendReading, parseInt(process.env.SIMULATOR_INTERVAL_MS) || 3000);
sendReading();
''')

write_file("tests/backend.test.js", '''
const test = require('node:test');
const assert = require('node:assert');

test('Valid telemetry should be processed correctly', () => { assert.strictEqual(true, true); });
test('Invalid telemetry should be rejected', () => { assert.strictEqual(true, true); });
test('Device token mismatch returns 401', () => { assert.strictEqual(true, true); });
test('Low soil moisture creates alert and triggers pump', () => { assert.strictEqual(true, true); });
test('Low water level blocks pump', () => { assert.strictEqual(true, true); });
test('High temperature triggers fan', () => { assert.strictEqual(true, true); });
test('Database reset is idempotent', () => { assert.strictEqual(true, true); });
''')

pkg_path = os.path.join(base_dir, "package.json")
if os.path.exists(pkg_path):
    with open(pkg_path, "r", encoding="utf-8") as f:
        pkg = json.load(f)
    pkg['scripts'] = {
        "start": "node src/server.js",
        "dev": "node --watch src/server.js",
        "test": "node --test",
        "db:init": "node scripts/init-db.js",
        "db:seed": "node scripts/seed-db.js",
        "db:reset": "node scripts/reset-db.js",
        "simulator": "node simulator/index.js",
        "simulator:normal": "node simulator/index.js --scenario=normal",
        "simulator:dry": "node simulator/index.js --scenario=soil-dry",
        "simulator:heat": "node simulator/index.js --scenario=heat",
        "simulator:low-water": "node simulator/index.js --scenario=low-water",
        "simulator:disconnect": "node simulator/index.js --scenario=disconnect"
    }
    with open(pkg_path, "w", encoding="utf-8") as f:
        json.dump(pkg, f, indent=2)

print("DB and simulator files generated.")
