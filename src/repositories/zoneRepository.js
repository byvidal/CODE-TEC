const { query, run } = require('./db');

exports.getByGreenhouseId = (ghId) => query("SELECT * FROM zones WHERE greenhouseId = ?", [ghId]);
exports.getById = (id) => query("SELECT * FROM zones WHERE id = ?", [id]).then(r => r[0]);

exports.insertZone = async (z) => {
    await run(`INSERT INTO zones (id, greenhouseId, name, crop, mode, temperatureMin, temperatureMax, humidityMin, humidityMax, soilMoistureMin, soilMoistureMax, createdAt) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [z.id, z.greenhouseId, z.name, z.crop, z.mode, z.temperatureMin, z.temperatureMax, z.humidityMin, z.humidityMax, z.soilMoistureMin, z.soilMoistureMax, z.createdAt]);
};
