const mongoose = require('mongoose');
const Room = require('../../db/models/Room');
const { RoomReservation } = require('../../db/models/RoomReservation');
const User = require('../../db/models/User');
const Response = require('../../lib/Response');
const CustomError = require('../../lib/CustomError');
const { HTTP_CODES } = require('../../config/Enum');



exports.getActiveReservations = async (req, res) => {
    const { room_id } = req.query;
    console.log(room_id);
    try {
        if (!room_id)
            throw new CustomError(HTTP_CODES.BAD_REQUEST, 'room_id is required', 'Please provide a valid room_id.');

        if (!mongoose.Types.ObjectId.isValid(room_id))
            throw new CustomError(HTTP_CODES.BAD_REQUEST, 'invalid room_id', 'room_id must be a valid ObjectId.');

        // Odayı önce aktif, yoksa pasif olarak bul
        let room = await Room.findOne({ _id: room_id, is_open: true }).lean();
        if (!room) {
            room = await Room.findOne({ _id: room_id, is_open: false }).lean();
            if (!room) {
                throw new CustomError(HTTP_CODES.NOT_FOUND, 'Room not found', 'No room found with given room_id.');
            }
        }

        const reservations = await RoomReservation.find({
            room: room_id,
            active: true,
        })
            .select('_id user room status active')
            .lean();

        const userIds = reservations.map(r => r.user).filter(Boolean);
        const users = userIds.length
            ? await User.find({ _id: { $in: userIds } })
                .select('_id email') // ihtiyacın olan alanlar
                .lean()
            : [];

        return res
            .status(HTTP_CODES.OK)
            .json(
                Response.successResponse(HTTP_CODES.OK, {
                    room,
                    reservations,
                    users,
                })
            );

    } catch (err) {
        const errorResponse = Response.errorResponse(err);
        return res.status(errorResponse.code || 500).json(errorResponse);
    }
};
