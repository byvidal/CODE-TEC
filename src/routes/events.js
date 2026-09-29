const router = require('express').Router();
const repo = require('../repositories/eventRepository');
router.get('/', async (req, res, next) => {
    try { res.json(await repo.getRecent()); } catch(e) { next(e); }
});
router.get('/recent', async (req, res, next) => {
    try { res.json(await repo.getRecent()); } catch(e) { next(e); }
});
module.exports = router;
