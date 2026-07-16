const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('[DB] MONGO_URI is missing in environment variables');
    return;
  }

  try {
    const db = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000 // fail fast if db is unreachable
    });
    // Disable buffering globally so it fails fast rather than hanging the webhook
    mongoose.set('bufferCommands', false);
    isConnected = !!db.connections[0].readyState;
    console.log('[DB] MongoDB connected successfully');
  } catch (error) {
    console.error('[DB] MongoDB connection error:', error.message);
  }
};

module.exports = connectDB;
