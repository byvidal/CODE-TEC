const telemetryRepo = require('../repositories/telemetryRepository');
const greenhouseRepo = require('../repositories/greenhouseRepository');
const deviceRepo = require('../repositories/deviceRepository');
const ruleEngine = require('./ruleEngineService');
const ids = require('../utils/ids');

exports.processReading = async (data) => {
    const { greenhouseId, zoneId, deviceId, timestamp, readings } = data;
    
    // Validations
    if (!readings || typeof readings.temperature !== 'number') throw new Error("Invalid readings");
    const device = await deviceRepo.getById(deviceId);
    if (!device) throw new Error("Device not found");
    if (device.zoneId !== zoneId) throw new Error("Device does not belong to this zone");
    
    const zone = await greenhouseRepo.getZoneById(zoneId);
    if (!zone) throw new Error("Zone not found");

    // Persist
    const reading = {
        id: ids.generateId('reading'),
        greenhouseId,
        zoneId,
        deviceId,
        timestamp: timestamp || new Date().toISOString(),
        temperature: readings.temperature,
        humidity: readings.humidity,
        soilMoisture: readings.soilMoisture,
        light: readings.light,
        waterLevel: readings.waterLevel
    };
    
    await telemetryRepo.insertReading(reading);
    await deviceRepo.updateLastSeen(deviceId);
    
    // Execute rules
    const result = await ruleEngine.evaluate(zone, reading);
    
    return {
        accepted: true,
        readingId: reading.id,
        alerts: result.alerts,
        actions: result.actions,
        deviceStatus: 'online'
    };
};
