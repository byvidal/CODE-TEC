const { query, run } = require('./db');
exports.insertAlert = async (a) => {
    await run(`INSERT INTO alerts (id, greenhouseId, zoneId, deviceId, type, severity, message, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [a.id, a.greenhouseId, a.zoneId, a.deviceId, a.type, a.severity, a.message, a.status, a.createdAt]);
};
exports.getActive = () => query("SELECT * FROM alerts WHERE status = 'active' ORDER BY createdAt DESC");
exports.getActiveByTypeAndZone = (type, zoneId) => query("SELECT * FROM alerts WHERE status = 'active' AND type = ? AND zoneId = ?", [type, zoneId]).then(r => r[0]);
exports.resolveAlert = async (id, resolvedAt) => {
    await run(`UPDATE alerts SET status = 'resolved', resolvedAt = ? WHERE id = ?`, [resolvedAt, id]);
};
