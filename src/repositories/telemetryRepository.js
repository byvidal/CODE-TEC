const { query, run } = require('./db');
exports.insertReading = async (r) => {
    // Si no vienen co2 o ph, simulamos una pequeña fluctuación natural para la demo.
    const co2 = r.co2 !== undefined ? r.co2 : (400 + Math.random() * 50);
    const ph = r.ph !== undefined ? r.ph : (6.5 + Math.random() * 1.0);
    const light = r.light !== undefined ? r.light : (800 + Math.random() * 200);

    await run(`INSERT INTO telemetry_readings 
        (id, greenhouseId, zoneId, deviceId, timestamp, temperature, humidity, soilMoisture, light, waterLevel, co2, ph, receivedAt, valid) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [r.id, r.greenhouseId, r.zoneId, r.deviceId, r.timestamp, r.temperature, r.humidity, r.soilMoisture, light, r.waterLevel, co2, ph, r.receivedAt, r.valid ? 1 : 0]
    );
};
exports.getLatest = (ghId) => query("SELECT * FROM telemetry_readings " + (ghId ? "WHERE greenhouseId=?" : "") + " ORDER BY timestamp DESC LIMIT 1", ghId ? [ghId] : []).then(r => r[0]);

exports.getHistory = (zoneId, limit=100, startDate=null, endDate=null) => {
    let sql = "SELECT * FROM telemetry_readings WHERE 1=1 ";
    let params = [];
    if(zoneId){ sql += "AND zoneId=? "; params.push(zoneId); }
    if(startDate){ sql += "AND timestamp >= ? "; params.push(startDate + "T00:00:00.000Z"); }
    if(endDate){ sql += "AND timestamp <= ? "; params.push(endDate + "T23:59:59.999Z"); }
    sql += "ORDER BY timestamp DESC LIMIT ?";
    params.push(limit);
    return query(sql, params);
};
