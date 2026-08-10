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
  const { code, state, error, error_description } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

  const redirigir = (params) => {
    const sep = frontendUrl.includes('?') ? '&' : '?';
    return res.redirect(`${frontendUrl}/admin/agenda${sep}${params}`);
  };

  const redirigirError = (msg) => {
    const detalle = msg ? `:${encodeURIComponent(String(msg).slice(0, 300))}` : '';
    return redirigir(`mp=error${detalle}`);
  };

  try {
    if (error) {
      const mpMsg = error_description ? `${error}: ${error_description}` : error;
      return redirigirError(mpMsg);
    }
    if (!code || !state) {
      return redirigirError('Falta code o state');
    }

    const decoded = jwt.verify(state, process.env.JWT_SECRET);
    if (!decoded?.usuarioId) {
      return redirigirError('State invalido');
    }

    const data = await mpOauthService.exchangeCode(code);
    await mpOauthService.guardarCredencial(decoded.usuarioId, data);

    return redirigir('mp=conectado');
  } catch (err) {
    console.error('Error en callback OAuth Mercado Pago:', err.message);
    return redirigirError(err.message);
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

const diagnostico = async (req, res) => {
  const backendUrl = process.env.BACKEND_URL || '';
  const frontendUrl = process.env.FRONTEND_URL || '';
  const credenciales = await mpOauthService.probarCredenciales();
  res.json({
    mpAppIdConfigurado: !!process.env.MP_APP_ID,
    mpSecretConfigurado: !!process.env.MP_SECRET_KEY,
    tokenEncryptConfigurado: !!process.env.MP_TOKEN_ENCRYPT_KEY,
    accessTokenFallbackConfigurado: !!process.env.MP_ACCESS_TOKEN,
    credencialesValidas: credenciales.ok,
    detalleCredenciales: credenciales.detalle,
    backendUrl,
    frontendUrl,
    redirectUri: backendUrl ? `${backendUrl}/api/mp/oauth/callback` : null,
  });
};

module.exports = {
  authorize,
  callback,
  estado,
  diagnostico,
};
