/**
 * Application Controller
 * Manages the job application lifecycle: submission with automatic match scoring,
 * applicant pipeline management for employers, and status updates with automated notifications.
 */

const Application = require('../models/Application');
const Job = require('../models/Job');
const Business = require('../models/Business');
const WorkerProfile = require('../models/WorkerProfile');
const User = require('../models/User');
const { calculateMatch } = require('../services/matchingService');
const { isJobExpired } = require('../utils/jobUtils');
const { notifyApplicationStatusChange, notifyNewApplication } = require('../services/notificationService');

// ============================================================================
// Seeker Application Submissions
// ============================================================================

/**
 * @desc    Submit an application for a specified job
 * @route   POST /api/jobs/:id/apply
 * @access  Private (JOB_SEEKER)
 */
const applyToJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job || job.status !== 'ACTIVE') {
      return res.status(404).json({ success: false, message: 'Job not found or not active' });
    }

    // Verify application deadline
    if (isJobExpired(job)) {
      return res.status(410).json({
        success: false,
        message: 'Job posting has expired. No longer accepting applications.',
      });
    }

    // Guard against duplicate applications
    const existing = await Application.findOne({
      jobId: job._id,
      workerId: req.user.id,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this job',
      });
    }

    const profile = await WorkerProfile.findOne({ userId: req.user.id });
    const user = await User.findById(req.user.id);

    if (!profile) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile before applying',
      });
    }

    // Calculate match score & reasons at the exact moment of application
    const match = calculateMatch(job, profile, user);

    const application = await Application.create({
      jobId: job._id,
      workerId: req.user.id,
      matchScore: match.score,
      matchReasons: match.reasons,
      status: 'APPLIED',
    });

    // Update aggregate job applicant counter
    job.applicantsCount = (job.applicantsCount || 0) + 1;
    await job.save();

    const populated = await Application.findById(application._id)
      .populate({
        path: 'jobId',
        select: 'title salaryMin salaryMax jobType location urgent',
        populate: { path: 'businessId', select: 'businessName' },
      })
      .populate('workerId', 'name email');

    // Notify the employer
    try {
      const business = await Business.findById(job.businessId);
      if (business?.userId) {
        await notifyNewApplication(job._id, job.title, user.name, business.userId);
      }
    } catch (notifyErr) {
      console.error('[applyToJob] Non-critical notification dispatch error:', notifyErr.message);
    }

    res.status(201).json({ success: true, application: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fetch all applications submitted by the logged-in seeker
 * @route   GET /api/applications/my
 * @access  Private (JOB_SEEKER)
 */
const getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ workerId: req.user.id })
      .populate({
        path: 'jobId',
        select: 'title salaryMin salaryMax jobType location urgent status category',
        populate: { path: 'businessId', select: 'businessName category verified' },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, applications });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Business Applicant Pipeline
// ============================================================================

/**
 * @desc    Retrieve all applicants for a specific job posting
 * @route   GET /api/jobs/:id/applicants
 * @access  Private (BUSINESS - owner of job / ADMIN)
 */
const getJobApplicants = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const business = await Business.findOne({ userId: req.user.id });
    const isOwner = business && job.businessId.toString() === business._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view applicants' });
    }

    const applications = await Application.find({ jobId: job._id })
      .populate('workerId', 'name email phone location')
      .sort({ matchScore: -1, createdAt: -1 });

    // Attach worker companion profile data
    const withProfiles = await Promise.all(
      applications.map(async (app) => {
        const profile = await WorkerProfile.findOne({ userId: app.workerId._id });
        return {
          ...app.toObject(),
          workerProfile: profile,
        };
      })
    );

    res.json({ success: true, applicants: withProfiles });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update applicant review stage (VIEWED, SHORTLISTED, INTERVIEW, SELECTED, REJECTED)
 * @route   PUT /api/applications/:id/status
 * @access  Private (BUSINESS - owner / ADMIN)
 */
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['VIEWED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const application = await Application.findById(req.params.id).populate('jobId');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const business = await Business.findOne({ userId: req.user.id });
    const isOwner = business && application.jobId.businessId.toString() === business._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this application' });
    }

    application.status = status;
    await application.save();

    const populated = await Application.findById(application._id)
      .populate('workerId', 'name email')
      .populate({
        path: 'jobId',
        select: 'title',
        populate: { path: 'businessId', select: 'businessName' },
      });

    // Notify the candidate of the updated status
    const jobTitle = application.jobId.title;
    const businessName = populated?.jobId?.businessId?.businessName || 'A business';
    await notifyApplicationStatusChange(
      application._id,
      application.workerId,
      jobTitle,
      status,
      businessName
    );

    res.json({ success: true, application: populated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyToJob,
  getMyApplications,
  getJobApplicants,
  updateApplicationStatus,
};
