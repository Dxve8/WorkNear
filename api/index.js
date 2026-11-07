const app = require('../server/app');
const connectDB = require('../server/config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Failed to connect to MongoDB in serverless function:', err);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: err.message,
    });
  }
  return app(req, res);
};
