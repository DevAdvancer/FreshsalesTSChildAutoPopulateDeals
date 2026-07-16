const connectDB = require('./db');
const Log = require('../models/Log');

/**
 * Custom logger that logs to both console and MongoDB
 * @param {string} dealId - The associated Deal ID (optional)
 * @param {string} status - 'INFO', 'SUCCESS', 'ERROR', 'WARN'
 * @param {string} message - The log message
 * @param {object} payload - Additional JSON data
 */
const saveLog = async ({ dealId = null, status = 'INFO', message, payload = null }) => {
  // Always log to console
  if (status === 'ERROR') {
    console.error(`[${status}] ${message}`, payload || '');
  } else if (status === 'WARN') {
    console.warn(`[${status}] ${message}`, payload || '');
  } else {
    console.log(`[${status}] ${message}`, payload || '');
  }

  try {
    await connectDB(); // Ensure DB is connected
    
    // Check if connected properly to prevent buffering hang
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.warn('Skipping MongoDB log: Database not connected.');
      return;
    }

    // Save to MongoDB (fire and forget, don't throw if it fails)
    await Log.create({
      dealId,
      status,
      message,
      payload
    });
  } catch (dbError) {
    console.error('Failed to save log to MongoDB:', dbError.message);
  }
};

module.exports = {
  saveLog
};
