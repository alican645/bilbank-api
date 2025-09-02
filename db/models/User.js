const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    username:{
      type: String,
      required: true,
      unique: true,
      
    },
    password: {
      type: String,
      required: true,
    },
    is_active: { type: Boolean, default: true },
    first_name: { type: String, required: true },
    last_name:  { type: String, required: true },
    birth_date: { type: Date,   required: true },
    avatar: {
      type: String,
      default:""
    },
    balance:{
      type: Number,
      default:0
    },
    triva : {
      type: Number,
      default: 0
    },

    total_score: { type: Number, default: 0 },


    admin_settings:{
      type: String,
    },
    device_token:{
      type: String,
    },
    status:{
      type: String,
      enum:["Active","Suspended","Banned"],
      default:"Active"
    },
    reset_password_token: { type: String },
    reset_password_expires: { type: Date },
    last_password_reset_request: { type: Date },

    admin_logs:[
      {
        action : {type: String,},
        amount : {type: Number,},
        adminId : {type:String},
        timestamps : { type: Date, default: Date.now },
        note :{type: String,}
      }
    ]
    

  },
  {
    versionKey: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);


// Parola hash
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (err) { next(err); }
});

// Parola doğrulama (async)
userSchema.methods.validPassword = function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.set('toObject', { virtuals: true });
userSchema.set('toJSON',   { virtuals: true });

userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
