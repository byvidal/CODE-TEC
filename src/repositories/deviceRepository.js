const { query, run } = require('./db');
exports.getById = (id) => query("SELECT * FROM devices WHERE id = ?", [id]).then(r => r[0]);
exports.updateLastSeen = (id) => run("UPDATE devices SET status = 'online', lastSeenAt = ? WHERE id = ?", [new Date().toISOString(), id]);
exports.setOffline = (id) => run("UPDATE devices SET status = 'offline' WHERE id = ?", [id]);
exports.getAll = () => query("SELECT * FROM devices");
