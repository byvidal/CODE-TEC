const router = require('express').Router();
router.get('/plans', (req, res) => res.json([
    {id:'demo', name:'Demo'}, {id:'basic', name:'Básico'}, {id:'pro', name:'Profesional'}
]));
router.get('/status', (req, res) => res.json({status: 'active', plan: 'demo'}));
router.post('/checkout', (req, res) => res.json({url: 'https://checkout.simulated.com/pay'}));
router.post('/webhook', (req, res) => res.json({received: true}));
module.exports = router;
