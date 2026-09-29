const router = require('express').Router();
router.post('/reset', (req, res) => {
    // Just a placeholder to explain functionality
    res.json({message: 'Run npm run db:seed to fully reset.'});
});
router.post('/simulate', (req, res) => {
    res.json({message: 'Run npm run simulator in another terminal.'});
});
module.exports = router;
