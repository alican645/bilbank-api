// /sockets/index.js
const { Server } = require('socket.io');
const  GameSocketService  = require('./gameSocketService');


function attachSocketServer(server, app) {
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket'],
  });

  // Express içinden erişmek istersen
  app.set('io', io);
  console.log("socket server çalışıyor")
  // /quiz namespace
  const quizService = new GameSocketService({ nsp: io.of('/quiz') });
  // Express içinden erişmek için app içersine tanımladık 
  app.set('quizService', quizService);
  quizService.initialize();
}

module.exports = { attachSocketServer };
