const router = require('express').Router();
const repo = require('../repositories/greenhouseRepository');
router.get('/', async (req, res) => res.json(await repo.getAll()));
router.get('/:id', async (req, res) => res.json(await repo.getById(req.params.id)));
router.get('/:id/zones', async (req, res) => res.json(await repo.getZones(req.params.id)));
module.exports = router;
