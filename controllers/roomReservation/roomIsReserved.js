const Room = require('../../db/models/Room');
const { RoomReservation } = require('../../db/models/RoomReservation');
const User = require('../../db/models/User');
const Response = require('../../lib/Response');
const CustomError = require('../../lib/CustomError');
const { HTTP_CODES, EntryStatus, ReservationStatus } = require('../../config/Enum');
const mongoose = require('mongoose');


exports.roomIsReserved = async (req, res) => {
    const {user_id, room_id} = req.body || {};
  try {
    // --- Validasyon ---
    if (!user_id || !room_id) throw new CustomError(HTTP_CODES.BAD_REQUEST, 'user_id and room_id required');
    if (!mongoose.isValidObjectId(user_id) || !mongoose.isValidObjectId(room_id)) {
      throw new CustomError(HTTP_CODES.BAD_REQUEST, 'invalid ids');
    }

    const user = await User.findById(user_id).lean();
    if (!user) throw new CustomError(HTTP_CODES.NOT_FOUND, 'USER_NOT_FOUND');
    if (user.is_active === false) throw new CustomError(HTTP_CODES.FORBIDDEN, 'USER_INACTIVE');

    // --- idempotent kontrol: Bu kullanıcı bu odada zaten RESERVED mı? ---
    const existing = await RoomReservation.findOne({
      user: user_id,
      room: room_id,
      status: ReservationStatus.RESERVED,
    }).lean();

    let reserved ;
    if (existing) {
      reserved = true;
    } else {
        reserved = false;
    }

    let room = await Room.findById(room_id).lean();
    room.reserved = reserved;

    res.status(HTTP_CODES.OK).json(Response.successResponse({ room_state: room }, HTTP_CODES.OK));
  
}
    catch (error) {
        const errRes = Response.errorResponse(error);
        return res.status(errRes.code || 500).json(errRes);
    }
}

