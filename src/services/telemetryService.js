const AppError = require('../utils/errors');
const telemetryRepo = require('../repositories/telemetryRepository');
const greenhouseRepo = require('../repositories/greenhouseRepository');
const zoneRepo = require('../repositories/zoneRepository');
const deviceRepo = require('../repositories/deviceRepository');
const eventRepo = require('../repositories/eventRepository');
const ruleEngine = require('./ruleEngineService');
const ids = require('../utils/ids');
const dates = require('../utils/dates');

exports.processReading = async (payload, device) => {
    const { greenhouseId, zoneId, deviceId, readings } = payload;
    let { timestamp } = payload;
    if (!timestamp) timestamp = dates.now();
    const receivedAt = dates.now();
    
    if (device.greenhouseId !== greenhouseId || device.zoneId !== zoneId) {
        throw new AppError("El dispositivo no pertenece a la zona indicada", "DEVICE_SCOPE_MISMATCH", 403);
    }
    
    const zone = await zoneRepo.getById(zoneId);
    if (!zone) throw new AppError("Zone not found", "NOT_FOUND", 404);
    
    const { temperature, humidity, soilMoisture, light, waterLevel } = readings;
    if (temperature < -20 || temperature > 80) throw new AppError("Temperatura fuera de rango", "INVALID_TELEMETRY", 400);
    if (humidity < 0 || humidity > 100) throw new AppError("Humedad fuera de rango", "INVALID_TELEMETRY", 400);
    if (soilMoisture < 0 || soilMoisture > 100) throw new AppError("Humedad del sustrato fuera de rango", "INVALID_TELEMETRY", 400);
    if (light < 0 || light > 200000) throw new AppError("Luz fuera de rango", "INVALID_TELEMETRY", 400);
    if (waterLevel < 0 || waterLevel > 100) throw new AppError("Nivel de agua fuera de rango", "INVALID_TELEMETRY", 400);

    const reading = {
        id: ids.generateId('reading'),
        greenhouseId, zoneId, deviceId, timestamp,
        temperature, humidity, soilMoisture, light, waterLevel,
        receivedAt, valid: true
    };
    
    await telemetryRepo.insertReading(reading);
    await deviceRepo.updateLastSeen(deviceId, receivedAt);
    
    await eventRepo.insertEvent({
        id: ids.generateId('evt'), greenhouseId, zoneId, deviceId,
        type: 'TELEMETRY_RECEIVED', source: 'device', entityId: reading.id,
        previousState: null, newState: null, reason: 'OK', createdAt: receivedAt
    });
    
    const rulesResult = await ruleEngine.evaluate(zone, reading, deviceId);
    
    return {
        accepted: true,
        reading: { id: reading.id, timestamp: reading.timestamp },
        device: { id: deviceId, status: 'online', lastSeenAt: receivedAt },
        alerts: rulesResult.alerts.map(a => a.id),
        actions: rulesResult.actions,
        events: []
    };
};
