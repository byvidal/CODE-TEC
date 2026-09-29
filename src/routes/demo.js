const router = require('express').Router();
router.post('/reset', (req, res) => res.json({message: 'Run npm run db:reset'}));
router.post('/scenario', (req, res) => res.json({message: 'Use simulator scripts'}));
router.get('/status', (req, res) => res.json({demo: true}));
module.exports = router;
