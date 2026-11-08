const path = require('path');

// Load env vars — Vercel injects them automatically; this is for local `vercel dev`
if (!process.env.MONGODB_URI) {
  require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
}

const connectDB = require('../server/config/db');
const app = require('../server/app');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed: ' + err.message,
    });
  }
  return app(req, res);
};
