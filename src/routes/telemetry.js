const express = require('express');
const router = express.Router();
const telemetryService = require('../services/telemetryService');
const telemetryRepo = require('../repositories/telemetryRepository');

router.post('/readings', async (req, res, next) => {
    try {
        const result = await telemetryService.processReading(req.body);
        res.json(result);
    } catch (err) {
        res.status(400).json({ accepted: false, error: err.message });
    }
});

router.get('/latest', async (req, res) => {
    res.json(await telemetryRepo.getLatest());
});

router.get('/history', async (req, res) => {
    res.json(await telemetryRepo.getHistory());
});

module.exports = router;
