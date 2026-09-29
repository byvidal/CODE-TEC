const { query, run } = require('./db');
exports.insertEvent = async (event) => {
    await run(`INSERT INTO actuator_events (id, type, source, actuatorId, previousState, newState, reason, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [event.id, event.type, event.source, event.actuatorId, event.previousState, event.newState, event.reason, event.createdAt]);
};
exports.getRecent = () => query("SELECT * FROM actuator_events ORDER BY createdAt DESC LIMIT 50");
