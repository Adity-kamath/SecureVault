const mongoose = require('mongoose');

const credentialSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Credential owner is required'],
      index: true // Explicit index on ownerId
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    username: {
      type: String,
      required: [true, 'Username or account identifier is required'],
      trim: true
    },
    url: {
      type: String,
      trim: true,
      default: ''
    },
    encryptedPassword: {
      type: String,
      required: [true, 'Encrypted password is required']
    },
    iv: {
      type: String,
      required: [true, 'Initialization vector (IV) is required']
    },
    authTag: {
      type: String,
      required: [true, 'Authentication tag is required']
    },
    strengthScore: {
      type: Number,
      min: 0,
      max: 4,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast lookup
credentialSchema.index({ ownerId: 1, title: 1 });

// Redact raw encryption parameters by default in JSON serialization
credentialSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.encryptedPassword;
  delete obj.iv;
  delete obj.authTag;
  delete obj.__v;
  return obj;
};

const Credential = mongoose.model('Credential', credentialSchema);

module.exports = Credential;
