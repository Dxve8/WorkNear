/**
 * Job Controller
 * Handles CRUD operations for job listings, multi-parameter search & geospatial
 * filtering, automatic deadline expiry handling, and smart algorithmic recommendations.
 */

const { validationResult } = require('express-validator');
const Job = require('../models/Job');
const Business = require('../models/Business');
const WorkerProfile = require('../models/WorkerProfile');
const User = require('../models/User');
const { calculateMatch } = require('../services/matchingService');
const { autoCloseExpiredJobs } = require('../utils/jobUtils');

// ============================================================================
// Business Owner Operations
// ============================================================================

/**
 * @desc    Create a new job posting for the authenticated business
 * @route   POST /api/jobs
 * @access  Private (BUSINESS)
 */
const createJob = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const business = await Business.findOne({ userId: req.user.id });
    if (!business) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your business profile first',
      });
    }

    const {
      title,
      description,
      category,
      skills,
      salaryMin,
      salaryMax,
      jobType,
      experienceRequired,
      workingHours,
      location,
      urgent,
      deadline,
    } = req.body;

    if (!title || !description || !category || salaryMin == null || salaryMax == null || !jobType) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, category, salary range and job type are required',
      });
    }

    const job = await Job.create({
      businessId: business._id,
      title,
      description,
      category,
      skills: skills || [],
      salaryMin,
      salaryMax,
      jobType,
      experienceRequired: experienceRequired || 0,
      workingHours: workingHours || { from: '', to: '', days: [] },
      location: location || business.location,
      urgent: urgent || false,
      deadline: deadline || null,
      status: 'ACTIVE',
    });

    const populated = await Job.findById(job._id).populate({
      path: 'businessId',
      select: 'businessName category verified location businessImage',
    });

    res.status(201).json({ success: true, job: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing job posting (only by owner business)
 * @route   PUT /api/jobs/:id
 * @access  Private (BUSINESS - owner)
 */
const updateJob = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const business = await Business.findOne({ userId: req.user.id });
    if (!business || job.businessId.toString() !== business._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this job' });
    }

    const allowed = [
      'title',
      'description',
      'category',
      'skills',
      'salaryMin',
      'salaryMax',
      'jobType',
      'experienceRequired',
      'workingHours',
      'location',
      'urgent',
      'deadline',
      'status',
    ];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        job[field] = req.body[field];
      }
    });

    await job.save();

    const populated = await Job.findById(job._id).populate({
      path: 'businessId',
      select: 'businessName category verified businessImage',
    });

    res.json({ success: true, job: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Close / soft-delete a job listing
 * @route   DELETE /api/jobs/:id
 * @access  Private (BUSINESS - owner / ADMIN)
 */
const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const business = await Business.findOne({ userId: req.user.id });
    const isOwner = business && job.businessId.toString() === business._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to close this job' });
    }

    job.status = 'CLOSED';
    await job.save();

    res.json({ success: true, message: 'Job closed successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all jobs posted by the logged-in business
 * @route   GET /api/jobs/my
 * @access  Private (BUSINESS)
 */
const getMyJobs = async (req, res, next) => {
  try {
    await autoCloseExpiredJobs();

    const business = await Business.findOne({ userId: req.user.id });
    if (!business) {
      return res.json({ success: true, jobs: [] });
    }

    const jobs = await Job.find({ businessId: business._id })
      .sort({ createdAt: -1 })
      .populate({ path: 'businessId', select: 'businessName businessImage' });

    res.json({ success: true, jobs });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Public Search & Retrieval
// ============================================================================

/**
 * @desc    Query and filter active jobs with keyword, category, salary, and geo radius
 * @route   GET /api/jobs
 * @access  Public
 */
const getJobs = async (req, res, next) => {
  try {
    await autoCloseExpiredJobs();

    const {
      search,
      category,
      jobType,
      urgent,
      minSalary,
      maxSalary,
      distance,
      lat,
      lng,
      status = 'ACTIVE',
      sort = 'newest',
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (jobType) query.jobType = jobType;
    if (urgent === 'true') query.urgent = true;
    if (minSalary) query.salaryMax = { $gte: Number(minSalary) };
    if (maxSalary) query.salaryMin = { $lte: Number(maxSalary) };

    // Geospatial search: 2dsphere within distance (km)
    if (distance && lat && lng) {
      const radiusInRadians = Number(distance) / 6378.1;
      query.location = {
        $geoWithin: {
          $centerSphere: [[Number(lng), Number(lat)], radiusInRadians],
        },
      };
    }

    // Text search on title, description, and required skills
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skills: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'salary_high') sortOption = { salaryMax: -1 };
    if (sort === 'salary_low') sortOption = { salaryMin: 1 };
    if (sort === 'urgent') sortOption = { urgent: -1, createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const jobs = await Job.find(query)
      .populate({
        path: 'businessId',
        select: 'businessName category verified location businessImage',
      })
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    const total = await Job.countDocuments(query);

    res.json({
      success: true,
      count: jobs.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      jobs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed job specification by ID
 * @route   GET /api/jobs/:id
 * @access  Public
 */
const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate({
      path: 'businessId',
      select: 'businessName category verified location description phone businessImage',
      populate: { path: 'userId', select: 'name email' },
    });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    res.json({ success: true, job });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Seeker Recommendations & Matching
// ============================================================================

/**
 * @desc    Compute personalized match scores for the authenticated seeker
 * @route   GET /api/jobs/recommended
 * @access  Private (JOB_SEEKER)
 */
const getRecommendedJobs = async (req, res, next) => {
  try {
    await autoCloseExpiredJobs();

    const profile = await WorkerProfile.findOne({ userId: req.user.id });
    const user = await User.findById(req.user.id);
    const { page = 1, limit = 20 } = req.query;

    if (!profile) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your worker profile first',
      });
    }

    const jobs = await Job.find({ status: 'ACTIVE' }).populate({
      path: 'businessId',
      select: 'businessName category verified location businessImage',
    });

    const ranked = jobs.map((job) => {
      const match = calculateMatch(job, profile, user);
      return {
        job,
        matchScore: match.score,
        matchReasons: match.reasons,
        distance: match.distance,
      };
    });

    ranked.sort((a, b) => b.matchScore - a.matchScore);
    const filtered = ranked.filter((r) => r.matchScore >= 30);

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(skip, skip + limitNum);

    res.json({
      success: true,
      count: paginated.length,
      total: filtered.length,
      page: pageNum,
      pages: Math.ceil(filtered.length / limitNum),
      recommendations: paginated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed breakdown of matching reasons between a seeker and a job
 * @route   GET /api/jobs/:id/match
 * @access  Private (JOB_SEEKER)
 */
const getJobMatch = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      'businessId',
      'businessName category verified location businessImage'
    );
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const profile = await WorkerProfile.findOne({ userId: req.user.id });
    const user = await User.findById(req.user.id);

    if (!profile) {
      return res.status(400).json({ success: false, message: 'Complete your profile first' });
    }

    const match = calculateMatch(job, profile, user);

    res.json({
      success: true,
      job,
      matchScore: match.score,
      matchReasons: match.reasons,
      distance: match.distance,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  getMyJobs,
  getRecommendedJobs,
  getJobMatch,
};
