const { query, run } = require('./db');
exports.getAll = () => query("SELECT * FROM actuators");
exports.getById = (id) => query("SELECT * FROM actuators WHERE id = ?", [id]).then(r => r[0]);
exports.updateState = async (id, state, mode, lastChangedAt) => {
    await run("UPDATE actuators SET state = ?, mode = ?, lastChangedAt = ? WHERE id = ?", [state, mode, lastChangedAt, id]);
};
