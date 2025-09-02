// routes/rooms.js
const express = require('express');
const router = express.Router();
const Auth = require('../lib/auth')();

const {getRooms} = require('../controllers/rooms/getRooms');
const {createRoom} = require('../controllers/rooms/createRoom');
const {reserveRoom} = require('../controllers/roomReservation/reserveRoom');
const {getActiveReservations} = require('../controllers/roomReservation/getActiveReservations');
const {getAllReservations} = require('../controllers/roomReservation/getAllReservations');
const {roomIsReserved} = require('../controllers/roomReservation/roomIsReserved');
const {showRoom} = require('../controllers/roomReservation/showRoom');
const {joinRoom} = require('../controllers/rooms/joinRoom');



router.all('*', Auth.authenticate(), (req, res, next) => next());

router.get('/',getRooms);
router.get('/getActiveReservations',getActiveReservations);
router.get('/getAllReservations',getAllReservations);

router.post('/reserveRoom', reserveRoom);
router.post('/roomIsReserved',roomIsReserved)
router.post('/showRoom',showRoom)
router.post('/joinRoom',joinRoom)
router.post('/createRoom',createRoom)



// Rezervasyon iptal (cancel)
router.post('/:room_id/reservations/:reservation_id', (req, res, next) => {
  return cancelReservation(req, res, next);
});

module.exports = router;

