const router = require('express').Router();
const repo = require('../repositories/actuatorRepository');
const eventRepo = require('../repositories/eventRepository');
const ids = require('../utils/ids');
router.get('/', async (req, res) => res.json(await repo.getAll()));
router.get('/status', async (req, res) => res.json(await repo.getAll()));
router.post('/:id/command', async (req, res) => {
    const actuator = await repo.getById(req.params.id);
    if (!actuator) return res.status(404).json({error: 'Not found'});
    const { state, source, reason, mode } = req.body;
    
    if (actuator.type === 'pump' && state === 'on') {
        const tele = require('../repositories/telemetryRepository');
        const latest = await tele.getLatest();
        if (latest && latest.waterLevel < 15) return res.status(400).json({error: 'Cannot start pump: low water level'});
    }

    await repo.updateState(actuator.id, state, mode || 'manual');
    await eventRepo.insertEvent({
        id: ids.generateId('event'),
        type: 'ACTUATOR_CHANGED',
        source: source || 'manual',
        actuatorId: actuator.id,
        previousState: actuator.state,
        newState: state,
        reason: reason || 'Manual command',
        createdAt: new Date().toISOString()
    });
    res.json({ success: true });
});
module.exports = router;
