const router = require('express').Router();
const gRepo = require('../repositories/greenhouseRepository');
const zRepo = require('../repositories/zoneRepository');
const ids = require('../utils/ids');
const dates = require('../utils/dates');

router.get('/', async (req, res, next) => {
    try { res.json(await gRepo.getAll()); } catch(e) { next(e); }
});
router.get('/:id', async (req, res, next) => {
    try { res.json(await gRepo.getById(req.params.id)); } catch(e) { next(e); }
});
router.get('/:id/zones', async (req, res, next) => {
    try { res.json(await zRepo.getByGreenhouseId(req.params.id)); } catch(e) { next(e); }
});
router.post('/:id/zones', async (req, res, next) => {
    try {
        const { name, crop, temperatureMin, temperatureMax, soilMoistureMin, soilMoistureMax } = req.body;
        const newZone = {
            id: ids.generateId('zone'),
            greenhouseId: req.params.id,
            name: name || 'Nueva Zona',
            crop: crop || 'Sin definir',
            mode: 'automatic',
            temperatureMin: temperatureMin || 10,
            temperatureMax: temperatureMax || 35,
            humidityMin: 30,
            humidityMax: 80,
            soilMoistureMin: soilMoistureMin || 30,
            soilMoistureMax: soilMoistureMax || 80,
            createdAt: dates.now()
        };
        await zRepo.insertZone(newZone);
        res.status(201).json(newZone);
    } catch(e) { next(e); }
});

module.exports = router;
