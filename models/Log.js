const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },
  dealId: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    enum: ['INFO', 'SUCCESS', 'ERROR', 'WARN'],
    default: 'INFO'
  },
  message: {
    type: String,
    required: true,
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
  }
});

const Log = mongoose.models.Log || mongoose.model('Log', logSchema);

module.exports = Log;
