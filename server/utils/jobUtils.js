const Job = require('../models/Job');

/**
 * Auto-close jobs that have passed their deadline
 * Call this before fetching jobs to ensure data consistency
 */
const autoCloseExpiredJobs = async () => {
  try {
    const now = new Date();
    
    // Find and close jobs with passed deadline
    const result = await Job.updateMany(
      {
        deadline: { $lt: now },
        status: 'ACTIVE'
      },
      {
        status: 'CLOSED',
        closedAt: now
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[Job Utils] Auto-closed ${result.modifiedCount} expired jobs`);
    }

    return result;
  } catch (error) {
    console.error('[Job Utils] Error auto-closing jobs:', error);
    // Don't throw - this is a background operation
  }
};

/**
 * Check if a single job is expired and return its status
 */
const isJobExpired = (job) => {
  if (!job.deadline) return false;
  return new Date() > new Date(job.deadline);
};

/**
 * Get the status of a job considering deadline
 */
const getJobEffectiveStatus = (job) => {
  if (job.status === 'CLOSED') return 'CLOSED';
  if (isJobExpired(job)) return 'EXPIRED';
  return job.status;
};

module.exports = {
  autoCloseExpiredJobs,
  isJobExpired,
  getJobEffectiveStatus,
};
