const jwt = require('jsonwebtoken');
const config = require('../config');

exports.verifyJwtToken= (maybeToken) => {
  if (!maybeToken) throw new Error('no token');
  const parts = String(maybeToken).split(' ');
  const raw = parts.length === 2 && /^Bearer$/i.test(parts[0]) ? parts[1] : maybeToken;

  const decoded = jwt.verify(raw, config.JWT.SECRET); // exp dahil otomatik kontrol
  return { userId: decoded.id };
}
