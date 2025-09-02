const Room = require('../../db/models/Room');
const Users = require('../../db/models/User');
const { RoomReservation } = require('../../db/models/RoomReservation');
const jwt = require('jwt-simple');
const Response = require('../../lib/Response');
const CustomError = require('../../lib/CustomError');
const { HTTP_CODES, EntryStatus, ReservationStatus } = require('../../config/Enum');
const mongoose = require('mongoose');
const config = require('../../config');

exports.joinRoom = async (req, res) => {
  const { room_id } = req.body || {};
  const { authorization } = req.headers;

  try {
    // --- Validasyon ---
    if (!room_id) throw new CustomError(HTTP_CODES.BAD_REQUEST, 'room_id required');
    if (!mongoose.isValidObjectId(room_id)) {
      throw new CustomError(HTTP_CODES.BAD_REQUEST, 'invalid ids');
    }

    // --- JWT'den kullanıcıyı bul ---
    if (!authorization) {
      throw new CustomError(HTTP_CODES.UNAUTHORIZED, 'AUTH_HEADER_MISSING');
    }

    const token = authorization.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : authorization.trim();

    let decoded;
    try {
      decoded = jwt.decode(token, config.JWT.SECRET); // exp kontrolü gerekiyorsa ekleyebilirsin
    } catch (e) {
      throw new CustomError(HTTP_CODES.UNAUTHORIZED, 'TOKEN_INVALID');
    }

    if (!decoded || !decoded.id) {
      throw new CustomError(HTTP_CODES.UNAUTHORIZED, 'TOKEN_PAYLOAD_INVALID');
    }

    const user = await Users.findById(decoded.id).lean();
    if (!user) throw new CustomError(HTTP_CODES.NOT_FOUND, 'USER_NOT_FOUND');
    if (user.is_active === false) throw new CustomError(HTTP_CODES.FORBIDDEN, 'USER_INACTIVE');

    // --- Odayı çek (UNUTULAN KISIM) ---
    const room = await Room.findById(room_id).lean();
    if (!room) throw new CustomError(HTTP_CODES.NOT_FOUND, 'ROOM_NOT_FOUND');

    if (room.room_status !== EntryStatus.RUNNING) {
      throw new CustomError(HTTP_CODES.CONFLICT, 'ROOM_NOT_RUNNING');
    }

    // --- Odaya giriş uygun mu? ---
    const isOkEntry = room.room_status === EntryStatus.WAITING;

    return res
      .status(HTTP_CODES.OK)
      .json(Response.successResponse({ success: isOkEntry }, HTTP_CODES.OK));
  } catch (error) {
    const errRes = Response.errorResponse(error);
    return res.status(errRes.code || 500).json(errRes);
  }
};
