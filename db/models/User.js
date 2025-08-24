// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    is_active:{ type: Boolean, default: true },
  },
  {
    versionKey: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// 1-1 virtual: User.information -> UserInformation.user
userSchema.virtual('information', {
  ref: 'UserInformation',   // model adı ile AYNI
  localField: '_id',
  foreignField: 'user',
  justOne: true,
});

userSchema.set('toObject', { virtuals: true });
userSchema.set('toJSON',   { virtuals: true });

// İstersen kaldırabilirsin
class User extends mongoose.Model {
    validPassword(password) {
        return bcrypt.compareSync(password, this.password);
    }
}
userSchema.loadClass(User);

module.exports = mongoose.model('User', userSchema); // <<< model adı tekil "User"
