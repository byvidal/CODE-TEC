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
