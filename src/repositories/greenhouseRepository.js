const { query, run } = require('./db');
exports.getAll = () => query("SELECT * FROM greenhouses");
exports.getById = (id) => query("SELECT * FROM greenhouses WHERE id = ?", [id]).then(r => r[0]);
