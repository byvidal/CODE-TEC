const router = require('express').Router();
const db = require('../repositories/db');
const whatsappService = require('../services/whatsappService');

router.post('/reset', async (req, res, next) => {
    try {
        await db.resetDatabase();
        res.json({ message: 'Database reset to factory defaults' });
    } catch(err) { next(err); }
});

router.post('/whatsapp', async (req, res, next) => {
    try {
        await whatsappService.sendAlert(
            '+521234567890', 
            `*EDAFONEX ALERT* 📱\n_Prueba de Integración_\nEsta es una prueba de conectividad de WhatsApp solicitada desde el Panel de Configuración.`
        );
        res.json({ message: 'WhatsApp mock sent' });
    } catch(err) { next(err); }
});

module.exports = router;
