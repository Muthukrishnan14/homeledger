const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['added', 'edited', 'deleted'],
    required: true
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  subCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  previousAmount: {
    type: Number,
    default: null
  },
  date: {
    type: Date,
    required: true
  },
  note: {
    type: String,
    default: ''
  }
}, { timestamps: true });

activityLogSchema.index({ date: 1, createdAt: -1 });
activityLogSchema.index({ subCategoryId: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
