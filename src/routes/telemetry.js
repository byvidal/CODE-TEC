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
