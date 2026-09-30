const router = require('express').Router();
const eventRepo = require('../repositories/eventRepository');
const telegramService = require('../services/telegramService');

router.get('/', async (req, res, next) => {
    try { res.json(await eventRepo.getAllAlerts()); } catch(e) { next(e); }
});

router.post('/test-telegram', async (req, res, next) => {
    try {
        await telegramService.sendAlert(
            process.env.TELEGRAM_CHAT_ID, 
            "🤖 *HakaReg:* Este es un mensaje de prueba de notificaciones. ¡La conexión está lista!"
        );
        res.json({ success: true, message: 'Alerta de Telegram enviada.' });
    } catch(e) { next(e); }
});

module.exports = router;
