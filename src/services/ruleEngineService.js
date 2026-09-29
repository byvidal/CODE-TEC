const alertRepo = require('../repositories/alertRepository');
const actuatorRepo = require('../repositories/actuatorRepository');
const eventRepo = require('../repositories/eventRepository');
const ids = require('../utils/ids');

exports.evaluate = async (zone, reading) => {
    const alerts = [];
    const actions = [];
    const { soilMoisture, temperature, waterLevel } = reading;
    
    // Fetch actuators for zone
    const actuators = await actuatorRepo.getAll();
    const pump = actuators.find(a => a.type === 'pump' && a.zoneId === zone.id);
    const fan = actuators.find(a => a.type === 'fan' && a.zoneId === zone.id);

    // Rule: Low Water Level
    let isWaterLow = waterLevel < 15;
    if (isWaterLow) {
        await createAlert(zone, 'LOW_WATER_LEVEL', 'critical', 'Nivel de tanque muy bajo.');
        alerts.push('LOW_WATER_LEVEL');
        if (pump && pump.state === 'on') {
            await changeActuator(pump, 'off', 'automatic', 'Tanque vacío, protección activada');
            actions.push({ actuatorId: pump.id, state: 'off', reason: 'Tanque vacío' });
        }
    } else {
        await alertRepo.resolveAlertByType('LOW_WATER_LEVEL', zone.id);
    }

    // Rule: Low soil moisture
    if (soilMoisture < zone.soilMoistureMin) {
        await createAlert(zone, 'LOW_SOIL_MOISTURE', 'critical', 'La humedad del sustrato está baja.');
        alerts.push('LOW_SOIL_MOISTURE');
        if (pump && pump.state === 'off' && pump.mode === 'automatic' && !isWaterLow) {
            await changeActuator(pump, 'on', 'automatic', 'Humedad de sustrato baja');
            actions.push({ actuatorId: pump.id, state: 'on', reason: 'Humedad de sustrato baja' });
        }
    }

    // Rule: Soil moisture recovered
    if (soilMoisture >= zone.soilMoistureMax) {
        await alertRepo.resolveAlertByType('LOW_SOIL_MOISTURE', zone.id);
        if (pump && pump.state === 'on' && pump.mode === 'automatic') {
            await changeActuator(pump, 'off', 'automatic', 'Humedad de sustrato recuperada');
            actions.push({ actuatorId: pump.id, state: 'off', reason: 'Humedad recuperada' });
        }
    }

    // Rule: High temperature
    if (temperature > zone.temperatureMax) {
        await createAlert(zone, 'HIGH_TEMPERATURE', 'warning', 'Temperatura por encima del límite.');
        alerts.push('HIGH_TEMPERATURE');
        if (fan && fan.state === 'off' && fan.mode === 'automatic') {
            await changeActuator(fan, 'on', 'automatic', 'Temperatura alta');
            actions.push({ actuatorId: fan.id, state: 'on', reason: 'Temperatura alta' });
        }
    }

    // Rule: Temperature normalized
    if (temperature <= (zone.temperatureMax - 2)) {
        await alertRepo.resolveAlertByType('HIGH_TEMPERATURE', zone.id);
        if (fan && fan.state === 'on' && fan.mode === 'automatic') {
            await changeActuator(fan, 'off', 'automatic', 'Temperatura normalizada');
            actions.push({ actuatorId: fan.id, state: 'off', reason: 'Temperatura normal' });
        }
    }

    return { alerts, actions };
};

async function createAlert(zone, type, severity, message) {
    const activeAlerts = await alertRepo.getActive();
    if (activeAlerts.find(a => a.type === type && a.zoneId === zone.id)) return; // already active

    const alert = {
        id: ids.generateId('alert'),
        greenhouseId: zone.greenhouseId,
        zoneId: zone.id,
        type,
        severity,
        message,
        status: 'active',
        createdAt: new Date().toISOString()
    };
    await alertRepo.insertAlert(alert);
}

async function changeActuator(actuator, newState, source, reason) {
    await actuatorRepo.updateState(actuator.id, newState, actuator.mode);
    await eventRepo.insertEvent({
        id: ids.generateId('event'),
        type: 'ACTUATOR_CHANGED',
        source,
        actuatorId: actuator.id,
        previousState: actuator.state,
        newState,
        reason,
        createdAt: new Date().toISOString()
    });
}
