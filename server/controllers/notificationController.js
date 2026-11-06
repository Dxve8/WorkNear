const { validationResult } = require('express-validator');
const {
  getUserNotifications,
  markNotificationAsRead,
  markAllAsRead,
} = require('../services/notificationService');

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const { notifications, total, unreadCount } = await getUserNotifications(
      req.user.id,
      Number(limit),
      skip
    );

    res.json({
      success: true,
      unreadCount,
      total,
      count: notifications.length,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id
// @access  Private
const readNotification = async (req, res, next) => {
  try {
    // Find the notification first (without writing) to check ownership
    const Notification = require('../models/Notification');
    const existing = await Notification.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Verify ownership before any write
    if (existing.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const notification = await markNotificationAsRead(req.params.id);
    res.json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};


// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const readAllNotifications = async (req, res, next) => {
  try {
    const result = await markAllAsRead(req.user.id);

    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  readNotification,
  readAllNotifications,
};
