const router = require('express').Router();
const repo = require('../repositories/eventRepository');
router.get('/', async (req, res) => res.json(await repo.getRecent()));
module.exports = router;
