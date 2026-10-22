const mongoose = require('mongoose');

const sharedAccessSchema = new mongoose.Schema(
  {
    credentialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Credential',
      required: [true, 'Credential reference is required'],
      index: true
    },
    sharedWith: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient user reference is required'],
      index: true // Explicit index on sharedWith
    },
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sharer user reference is required']
    },
    permission: {
      type: String,
      enum: {
        values: ['view', 'edit'],
        message: 'Permission must be either "view" or "edit"'
      },
      default: 'view'
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

// Prevent duplicate shares for the same credential to the same user
sharedAccessSchema.index({ credentialId: 1, sharedWith: 1 }, { unique: true });

const SharedAccess = mongoose.model('SharedAccess', sharedAccessSchema);

module.exports = SharedAccess;
