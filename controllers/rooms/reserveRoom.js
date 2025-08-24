// controllers/rooms/reserveRoom.js
const mongoose = require('mongoose');
const Room = require('../../db/models/Room'); // senin path'ine göre düzenle
const { RoomReservation } = require('../../db/models/RoomReservation'); // path'i ayarla
const User = require('../../db/models/User'); // path'i ayarla
const Response = require('../../lib/Response'); // varsa kullan, yoksa kendi res.json yaz
const CustomError = require('../../lib/CustomError')
const {HTTP_CODES} = require('../../config/Enum')
const console = require('console');

/**
 * Body:
 *  - room_id: string (zorunlu)
 *  - scheduled_at: string/Date (opsiyonel)
 *
 * Auth:
 *  - req.user._id (Auth middleware set ediyorsa)
 */
exports.reserveRoom = async (req, res) => {
  const { room_id, scheduled_at,user_id } = req.body || {};
  
  console.log(user_id);
  console.log(room_id);




  // 1) Auth kontrolü
  if (!user_id) {
    throw new CustomError(
      HTTP_CODES.BAD_REQUEST ,
      'user_id is required',
      'Please provide a valid user_id.'
    );
  }

  // 2) Param kontrolü
  if (!room_id) {
    throw new CustomError(
      HTTP_CODES.BAD_REQUEST ,
      'room_id is required',
      'Please provide a valid room_id.'
    );
  }

  // 3) Tarih doğrulama (opsiyonel)
  let scheduledDate = undefined;
  if (scheduled_at) {
    const d = new Date(scheduled_at);
    if (isNaN(d.getTime())) {
      throw CustomError(
        HTTP_CODES.BAD_REQUEST,
        'scheduled_at is not a valid date'
      );
    }
    scheduledDate = d;
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Kullanıcı aktif mi?
      const user = await User.findOne({ _id: user_id, is_active: true }).session(session);
      if (!user) {
        throw CustomError(
          HTTP_CODES.NOT_FOUND || 404,
          'User not found or inactive'
        );
      }

      // Aynı odada aktif rezervasyon var mı?
      const existing = await RoomReservation.findOne({
        user: user_id,
        room: room_id,
        active: true,
      }).session(session);

      if (existing) {
        throw CustomError(
          HTTP_CODES.CONFLICT || 409,
          'Active reservation already exists for this room'
        );
      }

      // Oda uygun mu? (açık ve kapasite dolmamış)
      const room = await Room.findOneAndUpdate(
        {
          _id: room_id,
          is_open: true,
          $expr: { $lt: ['$user_count', '$max_users'] },
        },
        { $inc: { user_count: 1 } },
        { new: true, session }
      );

      if (!room) {
        throw CustomError(
          HTTP_CODES.CONFLICT || 409,
          'Room is full or closed'
        );
      }

      // Rezervasyon oluştur
      const [reservation] = await RoomReservation.create(
        [{
          user: user_id,
          room: room._id,
          scheduled_at: scheduledDate,
        }],
        { session }
      );

      // Başarılı
      const ok = Response.successResponse({ reservation, room });
      return res.status(200).json(ok);
    });
  } catch (error) {
    // TEK çıkış: tüm hataları buradan dön
    const eresp = Response.errorResponse(error);
    return res.status(eresp.status || 400).json(eresp);
  } finally {
    session.endSession();
  }
};
