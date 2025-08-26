// routes/rooms.js
const Room = require('../../db/models/Room');
const RoomReservation = require('../../db/models/RoomReservation');
const CustomError = require('../../lib/CustomError');
const Enum = require('../../config/Enum');
const Response = require('../../lib/Response');
const { RoomTypes, RoomStatus } = require('../../config/Enum');

// bu controller , belirli bir kullanıcın odalarını ve rezervasyon duruumlarını döner
module.exports = async (req, res) => {
    const { user_id } = req.params;
    try {
        // Kullanıcının aktif rezervasyonlarını al
        let reservations = await RoomReservation.find({ user_id: user_id , active: true  }).populate('room_id');

        // tüm odaları tutacak dizi
        let rooms = Room.find({});

        let customRespone ={};

        for (let room of rooms){
            for (let reservation of reservations){
                if(room._id.toString() === reservation.room_id.toString()){
                    // rezervasyonlu odayı seç
                    let roomDetail = room;
                    roomDetail.is_reserved = true;
                    customRespone.push(roomDetail);
                }else{
                    // rezervasyonsuz odayı seç
                    let roomDetail = room;
                    roomDetail.is_reserved = false;
                    customRespone.push(roomDetail);
                }
            }
        }
        res.json(Response.successResponse(uniqueRooms));
    } catch (error) {
        res.json(Response.errorResponse(error));
    }

}