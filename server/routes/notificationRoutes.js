const express = require('express');
const router = express.Router();
const {
  getNotifications,
  readNotification,
  readAllNotifications,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get user's notifications
router.get('/', getNotifications);

// Mark all notifications as read — must be before /:id to avoid being shadowed
router.put('/read-all', readAllNotifications);

// Mark specific notification as read
router.put('/:id', readNotification);


module.exports = router;
