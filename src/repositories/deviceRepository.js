const { query, run } = require('./db');
exports.getById = (id) => query("SELECT * FROM devices WHERE id = ?", [id]).then(r => r[0]);
exports.getAll = () => query("SELECT * FROM devices");
exports.updateLastSeen = (id, time) => run("UPDATE devices SET status = 'online', lastSeenAt = ? WHERE id = ?", [time, id]);
exports.setOffline = (id) => run("UPDATE devices SET status = 'offline' WHERE id = ?", [id]);
