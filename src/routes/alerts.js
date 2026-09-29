const router = require('express').Router();
const repo = require('../repositories/alertRepository');
router.get('/active', async (req, res) => res.json(await repo.getActive()));
router.post('/:id/resolve', async (req, res) => {
    await repo.resolveAlert(req.params.id);
    res.json({ success: true });
});
module.exports = router;
