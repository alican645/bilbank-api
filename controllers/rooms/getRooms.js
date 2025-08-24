// routes/rooms.js
const Room = require('../../db/models/Room');
const CustomError = require('../../lib/CustomError');
const Enum = require('../../config/Enum');
const Response = require('../../lib/Response');
const { RoomTypes, RoomStatus } = require('../../config/Enum');

exports.getRooms = async (req, res) => {
  
    let items = await Room.find({});

  try {
    res.json(Response.successResponse(items));
  } catch (error) {
    res.json(Response.errorResponse(error));
  }

  
};
