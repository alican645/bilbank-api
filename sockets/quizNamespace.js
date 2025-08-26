// /sockets/quizNamespace.js
const { QuizEngine } = require('../services/quizEngine');
const { verifyJwtToken } = require('../utils/auth');

const engine = new QuizEngine({
  questionDurationMs: 15_000, // 15 saniye
  gapAfterMs: 0,
});

function readTokenFromHandshake(socket) {
  console.log(socket.handshake)

  // handshake ile gelen veri burada olabilir ama şuan çalışmıyor buna bak 
  // TODO  
  const hs = socket.handshake || {};

  //HEADERLARDANN ALIYORUZ BURADA BURADA TOKENİ ALABİLİYORUZ BU ÇALIŞIYOR 
  const authToken = hs.headers.authorization; // önerilen
  console.log("authToken",authToken);
  const headerToken = hs.headers && (hs.headers.authorization || hs.headers.Authorization);
  const queryToken = hs.query && hs.query.token;
  return authToken || headerToken || queryToken;
}

function registerQuizNamespace(nsp) {
  // 🔐 JWT middleware
  nsp.use((socket, next) => {
    try {
      const tok = readTokenFromHandshake(socket);
      const user = verifyJwtToken(tok);      // { userId }
      socket.user = user;
      next();
    } catch {
      next(new Error('unauthorized socket'));
    }
  });

  nsp.on('connection', (socket) => {
    socket.emit('hello', { me: socket.id, userId: socket.user.userId });

    socket.on('joinRoom', ({ roomId }) => {
      if (!roomId) return;
      console.log(`User ${socket.user.userId} joining room ${roomId}`);
      socket.join(roomId);
      socket.emit('joined', { roomId });
    });

    
    socket.on('startRoom', ({ roomId }) => {
      engine.startRoom(roomId, nsp);
    });

    // Kullanıcı cevapları (15 sn pencerede)
    socket.on('answer', ({ roomId, questionId, optionId }) => {
      if (!roomId || !questionId) return;
      engine.acceptAnswer({
        roomId,
        userId: socket.user.userId,
        questionId,
        optionId,
      });
    });

    socket.on('scoreboard', ({ roomId }) => {
      socket.emit('scoreboard', engine.getScoreboard(roomId));
    });
  });
}

module.exports = { registerQuizNamespace };
