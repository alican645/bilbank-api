// models/Room.js
const mongoose = require("mongoose");
const { RoomTypes, RoomStatus } = require("../../config/Enum");

const roomSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    room_type: {
      type: Number,
      enum: Object.values(RoomTypes),
      required: true,
    },

    reward: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    entry_fee: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    min_users: {
      type: Number,
      required: true,
      default: 2,
      min: 1,
    },

    max_users: {
      type: Number,
      required: true,
      default: 10,
      min: 1,
    },

    status: {
      type: Number,
      enum: RoomStatus,
      default: Object.values(RoomStatus),
    },

    is_open: {
      type: Boolean,
      default: true,
      index: true,
    },

    user_count: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Mantıksal validasyonlar
roomSchema.pre("validate", function (next) {
  if (this.min_users > this.max_users) {
    return next(new Error("min_users, max_users değerinden büyük olamaz."));
  }
  next();
});

// JSON çıktı: _id -> id
roomSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model("Room", roomSchema);
