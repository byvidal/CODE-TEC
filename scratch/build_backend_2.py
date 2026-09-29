import os
import json

base_dir = r"c:\Users\ibrya\Documents\TECNM\HakaReg\CODE-TEC"

def write_file(path, content):
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

write_file("src/utils/ids.js", "exports.generateId = (prefix) => `${prefix}_${Math.random().toString(36).substr(2, 9)}`;")
write_file("src/utils/dates.js", "exports.now = () => new Date().toISOString();")

# Middlewares
write_file("src/middleware/authentication.js", '''
const AppError = require('../utils/errors');
const deviceRepo = require('../repositories/deviceRepository');

exports.authenticateDevice = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || req.headers['x-device-token'];
        if (!authHeader) throw new AppError("Falta token de dispositivo", "UNAUTHORIZED_DEVICE", 401);
        
        const token = authHeader.replace('Bearer ', '');
        const { deviceId } = req.body;
        
        if (!deviceId) throw new AppError("Falta deviceId", "VALIDATION_ERROR", 400);
        
        const device = await deviceRepo.getById(deviceId);
        if (!device) throw new AppError("Dispositivo no encontrado", "UNAUTHORIZED_DEVICE", 401);
        
        if (device.deviceToken !== token && process.env.TELEMETRY_DEVICE_TOKEN !== token) {
            throw new AppError("Token inválido", "UNAUTHORIZED_DEVICE", 401);
        }
        
        req.device = device;
        next();
    } catch (err) {
        next(err);
    }
};
''')

write_file("src/middleware/rateLimit.js", '''
const AppError = require('../utils/errors');
const requestCounts = {};
setInterval(() => { for(let k in requestCounts) delete requestCounts[k]; }, 60000);

exports.telemetryRateLimit = (req, res, next) => {
    const limit = parseInt(process.env.TELEMETRY_RATE_LIMIT_PER_MINUTE) || 120;
    const ip = req.ip;
    requestCounts[ip] = (requestCounts[ip] || 0) + 1;
    if (requestCounts[ip] > limit) {
        return next(new AppError("Too many requests", "RATE_LIMIT_EXCEEDED", 429));
    }
    next();
};
''')

# Repositories
write_file("src/repositories/deviceRepository.js", '''
const { query, run } = require('./db');
exports.getById = (id) => query("SELECT * FROM devices WHERE id = ?", [id]).then(r => r[0]);
exports.getAll = () => query("SELECT * FROM devices");
exports.updateLastSeen = (id, time) => run("UPDATE devices SET status = 'online', lastSeenAt = ? WHERE id = ?", [time, id]);
exports.setOffline = (id) => run("UPDATE devices SET status = 'offline' WHERE id = ?", [id]);
''')

write_file("src/repositories/greenhouseRepository.js", '''
const { query, run } = require('./db');
exports.getAll = () => query("SELECT * FROM greenhouses");
exports.getById = (id) => query("SELECT * FROM greenhouses WHERE id = ?", [id]).then(r => r[0]);
''')

write_file("src/repositories/zoneRepository.js", '''
const { query, run } = require('./db');
exports.getByGreenhouseId = (ghId) => query("SELECT * FROM zones WHERE greenhouseId = ?", [ghId]);
exports.getById = (id) => query("SELECT * FROM zones WHERE id = ?", [id]).then(r => r[0]);
''')

write_file("src/repositories/telemetryRepository.js", '''
const { query, run } = require('./db');
exports.insertReading = async (r) => {
    await run(`INSERT INTO telemetry_readings 
        (id, greenhouseId, zoneId, deviceId, timestamp, temperature, humidity, soilMoisture, light, waterLevel, receivedAt, valid) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [r.id, r.greenhouseId, r.zoneId, r.deviceId, r.timestamp, r.temperature, r.humidity, r.soilMoisture, r.light, r.waterLevel, r.receivedAt, r.valid ? 1 : 0]
    );
};
exports.getLatest = (ghId) => query("SELECT * FROM telemetry_readings " + (ghId ? "WHERE greenhouseId=?" : "") + " ORDER BY timestamp DESC LIMIT 1", ghId ? [ghId] : []).then(r => r[0]);
exports.getHistory = (zoneId, limit=100) => {
    let sql = "SELECT * FROM telemetry_readings ";
    let params = [];
    if(zoneId){ sql += "WHERE zoneId=? "; params.push(zoneId); }
    sql += "ORDER BY timestamp DESC LIMIT ?";
    params.push(limit);
    return query(sql, params);
};
''')

write_file("src/repositories/alertRepository.js", '''
const { query, run } = require('./db');
exports.insertAlert = async (a) => {
    await run(`INSERT INTO alerts (id, greenhouseId, zoneId, deviceId, type, severity, message, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [a.id, a.greenhouseId, a.zoneId, a.deviceId, a.type, a.severity, a.message, a.status, a.createdAt]);
};
exports.getActive = () => query("SELECT * FROM alerts WHERE status = 'active' ORDER BY createdAt DESC");
exports.getActiveByTypeAndZone = (type, zoneId) => query("SELECT * FROM alerts WHERE status = 'active' AND type = ? AND zoneId = ?", [type, zoneId]).then(r => r[0]);
exports.resolveAlert = async (id, resolvedAt) => {
    await run(`UPDATE alerts SET status = 'resolved', resolvedAt = ? WHERE id = ?`, [resolvedAt, id]);
};
''')

write_file("src/repositories/actuatorRepository.js", '''
const { query, run } = require('./db');
exports.getAll = () => query("SELECT * FROM actuators");
exports.getById = (id) => query("SELECT * FROM actuators WHERE id = ?", [id]).then(r => r[0]);
exports.updateState = async (id, state, mode, lastChangedAt) => {
    await run("UPDATE actuators SET state = ?, mode = ?, lastChangedAt = ? WHERE id = ?", [state, mode, lastChangedAt, id]);
};
''')

write_file("src/repositories/eventRepository.js", '''
const { query, run } = require('./db');
exports.insertEvent = async (e) => {
    await run(`INSERT INTO events (id, greenhouseId, zoneId, deviceId, type, source, entityId, previousState, newState, reason, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [e.id, e.greenhouseId, e.zoneId, e.deviceId, e.type, e.source, e.entityId, e.previousState, e.newState, e.reason, e.createdAt]);
};
exports.getRecent = (limit=50) => query("SELECT * FROM events ORDER BY createdAt DESC LIMIT ?", [limit]);
''')

# Services
write_file("src/services/ruleEngineService.js", '''
const alertRepo = require('../repositories/alertRepository');
const actuatorRepo = require('../repositories/actuatorRepository');
const eventRepo = require('../repositories/eventRepository');
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
    let isWaterLow = waterLevel < 15;
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
''')

write_file("src/services/telemetryService.js", '''
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
''')

write_file("src/routes/telemetry.js", '''
const router = require('express').Router();
const telemetryService = require('../services/telemetryService');
const { authenticateDevice } = require('../middleware/authentication');
const { telemetryRateLimit } = require('../middleware/rateLimit');
const repo = require('../repositories/telemetryRepository');

router.post('/readings', telemetryRateLimit, authenticateDevice, async (req, res, next) => {
    try {
        const result = await telemetryService.processReading(req.body, req.device);
        res.json(result);
    } catch (err) {
        next(err);
    }
});
router.get('/latest', async (req, res, next) => {
    try {
        res.json(await repo.getLatest(req.query.greenhouseId));
    } catch(err) { next(err); }
});
router.get('/history', async (req, res, next) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
        res.json(await repo.getHistory(req.query.zoneId, limit));
    } catch(err) { next(err); }
});
module.exports = router;
''')

write_file("src/routes/health.js", '''
const router = require('express').Router();
router.get('/', (req, res) => res.json({status: 'ok'}));
router.get('/details', (req, res) => res.json({
    status: 'ok',
    time: new Date().toISOString(),
    demoMode: process.env.DEMO_MODE === 'true',
    version: '1.0.0'
}));
module.exports = router;
''')

write_file("src/routes/actuators.js", '''
const router = require('express').Router();
const repo = require('../repositories/actuatorRepository');
const eventRepo = require('../repositories/eventRepository');
const teleRepo = require('../repositories/telemetryRepository');
const ids = require('../utils/ids');
const dates = require('../utils/dates');
const AppError = require('../utils/errors');

router.get('/', async (req, res, next) => {
    try { res.json(await repo.getAll()); } catch(e) { next(e); }
});
router.get('/status', async (req, res, next) => {
    try { res.json(await repo.getAll()); } catch(e) { next(e); }
});
router.get('/:id', async (req, res, next) => {
    try { res.json(await repo.getById(req.params.id)); } catch(e) { next(e); }
});
router.post('/:id/command', async (req, res, next) => {
    try {
        const actuator = await repo.getById(req.params.id);
        if (!actuator) throw new AppError("Actuador no encontrado", "NOT_FOUND", 404);
        
        const { state, source, reason, mode } = req.body;
        if (!['on', 'off', 'open', 'closed'].includes(state)) throw new AppError("Estado inválido", "VALIDATION_ERROR", 400);

        if (actuator.type === 'pump' && state === 'on') {
            const latest = await teleRepo.getLatest();
            if (latest && latest.waterLevel < 15) {
                await eventRepo.insertEvent({
                    id: ids.generateId('evt'), greenhouseId: actuator.greenhouseId, zoneId: actuator.zoneId, deviceId: null,
                    type: 'ACTUATOR_COMMAND_REJECTED', source: source || 'manual', entityId: actuator.id,
                    previousState: actuator.state, newState: state, reason: 'Tanque bajo', createdAt: dates.now()
                });
                throw new AppError("No se puede activar la bomba: nivel de tanque bajo", "LOW_WATER_TANK", 400);
            }
        }

        const now = dates.now();
        await repo.updateState(actuator.id, state, mode || 'manual', now);
        await eventRepo.insertEvent({
            id: ids.generateId('evt'), greenhouseId: actuator.greenhouseId, zoneId: actuator.zoneId, deviceId: null,
            type: 'MANUAL_COMMAND', source: source || 'manual', entityId: actuator.id,
            previousState: actuator.state, newState: state, reason: reason || 'Manual command', createdAt: now
        });
        res.json({ success: true, actuatorId: actuator.id, state });
    } catch(e) { next(e); }
});
module.exports = router;
''')

write_file("src/routes/alerts.js", '''
const router = require('express').Router();
const repo = require('../repositories/alertRepository');
const eventRepo = require('../repositories/eventRepository');
const ids = require('../utils/ids');
const dates = require('../utils/dates');

router.get('/', async (req, res, next) => {
    try { res.json(await repo.getActive()); } catch(e) { next(e); }
});
router.get('/active', async (req, res, next) => {
    try { res.json(await repo.getActive()); } catch(e) { next(e); }
});
router.post('/:id/resolve', async (req, res, next) => {
    try {
        const now = dates.now();
        await repo.resolveAlert(req.params.id, now);
        res.json({ success: true });
    } catch(e) { next(e); }
});
module.exports = router;
''')

write_file("src/routes/events.js", '''
const router = require('express').Router();
const repo = require('../repositories/eventRepository');
router.get('/', async (req, res, next) => {
    try { res.json(await repo.getRecent()); } catch(e) { next(e); }
});
router.get('/recent', async (req, res, next) => {
    try { res.json(await repo.getRecent()); } catch(e) { next(e); }
});
module.exports = router;
''')

write_file("src/routes/greenhouses.js", '''
const router = require('express').Router();
const gRepo = require('../repositories/greenhouseRepository');
const zRepo = require('../repositories/zoneRepository');

router.get('/', async (req, res, next) => {
    try { res.json(await gRepo.getAll()); } catch(e) { next(e); }
});
router.get('/:id', async (req, res, next) => {
    try { res.json(await gRepo.getById(req.params.id)); } catch(e) { next(e); }
});
router.get('/:id/zones', async (req, res, next) => {
    try { res.json(await zRepo.getByGreenhouseId(req.params.id)); } catch(e) { next(e); }
});
module.exports = router;
''')

write_file("src/routes/devices.js", '''
const router = require('express').Router();
const repo = require('../repositories/deviceRepository');
router.get('/', async (req, res, next) => {
    try { res.json(await repo.getAll()); } catch(e) { next(e); }
});
module.exports = router;
''')

write_file("src/routes/dashboard.js", '''
const router = require('express').Router();
const teleRepo = require('../repositories/telemetryRepository');
const alertRepo = require('../repositories/alertRepository');
const deviceRepo = require('../repositories/deviceRepository');
const actuatorRepo = require('../repositories/actuatorRepository');
const eventRepo = require('../repositories/eventRepository');

router.get('/summary', async (req, res, next) => {
    try {
        const latest = await teleRepo.getLatest();
        const activeAlerts = await alertRepo.getActive();
        const devices = await deviceRepo.getAll();
        const actuators = await actuatorRepo.getAll();
        const events = await eventRepo.getRecent(10);
        
        res.json({
            status: activeAlerts.length > 0 ? (activeAlerts.some(a=>a.severity==='critical') ? 'critical' : 'warning') : 'normal',
            latestTelemetry: latest ? [latest] : [],
            activeAlerts,
            devices: {
                total: devices.length,
                online: devices.filter(d=>d.status==='online').length,
                offline: devices.filter(d=>d.status==='offline').length
            },
            actuators: {
                total: actuators.length,
                on: actuators.filter(a=>a.state==='on').length
            },
            recentEvents: events
        });
    } catch(e) { next(e); }
});
module.exports = router;
''')

write_file("src/routes/demo.js", '''
const router = require('express').Router();
router.post('/reset', (req, res) => res.json({message: 'Run npm run db:reset'}));
router.post('/scenario', (req, res) => res.json({message: 'Use simulator scripts'}));
router.get('/status', (req, res) => res.json({demo: true}));
module.exports = router;
''')

write_file("src/routes/billing.js", '''
const router = require('express').Router();
router.get('/plans', (req, res) => res.json([{id:'demo', name:'Demo'}]));
router.get('/status', (req, res) => res.json({status: 'active', planId: 'demo'}));
router.post('/checkout', (req, res) => res.json({url: 'https://checkout.mock'}));
router.post('/webhook', (req, res) => res.json({received: true}));
router.post('/cancel', (req, res) => res.json({success: true}));
module.exports = router;
''')

print("Backend files generated")
