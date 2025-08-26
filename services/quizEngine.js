// /services/quizEngine.js
const { InMemoryRoomStore } = require('./roomStore');
const { InMemoryScoreboard } = require('./scoreboard');
const { QuestionProvider } = require('./questionProvider');
const { nowMs, delay } = require('../utils/clock');

class QuizEngine {
  constructor(opts) {
    this.opts = opts;
    this.roomStore = new InMemoryRoomStore();
    this.scores = new InMemoryScoreboard();
    this.qProvider = new QuestionProvider();
    this.runningRooms = new Map(); // roomId -> true
  }

  startRoom(roomId, nsp) {
    if (this.runningRooms.get(roomId)) return;
    this.runningRooms.set(roomId, true);
    this.loop(roomId, nsp).catch((e) => {
      console.error('loop error', e);
      this.runningRooms.delete(roomId);
    });
  }

  stopRoom(roomId) {
    this.runningRooms.delete(roomId);
  }

  async loop(roomId, nsp) {
    while (this.runningRooms.get(roomId)) {
      const question = this.qProvider.nextQuestion(roomId);
      const deadline = nowMs() + this.opts.questionDurationMs;

      nsp.to(roomId).emit('question', {
        roomId,
        question: {
          id: question.id,
          text: question.text,
          options: question.options.map(o => ({ id: o.id, text: o.text })),
        },
        deadline,
        durationMs: this.opts.questionDurationMs,
      });

      this.roomStore.beginRound(roomId, question.id, deadline);
      await delay(this.opts.questionDurationMs);

      const round = this.roomStore.endRound(roomId);
      const correct = question.correctOptionId;

      const perUser = [];
      for (const [userId, optionId] of round.answers.entries()) {
        const isCorrect = optionId === correct;
        if (isCorrect) this.scores.add(roomId, userId, 1);
        perUser.push({ userId, optionId, isCorrect });
      }

      nsp.to(roomId).emit('roundResult', {
        roomId,
        questionId: question.id,
        correctOptionId: correct,
        answers: perUser,
        scoreboard: this.scores.get(roomId),
      });

      if (this.opts.gapAfterMs > 0) await delay(this.opts.gapAfterMs);
    }
  }

  acceptAnswer({ roomId, userId, questionId, optionId }) {
    const round = this.roomStore.getCurrentRound(roomId);
    if (!round) return false;
    if (round.questionId !== questionId) return false;
    if (nowMs() > round.deadline) return false;
    this.roomStore.submit(roomId, userId, optionId);
    return true;
  }

  getScoreboard(roomId) {
    return this.scores.get(roomId);
  }
}

module.exports = { QuizEngine };
