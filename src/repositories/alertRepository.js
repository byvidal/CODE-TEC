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
