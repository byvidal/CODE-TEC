const router = require('express').Router();
router.get('/plans', (req, res) => res.json([{id:'demo', name:'Demo'}]));
router.get('/status', (req, res) => res.json({status: 'active', planId: 'demo'}));
router.post('/checkout', (req, res) => res.json({url: 'https://checkout.mock'}));
router.post('/webhook', (req, res) => res.json({received: true}));
router.post('/cancel', (req, res) => res.json({success: true}));
module.exports = router;
