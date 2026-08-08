const { Router } = require('express');
const autenticar = require('../middlewares/autenticar');
const {
  authorize,
  callback,
  estado,
} = require('../controllers/mp-oauth.controller');

const router = Router();

router.get('/authorize', autenticar, authorize);
router.get('/callback', callback);
router.get('/estado', autenticar, estado);

module.exports = router;
