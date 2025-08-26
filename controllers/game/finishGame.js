// controllers/rooms/finishGame.js
const mongoose = require('mongoose');
const Room = require('../../db/models/Room');
const { RoomReservation } = require('../../db/models/RoomReservation');
const CustomError = require('../../lib/CustomError');
const { HTTP_CODES,  } = require('../../config/Enum');

exports.finishGame = async (room_id) => {
    if (!room_id) {
        throw new CustomError(HTTP_CODES.BAD_REQUEST, 'room_id is invalid');
    }

    // 1) Odayı kapat
    const room = await Room.findById(room_id);
    if (!room) throw new CustomError(HTTP_CODES.NOT_FOUND, 'Room not found');

    // Kapama (alan adlarını senin şemana göre ayarla)
    room.is_open = false;
    // Eğer başka durum alanın varsa:
    // room.status = RoomStatus.CLOSED;
    await room.save();

    // 2) Aktif rezervasyonları FINISHED yap ve pasifleştir (tek query)
    await RoomReservation.updateMany(
        { room: room_id, active: true },
        { $set: { active: false, status: ReservationStatus.FINISHED } }
    );

    // 3) Yeni bir oda oluştur (gerekli alanları klonla)
    // Şema alanlarını kendi modeline göre tamamla:
    const newRoomPayload = {
        title: room.title ?? room.name,     // sende hangi alan varsa onu kullan
        room_type: room.room_type,
        reward: room.reward,
        entry_fee: room.entry_fee,
        max_users: room.max_users,
        is_open: true,
        // status: RoomStatus.OPEN, // varsa
        // ...oda şemanda default/required olan başka alanlar
    };

    const newRoom = await Room.create(newRoomPayload); // create zaten kaydeder

    // İstersen fonksiyon bir şey döndürsün
    return {
        closed_room_id: room._id.toString(),
        new_room_id: newRoom._id.toString(),
    };
};
