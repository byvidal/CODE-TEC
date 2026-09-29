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
