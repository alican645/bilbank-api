const Room = require('../../db/models/Room')
const Users = require('../../db/models/User');
const { RoomReservation } = require('../../db/models/RoomReservation')
const jwt = require('jwt-simple');
const Response = require('../../lib/Response');
const CustomError = require('../../lib/CustomError');
const { HTTP_CODES, EntryStatus, ReservationStatus } = require('../../config/Enum');
const mongoose = require('mongoose');
const config = require('../../config');

exports.showRoom = async (req, res) => {
    const {  room_id } = req.body || {};
    const { authorization } = req.headers;

    try {
        // --- Validasyon ---
        if ( !room_id) throw new CustomError(HTTP_CODES.BAD_REQUEST, 'room_id required');
        if ( !mongoose.isValidObjectId(room_id)) {
            throw new CustomError(HTTP_CODES.BAD_REQUEST, 'invalid ids');
        }

        // --- JWT'den kullanıcıyı bul (DÜZELTİLMİŞ BLOK) ---
        if (!authorization) {
            throw new CustomError(HTTP_CODES.UNAUTHORIZED, 'AUTH_HEADER_MISSING');
        }

        // "Bearer <token>" prefiksini temizle
        const token = authorization.startsWith('Bearer ')
            ? authorization.slice(7).trim()
            : authorization.trim();

        let decoded;
        try {
            decoded = jwt.decode(token, config.JWT.SECRET); // exp kontrolü istenmedi, eklemedim
        } catch (e) {
            throw new CustomError(HTTP_CODES.UNAUTHORIZED, 'TOKEN_INVALID');
        }

        if (!decoded || !decoded.id) {
            throw new CustomError(HTTP_CODES.UNAUTHORIZED, 'TOKEN_PAYLOAD_INVALID');
        }

        // decoded.id -> payload içine koyduğun user id
        const user = await Users.findById(decoded.id);
        if (!user) throw new CustomError(HTTP_CODES.NOT_FOUND, 'USER_NOT_FOUND');
        if (user.is_active === false) throw new CustomError(HTTP_CODES.FORBIDDEN, 'USER_INACTIVE');

        // --- idempotent kontrol: Bu kullanıcı bu odada zaten RESERVED mı? ---
        const existing = await RoomReservation.findOne({
            user: user.id,
            room: room_id,
            status: ReservationStatus.RESERVED,
        }).lean();

        let reserved;
        if (existing) {
            reserved = true;
        } else {
            reserved = false;
        }

        let room = await Room.findById(room_id);
        room.reserved = reserved;
        room.save();

        const {
            title,
            room_type,
            reward,
            entry_fee,
            max_users,
            room_status,
            active_reservation_count,
        } = room;

        

        // Not: Burada string dönüyorsun; aynen bıraktƒFım.
        res.status(HTTP_CODES.OK).json(Response.successResponse({ 
            title,
            room_type,
            reward,
            entry_fee,
            max_users,
            room_status,
            active_reservation_count,
            reserved
         }, HTTP_CODES.OK));

    }
    catch (error) {
        const errRes = Response.errorResponse(error);
        return res.status(errRes.code || 500).json(errRes);
    }
}

