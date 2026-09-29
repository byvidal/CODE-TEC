const router = require('express').Router();
const repo = require('../repositories/deviceRepository');
router.get('/', async (req, res, next) => {
    try { res.json(await repo.getAll()); } catch(e) { next(e); }
});
module.exports = router;
