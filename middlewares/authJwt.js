// /middlewares/authJwt.js
const { verifyJwtToken } = require('../utils/auth');

module.exports = function authJwt() {
  return (req, res, next) => {
    try {
      const header = req.headers.authorization || req.headers.Authorization;
      const token = header || req.query.token || req.body?.token;
      const { userId } = verifyJwtToken(token);
      req.userId = userId;
      next();
    } catch {
      res.status(401).json({ code: 401, message: 'Unauthorized' });
    }
  };
};
