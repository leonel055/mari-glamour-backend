const { MpCredencial } = require('../models');
const { cifrar, descifrar } = require('./crypto.service');

const AUTH_URL = 'https://auth.mercadopago.com.ar/authorization';
const TOKEN_URL = 'https://api.mercadopago.com/oauth/token';

function clientId() {
  return (process.env.MP_APP_ID || '').trim();
}

function clientSecret() {
  return (process.env.MP_SECRET_KEY || '').trim();
}

function redirectUri() {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  return `${backendUrl}/api/mp/oauth/callback`;
}

function buildAuthorizeUrl(state) {
  const clientIdValue = clientId();
  if (!clientIdValue) {
    throw new Error('MP_APP_ID no configurado');
  }
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientIdValue,
    redirect_uri: redirectUri(),
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

async function exchangeCode(code) {
  const clientIdValue = clientId();
  const clientSecretValue = clientSecret();
  if (!clientIdValue || !clientSecretValue) {
    throw new Error('MP_APP_ID o MP_SECRET_KEY no configurados');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientIdValue,
    client_secret: clientSecretValue,
    code,
    redirect_uri: redirectUri(),
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Error al canjear code de Mercado Pago: ${data?.error} ${data?.error_description || ''}`.trim());
  }
  return data;
}

async function refreshToken(refreshTokenValue) {
  const clientIdValue = clientId();
  const clientSecretValue = clientSecret();
  if (!clientIdValue || !clientSecretValue) {
    throw new Error('MP_APP_ID o MP_SECRET_KEY no configurados');
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientIdValue,
    client_secret: clientSecretValue,
    refresh_token: refreshTokenValue,
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Error al renovar token de Mercado Pago: ${data?.error} ${data?.error_description || ''}`.trim());
  }
  return data;
}

function expiresAtFrom(data) {
  const seconds = Number(data.expires_in || 3600);
  return new Date(Date.now() + (seconds - 300) * 1000);
}

async function guardarCredencial(usuarioId, data) {
  const credencial = await MpCredencial.findOne({ where: { usuarioId } });

  const values = {
    mpUserId: data.user_id,
    accessToken: cifrar(data.access_token),
    refreshToken: cifrar(data.refresh_token || data.access_token),
    tokenType: data.token_type || null,
    scope: data.scope || null,
    liveMode: !!data.live_mode,
    publicKey: data.public_key || null,
    expiresAt: expiresAtFrom(data),
  };

  if (credencial) {
    await credencial.update(values);
    return credencial;
  }
  return MpCredencial.create({ usuarioId, ...values });
}

async function obtenerCredencial(usuarioId) {
  const credencial = await MpCredencial.findOne({ where: { usuarioId } });
  if (!credencial) return null;

  const vencida = !credencial.expiresAt || new Date(credencial.expiresAt) <= new Date();
  if (!vencida) {
    return {
      accessToken: descifrar(credencial.accessToken),
      refreshToken: descifrar(credencial.refreshToken),
      mpUserId: credencial.mpUserId,
      liveMode: credencial.liveMode,
      publicKey: credencial.publicKey,
    };
  }

  try {
    const nuevo = await refreshToken(descifrar(credencial.refreshToken));
    await guardarCredencial(usuarioId, nuevo);
    return {
      accessToken: nuevo.access_token,
      refreshToken: nuevo.refresh_token || descifrar(credencial.refreshToken),
      mpUserId: nuevo.user_id || credencial.mpUserId,
      liveMode: !!nuevo.live_mode,
      publicKey: nuevo.public_key || credencial.publicKey,
    };
  } catch (error) {
    console.error('No se pudo renovar el token de Mercado Pago:', error.message);
    return {
      accessToken: descifrar(credencial.accessToken),
      refreshToken: descifrar(credencial.refreshToken),
      mpUserId: credencial.mpUserId,
      liveMode: credencial.liveMode,
      publicKey: credencial.publicKey,
    };
  }
}

async function obtenerCredencialActiva() {
  const credencial = await MpCredencial.findOne({ order: [['createdAt', 'ASC']] });
  if (!credencial) return null;
  return obtenerCredencial(credencial.usuarioId);
}

async function obtenerEstado(usuarioId) {
  const credencial = await MpCredencial.findOne({ where: { usuarioId } });
  if (!credencial) {
    return { conectado: false };
  }
  return {
    conectado: true,
    mpUserId: String(credencial.mpUserId),
    liveMode: credencial.liveMode,
    cuenta: descifrar(credencial.accessToken) ? true : false,
  };
}

async function probarCredenciales() {
  const clientIdValue = clientId();
  const clientSecretValue = clientSecret();
  if (!clientIdValue || !clientSecretValue) {
    return { ok: false, detalle: 'Faltan MP_APP_ID o MP_SECRET_KEY' };
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientIdValue,
    client_secret: clientSecretValue,
  });

  try {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const data = await res.json();
    if (res.ok && data.access_token) {
      return { ok: true };
    }
    return { ok: false, detalle: data?.error || `HTTP ${res.status}` };
  } catch (error) {
    return { ok: false, detalle: error.message };
  }
}

module.exports = {
  buildAuthorizeUrl,
  exchangeCode,
  obtenerCredencial,
  obtenerCredencialActiva,
  guardarCredencial,
  obtenerEstado,
  probarCredenciales,
};
