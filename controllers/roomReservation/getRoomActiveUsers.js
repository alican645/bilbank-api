const mongoose = require('mongoose');
const { RoomReservation } = require('../../db/models/RoomReservation');
const User = require('../../db/models/User');
const Response = require('../../lib/Response');
const Enum = require('../../config/Enum'); // HTTP_CODES burada
const { ReservationStatus } = require('../../config/Enum'); 
// ReservationStatus = { RESERVED: 0, CANCELLED: 1, FINISHED: 2 }

exports.getRoomActiveReservations = async (req, res) => {
  try {
    const { room_id } = req.query;

    // Geçersiz ObjectId kontrolü
    if (!mongoose.Types.ObjectId.isValid(room_id)) {
      return res
        .status(Enum.HTTP_CODES.BAD_REQUEST)
        .json(Response.errorResponse(new Error('Invalid room_id'), Enum.HTTP_CODES.BAD_REQUEST));
    }

    // Odaya ait aktif (RESERVED) rezervasyonlar
    const reservations = await RoomReservation.find({
      room: room_id,
      status: ReservationStatus.RESERVED,
    }).lean();

    // Boş sonuç
    if (reservations.length === 0) {
      return res
        .status(Enum.HTTP_CODES.OK)
        .json(Response.successResponse([], Enum.HTTP_CODES.OK));
    }

    // İlgili kullanıcıları tek seferde çek
    const userIds = [...new Set(reservations.map(r => r.user.toString()))];
    const users = await User.find({ _id: { $in: userIds } })
      .select('username email')
      .lean();

    // Kullanıcı bilgilerini rezervasyonlara iliştir
    const data = reservations.map(r => {
      const user = users.find(u => u._id.toString() === r.user.toString());
      return { ...r, user: user || null };
    });

    return res
      .status(Enum.HTTP_CODES.OK)
      .json(Response.successResponse(data, Enum.HTTP_CODES.OK));
  } catch (err) {
    console.error(err);
    return res
      .status(Enum.HTTP_CODES.INT_SERVER_ERROR)
      .json(Response.errorResponse(err, Enum.HTTP_CODES.INT_SERVER_ERROR));
  }
};
