const alertRepo = require('../repositories/alertRepository');
const actuatorRepo = require('../repositories/actuatorRepository');
const eventRepo = require('../repositories/eventRepository');
const whatsappService = require('./whatsappService');
const telegramService = require('./telegramService');
const ids = require('../utils/ids');
const dates = require('../utils/dates');

exports.evaluate = async (zone, reading, deviceId) => {
    const alerts = [];
    const actions = [];
    const { soilMoisture, temperature, waterLevel, humidity } = reading;
    const now = dates.now();
    
    const actuators = await actuatorRepo.getAll();
    const pump = actuators.find(a => a.type === 'pump' && a.zoneId === zone.id);
    const fan = actuators.find(a => a.type === 'fan' && a.zoneId === zone.id);

    // Rule: Low Water Level
    const minWater = zone.waterLevelMin !== undefined ? zone.waterLevelMin : 15;
    let isWaterLow = waterLevel < minWater;
    if (isWaterLow) {
        const al = await createAlert(zone.greenhouseId, zone.id, deviceId, 'LOW_WATER_TANK', 'critical', 'Nivel de tanque muy bajo.');
        if (al) alerts.push(al);
        if (pump && pump.state === 'on') {
            await changeActuator(pump, 'off', 'automatic-rule', 'Tanque bajo, bomba bloqueada', now, zone, deviceId);
            actions.push({ actuatorId: pump.id, state: 'off', reason: 'Tanque bajo' });
        }
    } else {
        await resolveAlert('LOW_WATER_TANK', zone.id, now);
    }

    // Rule: Low soil moisture
    if (soilMoisture < zone.soilMoistureMin) {
        const al = await createAlert(zone.greenhouseId, zone.id, deviceId, 'LOW_SOIL_MOISTURE', 'critical', 'La humedad del sustrato está baja.');
        if (al) alerts.push(al);
        if (pump && pump.state === 'off' && pump.mode === 'automatic' && !isWaterLow) {
            await changeActuator(pump, 'on', 'automatic-rule', 'Humedad de sustrato baja', now, zone, deviceId);
            actions.push({ actuatorId: pump.id, state: 'on', reason: 'Humedad de sustrato baja' });
        }
    }

    // Rule: Soil moisture recovered
    if (soilMoisture >= zone.soilMoistureMax) {
        await resolveAlert('LOW_SOIL_MOISTURE', zone.id, now);
        if (pump && pump.state === 'on' && pump.mode === 'automatic') {
            await changeActuator(pump, 'off', 'automatic-rule', 'Humedad de sustrato recuperada', now, zone, deviceId);
            actions.push({ actuatorId: pump.id, state: 'off', reason: 'Humedad recuperada' });
        }
    }

    // Rule: High temperature
    if (temperature > zone.temperatureMax) {
        const al = await createAlert(zone.greenhouseId, zone.id, deviceId, 'HIGH_TEMPERATURE', 'warning', 'Temperatura por encima del límite.');
        if (al) alerts.push(al);
        if (fan && fan.state === 'off' && fan.mode === 'automatic') {
            await changeActuator(fan, 'on', 'automatic-rule', 'Temperatura alta', now, zone, deviceId);
            actions.push({ actuatorId: fan.id, state: 'on', reason: 'Temperatura alta' });
        }
    }

    // Rule: Temperature normalized
    if (temperature <= zone.temperatureMax) {
        await resolveAlert('HIGH_TEMPERATURE', zone.id, now);
        if (fan && fan.state === 'on' && fan.mode === 'automatic') {
            await changeActuator(fan, 'off', 'automatic-rule', 'Temperatura normalizada', now, zone, deviceId);
            actions.push({ actuatorId: fan.id, state: 'off', reason: 'Temperatura normal' });
        }
    }

    return { alerts, actions };
};

async function createAlert(greenhouseId, zoneId, deviceId, type, severity, message) {
    const existing = await alertRepo.getActiveByTypeAndZone(type, zoneId);
    if (existing) return null; // already active

    const alert = {
        id: ids.generateId('alert'),
        greenhouseId, zoneId, deviceId, type, severity, message,
        status: 'active', createdAt: dates.now()
    };
    await alertRepo.insertAlert(alert);
    
    await eventRepo.insertEvent({
        id: ids.generateId('evt'), greenhouseId, zoneId, deviceId,
        type: 'ALERT_CREATED', source: 'system', entityId: alert.id,
        previousState: null, newState: 'active', reason: message, createdAt: dates.now()
    });

    // Enviar alerta por WhatsApp y Telegram
    const alertMessage = `⚠️ *Alerta de Sistema EDAFONEX*\nInvernadero: ${greenhouseId}\nCondición detectada: ${message}\nPor favor, verifique el panel de control.`;
    
    whatsappService.sendAlert('+521234567890', alertMessage).catch(console.error);
    telegramService.sendAlert(alertMessage).catch(console.error);
    
    return alert;
}

async function resolveAlert(type, zoneId, resolvedAt) {
    const active = await alertRepo.getActiveByTypeAndZone(type, zoneId);
    if (active) {
        await alertRepo.resolveAlert(active.id, resolvedAt);
        await eventRepo.insertEvent({
            id: ids.generateId('evt'), greenhouseId: active.greenhouseId, zoneId: active.zoneId, deviceId: active.deviceId,
            type: 'ALERT_RESOLVED', source: 'system', entityId: active.id,
            previousState: 'active', newState: 'resolved', reason: 'Condición recuperada', createdAt: resolvedAt
        });
    }
}

async function changeActuator(actuator, newState, source, reason, timestamp, zone, deviceId) {
    await actuatorRepo.updateState(actuator.id, newState, actuator.mode, timestamp);
    await eventRepo.insertEvent({
        id: ids.generateId('evt'),
        greenhouseId: zone.greenhouseId,
        zoneId: zone.id,
        deviceId: deviceId,
        type: source === 'manual' ? 'MANUAL_COMMAND' : 'AUTOMATIC_ACTION',
        source,
        entityId: actuator.id,
        previousState: actuator.state,
        newState,
        reason,
        createdAt: timestamp
    });
}
