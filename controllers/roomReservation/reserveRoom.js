const Room = require('../../db/models/Room');
const { RoomReservation } = require('../../db/models/RoomReservation');
const User = require('../../db/models/User');
const Response = require('../../lib/Response');
const CustomError = require('../../lib/CustomError');
const { HTTP_CODES, EntryStatus, ReservationStatus } = require('../../config/Enum');
const mongoose = require('mongoose');
const { getUserFromJwt } = require('../../lib/getUserFromJwt');
const {gameManagement} = require('../../services/gameManagement');


const START_LEAD_SECONDS = 30; // 30 saniye
let scheduler;

function secondsUntil(dateLike) {
  if (!dateLike) return null;
  const diffMs = new Date(dateLike).getTime() - Date.now();
  return Math.max(0, Math.floor(diffMs / 1000));
}

exports.reserveRoom = async (req, res) => {
  const { room_id } = req.body || {};
  const { authorization } = req.headers;
  try {
    // --- Validasyon ---
    if (!room_id) throw new CustomError(HTTP_CODES.BAD_REQUEST, 'room_id required');
    if (!mongoose.isValidObjectId(room_id)) {
      throw new CustomError(HTTP_CODES.BAD_REQUEST, 'invalid ids');
    }

    const user = await getUserFromJwt(authorization);
    if (!user) throw new CustomError(HTTP_CODES.NOT_FOUND, 'USER_NOT_FOUND');
    if (user.is_active === false) throw new CustomError(HTTP_CODES.FORBIDDEN, 'USER_INACTIVE');

    // --- ÖNCE idempotent kontrol: Bu kullanıcı bu odada zaten RESERVED mı? ---
    const existing = await RoomReservation.findOne({
      user: user.id,
      room: room_id,
      status: ReservationStatus.RESERVED,
    }).lean();

    if (existing) {
      throw new CustomError(HTTP_CODES.CONFLICT, 'ALREADY_RESERVED');
    }

    // --- Kapasiteyi atomik artır (sadece WAITING) ---
    const room = await Room.findOneAndUpdate(
      {
        _id: room_id,
        room_status: EntryStatus.WAITING,
        $expr: { $lt: ['$active_reservation_count', '$max_users'] },
      },
      { $inc: { active_reservation_count: 1 } },
      { new: true }
    );

    if (!room) {
      // Buraya düşerse ya oda yok, ya WAITING değil, ya da FULL.
      const r = await Room.findById(room_id).lean();
      if (!r) throw new CustomError(HTTP_CODES.NOT_FOUND, 'ROOM_NOT_FOUND');
      if (r.room_status === EntryStatus.RUNNING) throw new CustomError(HTTP_CODES.CONFLICT, 'ROOM_ALREADY_RUNNING');
      if (r.room_status === EntryStatus.CLOSED) throw new CustomError(HTTP_CODES.CONFLICT, 'ROOM_CLOSED');

      // Bu noktada FULL olabilir; ama yine de bir yarış durumu için tekrar bak:
      const stillExisting = await RoomReservation.findOne({
        user: user.id,
        room: room_id,
        status: ReservationStatus.RESERVED,
      }).lean();
      if (stillExisting) {
        const roomNow = await Room.findById(room_id).lean();
        const payload = { room: roomNow, reservation: stillExisting, started_in: secondsUntil(roomNow?.starts_at) };
        const ok = Response.successResponse(payload, HTTP_CODES.OK);
        return res.status(ok.code).json(ok);
      }

      throw new CustomError(HTTP_CODES.CONFLICT, 'ROOM_FULL');
    }

    // --- Rezervasyon oluştur ---
    let reservationDoc;
    try {
      reservationDoc = await RoomReservation.create({
        user: user.id,
        room: room_id,
        status: ReservationStatus.RESERVED,
      });
    } catch (err) {
      // Sayaç geri al
      await Room.updateOne(
        { _id: room_id, active_reservation_count: { $gt: 0 } },
        { $inc: { active_reservation_count: -1 } }
      );

      // Duplicate key -> mevcut RESERVED kaydı döndür (çoklu istek yarışında)
      if (String(err?.message || '').includes('E11000')) {
        const dupe = await RoomReservation.findOne({
          user: user.id,
          room: room_id,
          status: ReservationStatus.RESERVED,
        }).lean();

        if (dupe) {
          const ok = Response.successResponse({
            success: true
          }, HTTP_CODES.OK);
          return res.status(ok.code).json(ok);
        }
      }
      throw err;
    }

    //---FULL olduysa başlangıcı planla (WAITING + starts_at)---//
    if (room.active_reservation_count === room.max_users) {
      // burada aktif kullanıcı sayısı belirli sayıya ulaştığında 
      // ilgili socket odası oluşturma kuralları tanımlanacaktır.
      room.room_status = EntryStatus.RUNNING;
      room.save();
      gameManagement(req.app, room_id);


      

    } else {
      console.log('waiting room');
    }
    console.log('reservation created');


    // --- Response ---
    const finalRoom = await Room.findById(room_id).lean();
    const payload = {
      room: finalRoom,
      reservation: reservationDoc.toObject(),
      started_in: secondsUntil(finalRoom?.starts_at),
    };
    const ok = Response.successResponse(payload, HTTP_CODES.CREATED);
    console.log(ok)
    return res.status(ok.code).json(ok);

  } catch (error) {
    const errRes = Response.errorResponse(error);
    return res.status(errRes.code || 500).json(errRes);
  }
};
