const { query, run } = require('./db');
exports.getByGreenhouseId = (ghId) => query("SELECT * FROM zones WHERE greenhouseId = ?", [ghId]);
exports.getById = (id) => query("SELECT * FROM zones WHERE id = ?", [id]).then(r => r[0]);
