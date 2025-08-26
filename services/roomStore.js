// /services/roomStore.js
class InMemoryRoomStore {
  constructor() {
    // roomId -> { currentRound: { questionId, deadline, answers: Map<userId -> optionId> } | null }
    this.rooms = new Map();
  }

  ensure(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, { currentRound: null });
    }
    return this.rooms.get(roomId);
  }

  beginRound(roomId, questionId, deadline) {
    const room = this.ensure(roomId);
    room.currentRound = { questionId, deadline, answers: new Map() };
  }

  submit(roomId, userId, optionId) {
    const room = this.ensure(roomId);
    if (!room.currentRound) return;
    // ilk cevabı kilitlemek istersen:
    // if (!room.currentRound.answers.has(userId)) room.currentRound.answers.set(userId, optionId);
    room.currentRound.answers.set(userId, optionId); // son cevabı esas al
  }

  endRound(roomId) {
    const room = this.ensure(roomId);
    const ended = room.currentRound || { questionId: null, deadline: 0, answers: new Map() };
    room.currentRound = null;
    return ended;
  }

  getCurrentRound(roomId) {
    return this.ensure(roomId).currentRound;
  }
}

module.exports = { InMemoryRoomStore };
