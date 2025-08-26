// controllers/rooms/reserveRoom.js
const Room = require('../../db/models/Room');
const { RoomReservation } = require('../../db/models/RoomReservation');
const User = require('../../db/models/User');
const Response = require('../../lib/Response');
const CustomError = require('../../lib/CustomError');
const { HTTP_CODES, EntryStatus, UserEntryStatus } = require('../../config/Enum');

exports.reserveRoom = async (req, res) => {
  const { room_id, scheduled_at, user_id } = req.body || {};

  try {
    // 1) Validasyonlar
    if (!user_id) throw new CustomError(HTTP_CODES.BAD_REQUEST, 'user_id is required', 'Please provide a valid user_id.');
    if (!room_id) throw new CustomError(HTTP_CODES.BAD_REQUEST, 'room_id is required', 'Please provide a valid room_id.');

    let scheduledDate;
    if (scheduled_at) {
      const d = new Date(scheduled_at);
      if (isNaN(d.getTime())) throw new CustomError(HTTP_CODES.BAD_REQUEST, 'scheduled_at is not a valid date');
      scheduledDate = d;
    }

    // 2) Kullanıcı aktif mi?
    const user = await User.findOne({ _id: user_id, is_active: true }).lean();
    if (!user) throw new CustomError(HTTP_CODES.NOT_FOUND, 'User not found or inactive');

    // 3) Odayı getir (durum ne olursa olsun)
    const room = await Room.findOne({ _id: room_id });
    if (!room) throw new CustomError(HTTP_CODES.NOT_FOUND, 'Room not found');

    // 4) Kapasiteyi tahmini kontrol etmek için aktif rezervasyon sayısı
    //    (Üretimde: direct-entry'leri sayabilmek için current_users alanı kullan)
    const reservationCount = await RoomReservation.countDocuments({ room: room_id, active: true });

    // 5) Duruma göre davran
    if (room.room_status === EntryStatus.ROOM_CLOSED) {
      throw new CustomError(HTTP_CODES.CONFLICT, 'Room is closed');
    }

    if (room.room_status === EntryStatus.ROOM_IN_PROGRESS) {
      // Oyun başladı → direkt giriş akışı (rezervasyon yok)
      // TODO (güvenli kapasite): Şemaya room.current_users ekleyip atomik ++/-- yap.
      if (reservationCount >= room.max_users) {
        // Not: direct-entry sayılmıyorsa bu kontrol yetersiz kalabilir.
        throw new CustomError(HTTP_CODES.CONFLICT, 'Room is full');
      }

      // Burada gerçek oyuna katılım işlemini tetikle (socket.join, participant kaydı vs.)
      // ör: await gameService.addParticipant(room._id, user_id)

      const response = {
        value: 1, // UserEntryStatus.User_Direct_Entry.value
        description: "Lütfen bekleyiniz, odaya giriş yapıyorsunuz",
        code: 'User_Direct_Entry',
      };

      return res.status(HTTP_CODES.OK).json(
        Response.successResponse(response)
      );
    }

    // === ROOM_APPLICATION_OPEN (başvuruya açık) ===
    // 6) Rezervasyon oluştur (duplicate için E11000 yakala)
    let reservation;
    try {
      reservation = await RoomReservation.create({
        user: user_id,
        room: room_id,
        scheduled_at: scheduledDate,
        active: true,
      });
    } catch (err) {
      if (err && err.code === 11000) {
        throw new CustomError(HTTP_CODES.CONFLICT, 'Active reservation already exists for this room');
      }
      throw err;
    }

    // 7) Rezervasyon sayısını tekrar kontrol et
    const newCount = await RoomReservation.countDocuments({ room: room_id, active: true });

    // ❌ Maksimum aşılırsa son geleni geri al
    if (newCount > room.max_users) {
      await RoomReservation.deleteOne({ _id: reservation._id }).catch(() => {});
      throw new CustomError(HTTP_CODES.CONFLICT, 'Room is full');
    }

    // ⚡ Minimum kullanıcıya ulaşıldıysa odayı başlat
    if (newCount >= room.min_users && room.room_status === EntryStatus.ROOM_APPLICATION_OPEN) {
      // TODO: startGame(room._id) gibi oyun başlatma servisini çağır
      // ör: await gameService.startGame(room._id)
      room.room_status = EntryStatus.ROOM_IN_PROGRESS;
      await room.save();
    }

    const response = {
      value: 0, // UserEntryStatus.User_Waiting.value
      description: "Başvurunuz alındı; oda açılınca oyuna girebilirsiniz",
      code: 'User_Waiting',
    };

    return res.status(HTTP_CODES.OK).json(
      Response.successResponse(response)
    );

  } catch (error) {
    const eresp = Response.errorResponse
      ? Response.errorResponse(error)
      : {
          success: false,
          status: error.status || 400,
          message: error.message || 'Unknown error',
          error,
        };
    return res.status(eresp.status || 400).json(eresp);
  }
};
