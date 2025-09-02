const jwt = require('jsonwebtoken');
const config = require('../config');
const CustomError = require('../lib/CustomError');

exports.verifyJwtToken= (maybeToken) => {
  if (!maybeToken) throw new CustomError('no token');
  const parts = String(maybeToken).split(' ');
  const raw = parts.length === 2 && /^Bearer$/i.test(parts[0]) ? parts[1] : maybeToken;

  const decoded = jwt.verify(raw, config.JWT.SECRET); // exp dahil otomatik kontrol
  return { userId: decoded.id };
}
