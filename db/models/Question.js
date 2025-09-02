// db/models/Question.js
const mongoose = require('mongoose');
// alternatif: const { Schema, model } = require('mongoose');

const questionSchema = new mongoose.Schema({
  question:   { type: String,  required: true, trim: true },
  answer:     { type: Boolean, required: true },          // <-- burası Boolean
  multiplier: { type: Number,  default: 1, min: 1, max: 10 },
  is_active:  { type: Boolean, default: true },
}, {
  timestamps: true,
  versionKey: false,
  collection: 'questions',
});

module.exports = mongoose.model('Question', questionSchema);
// alternatif: module.exports = model('Question', questionSchema);
