const router = require('express').Router();
const repo = require('../repositories/alertRepository');
const eventRepo = require('../repositories/eventRepository');
const ids = require('../utils/ids');
const dates = require('../utils/dates');

router.get('/', async (req, res, next) => {
    try { res.json(await repo.getActive()); } catch(e) { next(e); }
});
router.get('/active', async (req, res, next) => {
    try { res.json(await repo.getActive()); } catch(e) { next(e); }
});
router.post('/:id/resolve', async (req, res, next) => {
    try {
        const now = dates.now();
        await repo.resolveAlert(req.params.id, now);
        res.json({ success: true });
    } catch(e) { next(e); }
});
router.post('/test-telegram', async (req, res, next) => {
    try {
        const telegramService = require('../services/telegramService');
        // Se ejecuta en segundo plano (fire-and-forget) para que el frontend no espere
        telegramService.sendAlert(
            process.env.TELEGRAM_CHAT_ID, 
            "🤖 *EDAFONEX TEST*\nEste es un mensaje de prueba manual desde tu Dashboard. ¡La integración funciona a la perfección! 🚀"
        ).catch(console.error);
        res.json({ success: true });
    } catch(e) { next(e); }
});
module.exports = router;
