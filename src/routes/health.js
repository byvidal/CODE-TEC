const router = require('express').Router();
router.get('/', (req, res) => res.json({status: 'ok'}));
router.get('/details', (req, res) => res.json({
    status: 'ok',
    time: new Date().toISOString(),
    demoMode: process.env.DEMO_MODE === 'true',
    version: '1.0.0'
}));
module.exports = router;
