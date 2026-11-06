/**
 * Admin Controller
 * Provides administrative oversight, platform analytics, moderation capabilities,
 * user suspension/reactivation, business verification, and skills demand tracking.
 */

const User = require('../models/User');
const Business = require('../models/Business');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Report = require('../models/Report');

// ============================================================================
// Platform Analytics & Statistics
// ============================================================================

/**
 * @desc    Aggregate high-level platform statistics for the admin overview
 * @route   GET /api/admin/stats
 * @access  Private (ADMIN)
 */
const getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalSeekers,
      totalBusinesses,
      activeJobs,
      totalApplications,
      selectedApplications,
      pendingReports,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'JOB_SEEKER' }),
      Business.countDocuments(),
      Job.countDocuments({ status: 'ACTIVE' }),
      Application.countDocuments(),
      Application.countDocuments({ status: 'SELECTED' }),
      Report.countDocuments({ status: 'PENDING' }),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalSeekers,
        totalBusinesses,
        activeJobs,
        totalApplications,
        successfulHires: selectedApplications,
        pendingReports,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Aggregate market skill demand and popular job categories
 * @route   GET /api/admin/skills-demand
 * @access  Private (ADMIN)
 */
const getSkillsDemand = async (req, res, next) => {
  try {
    const jobs = await Job.find({ status: 'ACTIVE' }).select('skills category');

    const skillCount = {};
    const categoryCount = {};

    jobs.forEach((job) => {
      (job.skills || []).forEach((skill) => {
        const s = skill.trim().toLowerCase();
        if (s) skillCount[s] = (skillCount[s] || 0) + 1;
      });
      if (job.category) {
        categoryCount[job.category] = (categoryCount[job.category] || 0) + 1;
      }
    });

    const topSkills = Object.entries(skillCount)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const topCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      topSkills,
      topCategories,
      totalActiveJobs: jobs.length,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// User & Business Moderation
// ============================================================================

/**
 * @desc    Fetch recent registered users with role and status details
 * @route   GET /api/admin/users
 * @access  Private (ADMIN)
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Suspend or reactivate a user account with audit reason
 * @route   PUT /api/admin/users/:id/suspend
 * @access  Private (ADMIN)
 */
const toggleSuspendUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'ADMIN') {
      return res.status(400).json({ success: false, message: 'Cannot suspend admin accounts' });
    }

    user.isSuspended = !user.isSuspended;
    if (user.isSuspended) {
      user.suspensionReason = req.body?.reason?.trim() || 'Suspended by administrator';
    } else {
      user.suspensionReason = '';
    }
    await user.save();

    res.json({
      success: true,
      message: user.isSuspended ? 'User suspended' : 'User activated',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isSuspended: user.isSuspended,
        suspensionReason: user.suspensionReason,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Retrieve all registered businesses with owner user state
 * @route   GET /api/admin/businesses
 * @access  Private (ADMIN)
 */
const getBusinesses = async (req, res, next) => {
  try {
    const businesses = await Business.find()
      .populate('userId', 'name email isSuspended')
      .sort({ createdAt: -1 });

    res.json({ success: true, businesses });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle manual verified badge for a business profile
 * @route   PUT /api/admin/businesses/:id/verify
 * @access  Private (ADMIN)
 */
const verifyBusiness = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    business.verified = !business.verified;
    await business.save();

    res.json({
      success: true,
      message: business.verified ? 'Business verified' : 'Verification removed',
      business,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Job Listing Moderation & Flag Reports
// ============================================================================

/**
 * @desc    Retrieve all job listings for admin moderation
 * @route   GET /api/admin/jobs
 * @access  Private (ADMIN)
 */
const getAllJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find()
      .populate({ path: 'businessId', select: 'businessName category verified' })
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ success: true, jobs });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Force close an active job listing due to policy violations
 * @route   PUT /api/admin/jobs/:id/close
 * @access  Private (ADMIN)
 */
const closeJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    job.status = 'CLOSED';
    await job.save();

    res.json({ success: true, message: 'Job closed by admin', job });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Retrieve user-submitted reports regarding jobs or suspicious activity
 * @route   GET /api/admin/reports
 * @access  Private (ADMIN)
 */
const getReports = async (req, res, next) => {
  try {
    const reports = await Report.find()
      .populate('reportedBy', 'name email')
      .populate('jobId', 'title')
      .sort({ createdAt: -1 });

    res.json({ success: true, reports });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update status or resolution notes on an incident report
 * @route   PUT /api/admin/reports/:id
 * @access  Private (ADMIN)
 */
const updateReport = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (status) report.status = status;
    if (adminNotes !== undefined) report.adminNotes = adminNotes;
    await report.save();

    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getUsers,
  toggleSuspendUser,
  getBusinesses,
  verifyBusiness,
  getAllJobs,
  closeJob,
  getReports,
  updateReport,
  getSkillsDemand,
};
