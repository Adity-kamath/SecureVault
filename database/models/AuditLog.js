const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for audit trail'],
      index: true
    },
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      enum: [
        'view',
        'create',
        'edit',
        'share',
        'revoke',
        'delete',
        'login',
        'register',
        'status_change',
        'role_change'
      ]
    },
    credentialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Credential',
      default: null,
      index: true
    },
    credentialTitle: {
      type: String,
      default: ''
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1'
    },
    details: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true // Explicit index on AuditLogs.timestamp
    }
  },
  {
    timestamps: false // timestamp field is explicitly handled
  }
);

// Compound index for querying user activities over time
auditLogSchema.index({ action: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
