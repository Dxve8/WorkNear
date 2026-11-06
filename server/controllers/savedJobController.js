const SavedJob = require('../models/SavedJob');
const Job = require('../models/Job');

// @desc    Save a job
// @route   POST /api/saved
// @access  Private (JOB_SEEKER)
const saveJob = async (req, res, next) => {
  try {
    const { jobId } = req.body;
    if (!jobId) {
      return res.status(400).json({ success: false, message: 'jobId is required' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const existing = await SavedJob.findOne({ workerId: req.user.id, jobId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Job already saved' });
    }

    const saved = await SavedJob.create({
      workerId: req.user.id,
      jobId,
    });

    res.status(201).json({ success: true, saved });
  } catch (error) {
    next(error);
  }
};

// @desc    Unsave a job
// @route   DELETE /api/saved/:jobId
// @access  Private (JOB_SEEKER)
const unsaveJob = async (req, res, next) => {
  try {
    const saved = await SavedJob.findOneAndDelete({
      workerId: req.user.id,
      jobId: req.params.jobId,
    });

    if (!saved) {
      return res.status(404).json({ success: false, message: 'Saved job not found' });
    }

    res.json({ success: true, message: 'Job removed from saved' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my saved jobs
// @route   GET /api/saved
// @access  Private (JOB_SEEKER)
const getSavedJobs = async (req, res, next) => {
  try {
    const saved = await SavedJob.find({ workerId: req.user.id })
      .populate({
        path: 'jobId',
        populate: { path: 'businessId', select: 'businessName category verified' },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, savedJobs: saved });
  } catch (error) {
    next(error);
  }
};

module.exports = { saveJob, unsaveJob, getSavedJobs };
