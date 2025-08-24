// models/UserInformation.js
const mongoose = require('mongoose');

const userInformationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',        // model adı ile AYNI
      required: true,
      unique: true,       // 1-1 ilişki
      index: true,
    },
    first_name: { type: String, required: true },
    last_name:  { type: String, required: true },
    birth_date: { type: Date,   required: true },
  },
  {
    versionKey: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, // <<< düzelttik
  }
);

// İstersen kaldırabilirsin
class UserInformation extends mongoose.Model {}
userInformationSchema.loadClass(UserInformation);

module.exports = mongoose.model('UserInformation', userInformationSchema); // <<< tekil ve ref ile aynı
