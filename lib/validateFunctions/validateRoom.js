// routes/rooms.js
const CustomError = require('../CustomError');
const Enum = require('../../config/Enum');
const { RoomTypes, RoomStatus } = require('../../config/Enum');

module.exports=function validateRoom(body) {
    const {
        title,
        room_type,
        reward,
        entry_fee,
        min_users,
        max_users,
        status,

    } = body ?? {};

    // ---- Basit doğrulamalar (şemanın üstüne ek güvenlik) ----
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, 'title is required');
    }
    if (title.trim().length > 120) {
        throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, 'title must be <= 120 chars');
    }

    if (typeof room_type !== 'number' || !Object.values(RoomTypes).includes(room_type)) {
        throw new CustomError(
            Enum.HTTP_CODES.BAD_REQUEST,
            `room_type is required and must be one of: ${Object.values(RoomTypes).join(', ')}`
        );
    }

    const numOr = (v, d) => (v === undefined || v === null ? d : Number(v));
    const _reward = numOr(reward, 0);
    const _entryFee = numOr(entry_fee, 0);
    const _minUsers = numOr(min_users, 2);
    const _maxUsers = numOr(max_users, 10);

    if (!Number.isFinite(_reward) || _reward < 0) {
        throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, 'reward must be a non-negative number');
    }
    if (!Number.isFinite(_entryFee) || _entryFee < 0) {
        throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, 'entry_fee must be a non-negative number');
    }
    if (!Number.isInteger(_minUsers) || _minUsers < 1) {
        throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, 'min_users must be an integer >= 1');
    }
    if (!Number.isInteger(_maxUsers) || _maxUsers < 1) {
        throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, 'max_users must be an integer >= 1');
    }
    if (_minUsers > _maxUsers) {
        throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, 'min_users cannot be greater than max_users');
    }

    let _status = status;
    if (_status !== undefined) {
        if (typeof _status !== 'number' || !Object.values(RoomStatus).includes(_status)) {
            throw new CustomError(
                Enum.HTTP_CODES.BAD_REQUEST,
                `status must be one of: ${Object.values(RoomStatus).join(', ')}`
            );
        }
    }

}