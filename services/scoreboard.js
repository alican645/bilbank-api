// /services/scoreboard.js
class InMemoryScoreboard {
  constructor() {
    // roomId -> Map<userId -> score>
    this.scores = new Map();
  }

  _map(roomId) {
    if (!this.scores.has(roomId)) this.scores.set(roomId, new Map());
    return this.scores.get(roomId);
  }

  add(roomId, userId, delta) {
    const map = this._map(roomId);
    map.set(userId, (map.get(userId) || 0) + delta);
  }

  get(roomId) {
    const map = this._map(roomId);
    return [...map.entries()]
      .map(([userId, score]) => ({ userId, score }))
      .sort((a, b) => b.score - a.score);
  }
}

module.exports = { InMemoryScoreboard };
