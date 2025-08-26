

// models/WaitingUsers.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Her oda için bir kuyruk dokümanı: roomId -> queue array
const WaitingUsersSchema = new Schema({
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true, unique: true },
  queue: [{ type: Schema.Types.ObjectId, ref: 'User' }], // kuyruğa alınan kullanıcı id'leri (FIFO)
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WaitingUsers', WaitingUsersSchema);