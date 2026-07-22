const { Router } = require('express');
const {
  createPreference,
  confirmarPago,
  obtenerPedido,
  listarPedidos,
} = require('../controllers/pago.controller');
const autenticar = require('../middlewares/autenticar');

const router = Router();

router.post('/create-preference', createPreference);
router.post('/confirm', confirmarPago);
router.get('/pedidos/:id', obtenerPedido);
router.get('/pedidos', autenticar, listarPedidos);

module.exports = router;
