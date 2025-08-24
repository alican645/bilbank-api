const mongoose = require('mongoose');
const { ReservationStatus } = require('../../config/Enum');





const roomReservationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    // İsteğe bağlı: kullanıcı bir zaman seçiyorsa
    scheduled_at: { type: Date },

    status: {
      type: Number,
      enum: Object.values(ReservationStatus),
      default: ReservationStatus.PENDING,
      index: true,
    },

    // Aktiflik bayrağı (tekil indeks için pratik)
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    versionKey: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Aynı kullanıcı aynı odada eşzamanlı birden fazla aktif rezervasyon açamasın
roomReservationSchema.index(
  { user: 1, room: 1, active: 1 },
  { unique: true, partialFilterExpression: { active: true } }
);

module.exports = {
  RoomReservation: mongoose.model('RoomReservation', roomReservationSchema),
  ReservationStatus,
};