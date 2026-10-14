const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    masterPasswordHash: {
      type: String,
      required: [true, 'Master password hash is required']
    },
    role: {
      type: String,
      enum: {
        values: ['employee', 'admin'],
        message: '{VALUE} is not a valid role'
      },
      default: 'employee'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Method to verify master password using bcrypt
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.masterPasswordHash);
};

// Static method to hash password with salt
userSchema.statics.hashPassword = async function (plaintextPassword) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plaintextPassword, salt);
};

// Clean sensitive fields when serialized to JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.masterPasswordHash;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
