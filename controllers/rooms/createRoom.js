const Enum = require('../../config/Enum');
const Response = require('../../lib/Response');
const Room = require('../../db/models/Room');
const  validateRoom  = require('../../lib/validateFunctions/validateRoom');

exports.createRoom = async (req, res) => {
    let body = req.body;
    try {
        validateRoom(body);

        const room = new Room({
            title: body.title.trim(),
            room_type: body.room_type,
            reward: body.reward,
            entry_fee: body.entryFee,
            min_users: body.minUsers,
            max_users: body.maxUsers,
            // status: _status, // şemadaki defaultu kullanmak istersen yorumda bırak
            ...(body.status !== undefined ? { status: body.status } : {}),
            ...(body.is_open !== undefined ? { is_open: !!body.is_open } : {}),
        });

        await room.save();

        // 201 Created + oluşturulan nesnenin kendisi
        return res
            .status(Enum.HTTP_CODES.CREATED)
            .json(Response.successResponse(room, Enum.HTTP_CODES.CREATED));
    } catch (err) {
        const errorResponse = Response.errorResponse(err);
        return res.status(errorResponse.code).json(errorResponse);
    }
}

