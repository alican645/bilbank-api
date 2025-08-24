// routes/rooms.js
const express = require('express');
const router = express.Router();
const Auth = require('../lib/auth')();

const {getRooms} = require('../controllers/rooms/getRooms');
const {createRoom} = require('../controllers/rooms/createRoom');
const {reserveRoom} = require('../controllers/rooms/reserveRoom');




router.all('*', Auth.authenticate(), (req, res, next) => next());

router.get('/',getRooms)

router.post('/createRoom',createRoom);


router.post('/reserveRoom', reserveRoom);


// Rezervasyon iptal (cancel)
router.post('/:room_id/reservations/:reservation_id', (req, res, next) => {
  return cancelReservation(req, res, next);
});

module.exports = router;

