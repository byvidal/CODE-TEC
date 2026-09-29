const { query, run } = require('./db');
exports.insertReading = async (r) => {
    await run(`INSERT INTO telemetry_readings 
        (id, greenhouseId, zoneId, deviceId, timestamp, temperature, humidity, soilMoisture, light, waterLevel, receivedAt, valid) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [r.id, r.greenhouseId, r.zoneId, r.deviceId, r.timestamp, r.temperature, r.humidity, r.soilMoisture, r.light, r.waterLevel, r.receivedAt, r.valid ? 1 : 0]
    );
};
exports.getLatest = (ghId) => query("SELECT * FROM telemetry_readings " + (ghId ? "WHERE greenhouseId=?" : "") + " ORDER BY timestamp DESC LIMIT 1", ghId ? [ghId] : []).then(r => r[0]);
exports.getHistory = (zoneId, limit=100) => {
    let sql = "SELECT * FROM telemetry_readings ";
    let params = [];
    if(zoneId){ sql += "WHERE zoneId=? "; params.push(zoneId); }
    sql += "ORDER BY timestamp DESC LIMIT ?";
    params.push(limit);
    return query(sql, params);
};
