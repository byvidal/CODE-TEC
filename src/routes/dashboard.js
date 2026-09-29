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
