// /services/questionProvider.js
const SAMPLE = [
  {
    id: 'q1',
    text: 'Türkiye’nin başkenti?',
    options: [
      { id: 'a', text: 'İstanbul' },
      { id: 'b', text: 'Ankara' },
      { id: 'c', text: 'İzmir' },
      { id: 'd', text: 'Bursa' },
    ],
    correctOptionId: 'b',
  },
  {
    id: 'q2',
    text: '2 + 2 = ?',
    options: [
      { id: 'a', text: '3' },
      { id: 'b', text: '4' },
      { id: 'c', text: '5' },
      { id: 'd', text: '22' },
    ],
    correctOptionId: 'b',
  },
  {
    id: 'q3',
    text: 'Socket.IO hangi protokolü kullanabilir?',
    options: [
      { id: 'a', text: 'WebSocket' },
      { id: 'b', text: 'HTTP Long Polling' },
      { id: 'c', text: 'Her ikisi' },
      { id: 'd', text: 'Hiçbiri' },
    ],
    correctOptionId: 'c',
  },
];

class QuestionProvider {
  constructor() { this.cursors = new Map(); } // roomId -> index

  nextQuestion(roomId) {
    const idx = this.cursors.get(roomId) ?? 0;
    const q = SAMPLE[idx % SAMPLE.length];
    this.cursors.set(roomId, (idx + 1) % SAMPLE.length);
    return q;
  }
}

module.exports = { QuestionProvider };
