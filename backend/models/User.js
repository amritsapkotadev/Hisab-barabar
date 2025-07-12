const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: {
    type: String,
    required: function () {
      return !this.googleId;
    }
  },
  fcmToken: { type: String, unique: true, sparse: true }, 
  googleId: { type: String, unique: true, sparse: true },
  picture: { type: String },
  budget: {
    type: Number,
    default: 0,
    min: 0
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
