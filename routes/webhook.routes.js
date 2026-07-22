const { Router } = require('express');
const {
  mercadopagoWebhook,
} = require('../controllers/webhook.controller');

const router = Router();

router.post('/mercadopago', mercadopagoWebhook);

module.exports = router;
