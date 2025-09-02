const mongoose = require('mongoose');
const { RoomTypes, EntryStatus } = require('../../config/Enum');
const CustomError = require('../../lib/CustomError');


const roomSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      index: true,
    },

    room_type: {
      type: Number,
      enum: Object.values(RoomTypes),
      required: true,
      index: true,
    },

    reward:   { type: Number, required: true, default: 0, min: 0 },
    entry_fee:{ type: Number, required: true, default: 0, min: 0 },

    max_users:{ type: Number, required: true, min: 1 },
    min_users:{ type: Number, required: true, min: 1 },

    // Oda yaşam döngüsü
    room_status: {
      type: Number,
      enum: Object.values(EntryStatus),
      required: true,
      index: true,
    },
    starts_at: { type: Date, index: true },
    ended_at:  { type: Date, index: true },

    // Performans için cache (aktif rezervasyon sayısı)
    active_reservation_count: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Mantıksal kontrol
roomSchema.pre('validate', function (next) {
  if (this.min_users > this.max_users) {
    return next(new CustomError('min_users, max_users değerinden büyük olamaz.'));
  }
  next();
});

// Sık sorgular için indeksler
roomSchema.index({ room_status: 1, active_reservation_count: 1 });
roomSchema.index({ room_status: 1, starts_at: 1 });
roomSchema.index({ active_reservation_count: 1, max_users: 1 });

// JSON: _id -> id
roomSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Room', roomSchema);
