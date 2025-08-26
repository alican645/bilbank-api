// models/Room.js
const mongoose = require("mongoose");
const { RoomTypes,EntryStatus } = require("../../config/Enum");



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

    max_users: {
      type: Number,
      required: true,
      min: 1,
    },

    min_users: {
      type: Number,
      required: true,
      min: 1,
    },

    room_status: {
      type: Number,
      enum: Object.values(EntryStatus),
      required: true,
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

