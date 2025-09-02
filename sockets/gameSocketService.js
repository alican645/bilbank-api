// services/GameSocketService.js
const { verifyJwtToken } = require('../utils/auth');
const Room = require('../db/models/Room');
const { EntryStatus, ANSWER_RESULT } = require('../config/Enum');
const Question = require('../db/models/Question');
/** Handshake'den token'ı çek */
function readTokenFromHandshake(socket) {
  const hs = socket.handshake || {};
  const headerToken = hs.headers && (hs.headers.authorization || hs.headers.Authorization);
  const queryToken = hs.query && hs.query.token;
  return headerToken || queryToken;
}

class GameSocketService {
  /**
   * @param {{ io?: import('socket.io').Server, nsp?: import('socket.io').Namespace, nspPath?: string }} opts
   */
  constructor(opts = {}) {
    const { io, nsp, nspPath = '/quiz' } = opts;
    this.nsp = nsp || (io ? io.of(nspPath) : null);
    this.rooms = new Map(); // { roomId: { status, createdAt, players:Set<userId>, meta } }
    this.scoreBoard = new Map();
    this.answers = new Map(); // { roomId: { questionId: { userId, { answer, isCorrect, at } } } }
  }

  /** Dışarıdan namespace set etmek istersen */
  setNamespace(nsp) {
    this.nsp = nsp;
    return this;
  }

  /** Servisi ayağa kaldır (auth + eventler) */
  initialize() {
    if (!this.nsp) throw new Error('Namespace yok. io.of("/quiz") ver veya setNamespace çağır.');

    // --- Auth middleware ---
    this.nsp.use((socket, next) => {
      try {
        const tok = readTokenFromHandshake(socket);
        const user = verifyJwtToken(tok);
        socket.user = user; // { userId, ... }
        next();
      } catch {
        next(new Error('unauthorized socket'));
      }
    });

    // --- Connection handler ---
    this.nsp.on('connection', (socket) => {
      const uid = socket?.user?.userId;
      console.log(`🔌 Yeni bağlantı: ${socket.id} (uid=${uid || '-'})`);

      // Hoş geldin ping'i
      socket.emit('hello', { me: socket.id, userId: uid });

      // Odaya katılma
      socket.on('joinRoom', async ({ roomId }) => {
        if (!roomId) return;

        const rid = String(roomId);
        socket.join(rid);
        socket.emit('joined', { roomId: rid });

        // internal state: oyuncu set'ine ekle
        const state = this._ensureRoom(rid);
        if (uid) state.players.add(uid);

        // DB durumuna göre client'e bilgi gönder
        try {
          const room = await Room.findById(rid).lean();
          if (!room) return;

          if (room.room_status === EntryStatus.WAITING && room.starts_at) {
            socket.emit('startIn', { roomId: rid, startsAt: new Date(room.starts_at).toISOString() });
          } else if (room.room_status === EntryStatus.RUNNING) {
            socket.emit('started', { roomId: rid, startedAt: new Date().toISOString() });
          }
        } catch (error) {
          socket.emit('error', { message: error.message });
        }

        // Odaya katılımı diğerlerine bildir
        socket.to(rid).emit('userJoined', { roomId: rid, userId: uid });
      });

      // Odadan ayrılma
      socket.on('leaveRoom', ({ roomId }) => {
        if (!roomId) return;
        const rid = String(roomId);

        socket.leave(rid);
        socket.emit('left', { roomId: rid });
        socket.to(rid).emit('userLeft', { roomId: rid, userId: uid });

        const state = this.rooms.get(rid);
        if (state && uid) state.players.delete(uid);
      });

      socket.on('disconnect', () => {
        console.log(`❌ Bağlantı koptu: ${socket.id}`);
      });

      socket.on('answer', async ({ roomId, questionId, answer, wheelMultiplier }) => {
        try {
          const uid = socket?.user?.userId;
          if (!roomId || !questionId || typeof answer === 'undefined') {
            return socket.emit('answerResult', {
              ok: false,
              code: ANSWER_RESULT.MISSING_PARAMS,
              error: 'Eksik parametre',
            });
          }

          if (!uid) {
            return socket.emit('answerResult', {
              ok: false,
              code: ANSWER_RESULT.UNAUTHORIZED,
              error: 'Kimlik doğrulama yok',
            });
          }

          const rid = String(roomId);
          const qid = String(questionId);

          // ❌ Aynı kullanıcı bu soruya daha önce cevap verdi mi?
          const roomAnswers = this.answers.get(rid) ?? new Map();
          const questionAnswers = roomAnswers.get(qid) ?? new Map();

          if (questionAnswers.has(uid)) {
            return socket.emit('answerResult', {
              ok: false,
              code: ANSWER_RESULT.DUPLICATE_ANSWER,
              error: 'Bu soruya zaten cevap verdiniz.',
            });
          }

          // ✅ Soru DB'den
          const q = await Question.findById(qid).lean();
          if (!q) {
            return socket.emit('answerResult', {
              ok: false,
              code: ANSWER_RESULT.QUESTION_NOT_FOUND,
              error: 'Soru bulunamadı',
            });
          }

          // ✅ Normalize
          let userAns;
          if (typeof answer === 'boolean') userAns = answer;
          else if (typeof answer === 'string') userAns = answer.trim().toLowerCase() === 'true';
          else if (typeof answer === 'number') userAns = answer !== 0;
          else userAns = false;

          let correctAns;
          if (typeof q.answer === 'boolean') correctAns = q.answer;
          else correctAns = String(q.answer).trim().toLowerCase() === 'true';

          const isCorrect = userAns === correctAns;

          // ✅ Cevabı kaydet
          questionAnswers.set(uid, {
            answer: userAns,
            isCorrect,
            at: Date.now(),
          });
          roomAnswers.set(qid, questionAnswers);
          this.answers.set(rid, roomAnswers);

          if (!wheelMultiplier || isNaN(wheelMultiplier) || wheelMultiplier < 1) {
            wheelMultiplier = 1;
          }
          // ✅ Skor ekle
          if (isCorrect) {
            const board = this.scoreBoard.get(rid) ?? new Map();
            const prevScore = board.get(uid) ?? 0;
            board.set(uid, prevScore + 10 * q.multiplier * wheelMultiplier);
            this.scoreBoard.set(rid, board);
          }

          // 🎯 Sıralama
          const board = this.scoreBoard.get(rid) ?? new Map();
          const sorted = Array.from(board.entries()).sort((a, b) => b[1] - a[1]);
          const rank = sorted.findIndex(([user]) => user === uid) + 1;
          const score = board.get(uid) ?? 0;

          // ✅ Kullanıcıya başarılı cevap sonucu
          socket.emit('answerResult', {
            ok: true,
            code: ANSWER_RESULT.OK,
            isCorrect,
          });

          socket.emit('score', { score });

        } catch (err) {
          console.error('answer error:', err);
          socket.emit('answerResult', {
            ok: false,
            code: ANSWER_RESULT.SERVER_ERROR,
            error: 'Sunucu hatası',
          });
        }
      });

      socket.on('getRank', async ({ roomId }) => {
        try {
          const uid = socket?.user?.userId;
          if (!roomId) {
            return socket.emit('rankResult', {
              ok: false,
              error: 'roomId gerekli',
            });
          }

          const rid = String(roomId);
          const board = this.scoreBoard.get(rid) ?? new Map();

          const sorted = Array.from(board.entries())
            .sort((a, b) => b[1] - a[1]) // Skora göre azalan sırala
            .map(([userId, score], index) => ({
              userId,
              score,
              rank: index + 1,
              isMe: userId === uid,
            }));

          const myRank = sorted.find((entry) => entry.userId === uid);

          socket.emit('rankResult', {
            ok: true,
            rankings: sorted,
            myRank: myRank
              ? {
                rank: myRank.rank,
                score: myRank.score,
              }
              : {
                rank: null,
                score: 0,
              },
          });
        } catch (err) {
          console.error('getRank error:', err);
          socket.emit('rankResult', {
            ok: false,
            error: 'Sunucu hatası',
          });
        }
      });





    });


  }

  // ---------- Public API (controller'lardan çağıracağın metodlar) ----------

  /**
   * Odayı manuel başlat (dışarıdan)
   * @param {string} roomId
   * @param {object} meta
   */
  startRoom(roomId, meta = {}) {
    if (!roomId) throw new Error('roomId gerekli');
    const rid = String(roomId);

    const existed = this.rooms.has(rid);
    const state = this._ensureRoom(rid);
    state.status = 'started';
    state.meta = { ...(state.meta || {}), ...meta };
    if (!existed) state.createdAt = new Date();

    this._emitToRoom(rid, 'roomStarted', { roomId: rid, meta: state.meta, startedAt: new Date().toISOString() });
    console.log(`✅ ${rid} odası başlatıldı.`);
  }

  /**
   * Odayı manuel bitir (dışarıdan)
   * @param {string} roomId
   * @param {string} reason
   */
  endRoom(roomId, reason = 'finished') {
    if (!roomId) throw new Error('roomId gerekli');
    const rid = String(roomId);

    const state = this.rooms.get(rid);
    if (!state) {
      // yine de client'lere event atmak isteyebilirsin
      this._emitToRoom(rid, 'roomEnded', { roomId: rid, reason, endedAt: new Date().toISOString() });
      return;
    }

    state.status = 'ended';
    this._emitToRoom(rid, 'roomEnded', { roomId: rid, reason, endedAt: new Date().toISOString() });

    // İstersen state'i tamamen temizle:
    this.rooms.delete(rid);

    console.log(`🛑 ${rid} odası sonlandırıldı. reason=${reason}`);
  }

  /**
   * Odaya event/payload gönder (dışarıdan generic)
   * @param {string} roomId
   * @param {string} event
   * @param {any} payload
   */
  send(roomId, event, payload) {
    if (!roomId || !event) throw new Error('roomId ve event gerekli');
    const rid = String(roomId);
    this._emitToRoom(rid, event, payload);
  }

  /** Kısayol: önemli mesaj */
  sendImportant(roomId, payload) {
    this.send(roomId, 'importantMessage', payload);
  }

  /** Kısayol: düşük önem */
  sendLow(roomId, payload) {
    this.send(roomId, 'lowImportantMessage', payload);
  }

  /** Oda state'ini oku (opsiyonel yardımcı) */
  getRoomState(roomId) {
    return this.rooms.get(String(roomId)) || null;
  }

  // -------------------- Private helpers --------------------

  _ensureRoom(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, { status: 'idle', createdAt: new Date(), players: new Set(), meta: {} });
    }
    return this.rooms.get(roomId);
  }

  _emitToRoom(roomId, event, payload) {
    if (!this.nsp) throw new Error('Namespace yok.');
    this.nsp.to(roomId).emit(event, payload);
  }

  _normalizeBool(val) {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') return val.trim().toLowerCase() === 'true';
    if (typeof val === 'number') return val !== 0;
    return false;
  }

  _getRoomQuestionAnswers(roomId, questionId) {
    const rid = String(roomId);
    const qid = String(questionId);

    if (!this.answers.has(rid)) this.answers.set(rid, new Map());
    const roomMap = this.answers.get(rid);

    if (!roomMap.has(qid)) roomMap.set(qid, new Map());
    const qMap = roomMap.get(qid);

    return qMap; // Map<userId, { answer, isCorrect, at }>
  }
}



module.exports = GameSocketService;


