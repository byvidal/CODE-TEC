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
