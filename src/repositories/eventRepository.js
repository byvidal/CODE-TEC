const { query, run } = require('./db');
exports.insertEvent = async (e) => {
    await run(`INSERT INTO events (id, greenhouseId, zoneId, deviceId, type, source, entityId, previousState, newState, reason, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [e.id, e.greenhouseId, e.zoneId, e.deviceId, e.type, e.source, e.entityId, e.previousState, e.newState, e.reason, e.createdAt]);
};
exports.getRecent = (limit=50) => query("SELECT * FROM events ORDER BY createdAt DESC LIMIT ?", [limit]);
