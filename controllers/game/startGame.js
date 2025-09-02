// services/gameService.js
const { QuizEngine } = require('../../services/quizEngine');

// Tekil engine
const engine = new QuizEngine({ questionDurationMs: 15000, gapAfterMs: 0 });

exports.GameService = {
  /**
   * Bir odanın kanalını başlatır ve kullanıcılara mesaj yollar.
   * @param {string} roomId 
   * @param {import('socket.io').Namespace} nsp 
   */
  startRoomChannel(roomId, nsp) {
    // Odaya bağlı herkese mesaj gönder
    nsp.to(roomId).emit('roomReady', {
      roomId,
      message: 'Oda başlıyor 🚀'
    });


    console.log(`Starting game for room ${roomId}`);
    // QuizEngine başlat
    engine.startRoom(roomId, nsp);
  }
};
