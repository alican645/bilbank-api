// /sockets/index.js
const { Server } = require('socket.io');
const { registerQuizNamespace } = require('./quizNamespace');

function attachSocketServer(server, app) {
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket'],
  });

  // Express içinden erişmek istersen
  app.set('io', io);
  console.log("socket server çalışıyor")
  // /quiz namespace
  registerQuizNamespace(io.of('/quiz'));
}

module.exports = { attachSocketServer };
