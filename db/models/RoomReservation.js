const mongoose = require('mongoose');
const { ReservationStatus } = require('../../config/Enum');
// ReservationStatus = { RESERVED: 0, CANCELLED: 1, FINISHED: 2 }

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

    scheduled_at: { type: Date },

    status: {
      type: Number,
      enum: Object.values(ReservationStatus),
      default: ReservationStatus.RESERVED,
      index: true,
    },

    joined_at: { type: Date },
  },
  {
    versionKey: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Aynı user aynı odada aynı anda sadece 1 RESERVED olabilir
roomReservationSchema.index(
  { user: 1, room: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 0 } } // sadece RESERVED için unique
);

// JSON çıktısı
roomReservationSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

module.exports = {
  RoomReservation: mongoose.model('RoomReservation', roomReservationSchema),
};
