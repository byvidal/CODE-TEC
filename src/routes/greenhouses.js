const router = require('express').Router();
const gRepo = require('../repositories/greenhouseRepository');
const zRepo = require('../repositories/zoneRepository');

router.get('/', async (req, res, next) => {
    try { res.json(await gRepo.getAll()); } catch(e) { next(e); }
});
router.get('/:id', async (req, res, next) => {
    try { res.json(await gRepo.getById(req.params.id)); } catch(e) { next(e); }
});
router.get('/:id/zones', async (req, res, next) => {
    try { res.json(await zRepo.getByGreenhouseId(req.params.id)); } catch(e) { next(e); }
});
module.exports = router;
