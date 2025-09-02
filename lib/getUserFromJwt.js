const Users = require('../db/models/User');
const jwt = require('jwt-simple');
const CustomError = require('../lib/CustomError');
const { HTTP_CODES } = require('../config/Enum');
const config = require('../config');

async function getUserFromJwt(authorization) {
    if (!authorization) {
        throw new CustomError(HTTP_CODES.UNAUTHORIZED, 'AUTH_HEADER_MISSING');
    }

    const token = authorization.startsWith('Bearer ')
        ? authorization.slice(7).trim()
        : authorization.trim();

    let decoded;
    try {
        decoded = jwt.decode(token, config.JWT.SECRET);
    } catch (e) {
        throw new CustomError(HTTP_CODES.UNAUTHORIZED, 'TOKEN_INVALID');
    }

    if (!decoded || !decoded.id) {
        throw new CustomError(HTTP_CODES.UNAUTHORIZED, 'TOKEN_PAYLOAD_INVALID');
    }

    const user = await Users.findById(decoded.id);
    return user;
}

// dışarıya export et
module.exports = {
    getUserFromJwt,
};
