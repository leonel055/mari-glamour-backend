const jwt = require('jsonwebtoken');
const mpOauthService = require('../services/mp-oauth.service');

const authorize = async (req, res) => {
  try {
    const state = jwt.sign(
      { usuarioId: req.usuario.id },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );
    const url = mpOauthService.buildAuthorizeUrl(state);
    res.json({ url });
  } catch (error) {
    console.error('Error generando URL de autorizacion:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const callback = async (req, res) => {
  const { code, state, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

  const redirigir = (params) => {
    const sep = frontendUrl.includes('?') ? '&' : '?';
    return res.redirect(`${frontendUrl}/admin/agenda${sep}${params}`);
  };

  try {
    if (error) {
      return redirigir('mp=error');
    }
    if (!code || !state) {
      return redirigir('mp=error');
    }

    const decoded = jwt.verify(state, process.env.JWT_SECRET);
    if (!decoded?.usuarioId) {
      return redirigir('mp=error');
    }

    const data = await mpOauthService.exchangeCode(code);
    await mpOauthService.guardarCredencial(decoded.usuarioId, data);

    return redirigir('mp=conectado');
  } catch (err) {
    console.error('Error en callback OAuth Mercado Pago:', err.message);
    return redirigir('mp=error');
  }
};

const estado = async (req, res) => {
  try {
    const estadoInfo = await mpOauthService.obtenerEstado(req.usuario.id);
    res.json(estadoInfo);
  } catch (error) {
    console.error('Error consultando estado Mercado Pago:', error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  authorize,
  callback,
  estado,
};
