const jwt = require('jsonwebtoken');

const autenticar = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = header.startsWith('Bearer ')
    ? header.slice(7)
    : header;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalido o expirado' });
  }
};

module.exports = autenticar;
