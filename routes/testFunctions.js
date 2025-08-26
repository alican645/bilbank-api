// routes/rooms.js (mevcut rooms router’ına ekle)
const express = require('express');
const router = express.Router();
const { finishGame } = require('../controllers/game/finishGame');
const Response = require('../lib/Response');

// Örn: POST /api/rooms/:room_id/finish
router.post('/finishGame', async (req, res) => {
  try {
    const { room_id } = req.body;
    console.log(room_id);
    const result = await finishGame(room_id);
    return res.json(Response.successResponse(result));
  } catch (err) {
    if (Response.errorResponse) return res.status(err.status || 400).json(Response.errorResponse(err));
    return res.status(err.status || 400).json({ success: false, message: err.message, error: err });
  }
});

module.exports = router;
