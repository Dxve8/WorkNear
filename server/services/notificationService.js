const Notification = require('../models/Notification');

/**
 * Create a notification for a user
 */
const createNotification = async (data) => {
  try {
    const notification = await Notification.create(data);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    // Don't throw - notifications are non-critical
  }
};

/**
 * Notify when application status changes
 */
const notifyApplicationStatusChange = async (applicationId, workerId, jobTitle, newStatus, businessName) => {
  const statusMessages = {
    APPLIED: 'Your application has been received',
    VIEWED: `${businessName} viewed your application for "${jobTitle}"`,
    SHORTLISTED: `Great! You've been shortlisted for "${jobTitle}" by ${businessName}`,
    INTERVIEW: `${businessName} wants to schedule an interview for "${jobTitle}"`,
    SELECTED: `Congratulations! You've been selected for "${jobTitle}" by ${businessName}`,
    REJECTED: `Your application for "${jobTitle}" was not selected this time`,
  };

  await createNotification({
    userId: workerId,
    type: 'APPLICATION_STATUS',
    title: `Application Status: ${newStatus}`,
    message: statusMessages[newStatus] || `Your application status has changed to ${newStatus}`,
    applicationId,
    applicationStatus: newStatus,
  });
};

/**
 * Notify when job closes
 */
const notifyJobClosed = async (jobId, applicantIds, jobTitle) => {
  const notifications = applicantIds.map((userId) => ({
    userId,
    type: 'JOB_CLOSED',
    title: 'Job Posting Closed',
    message: `The job "${jobTitle}" is no longer accepting applications`,
    jobId,
  }));

  try {
    await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Error notifying job closure:', error);
  }
};

/**
 * Notify business of new application
 */
const notifyNewApplication = async (jobId, jobTitle, applicantName, businessOwnerId) => {
  await createNotification({
    userId: businessOwnerId,
    type: 'NEW_APPLICATION',
    title: 'New Application Received',
    message: `${applicantName} applied for "${jobTitle}"`,
    jobId,
  });
};

/**
 * Get user's notifications
 */
const getUserNotifications = async (userId, limit = 20, skip = 0) => {
  const notifications = await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

  const total = await Notification.countDocuments({ userId });
  const unreadCount = await Notification.countDocuments({ userId, isRead: false });

  return {
    notifications,
    total,
    unreadCount,
  };
};

/**
 * Mark notification as read
 */
const markNotificationAsRead = async (notificationId) => {
  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  return notification;
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return result;
};

module.exports = {
  createNotification,
  notifyApplicationStatusChange,
  notifyJobClosed,
  notifyNewApplication,
  getUserNotifications,
  markNotificationAsRead,
  markAllAsRead,
};
