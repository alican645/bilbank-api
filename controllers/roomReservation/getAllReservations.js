const mongoose = require('mongoose');
const Room = require('../../db/models/Room');
const { RoomReservation } = require('../../db/models/RoomReservation');
const User = require('../../db/models/User');
const Response = require('../../lib/Response');
const { HTTP_CODES } = require('../../config/Enum');

exports.getAllReservations = async (req, res) => {
    try {
        // --- Tüm aktif rezervasyonları çek
        const reservations = await RoomReservation.find({ status: 0 }).lean();

        if (reservations.length === 0) {
            return res.status(HTTP_CODES.OK).json(
                Response.successResponse(
                    HTTP_CODES.OK,
                    [],
                    'No active reservations found'
                )
            );
        }

        // --- Kullanıcıları getir
        const userIds = reservations.map(r => r.user);
        const users = await User.find({ _id: { $in: userIds } })
            .select('username email')
            .lean();

        // --- Rezervasyonlara kullanıcıyı iliştir
        const data = reservations.map(r => {
            const user = users.find(u => u._id.toString() === r.user.toString());
            return {
                ...r,
                user: user || null
            };
        });

        return res.status(HTTP_CODES.OK).json(
            Response.successResponse(
                HTTP_CODES.OK,
                data,
                'All active reservations fetched successfully'
            )
        );
    } catch (err) {
        console.error(err);
        return res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json(
            Response.errorResponse(
                HTTP_CODES.INTERNAL_SERVER_ERROR,
                err.message || 'Something went wrong',
                err.toString()
            )
        );
    }
};
