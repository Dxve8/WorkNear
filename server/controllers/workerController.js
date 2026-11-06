/**
 * Worker / Seeker Profile Controller
 * Handles retrieval and updates for job seeker profiles, skills taxonomy,
 * weekly shift availability, work preferences, and privacy-safe profile lookups.
 */

const { validationResult } = require('express-validator');
const WorkerProfile = require('../models/WorkerProfile');
const User = require('../models/User');

// ============================================================================
// Seeker Self-Management
// ============================================================================

/**
 * @desc    Retrieve the authenticated worker's full profile
 * @route   GET /api/workers/profile
 * @access  Private (JOB_SEEKER)
 */
const getMyProfile = async (req, res, next) => {
  try {
    let profile = await WorkerProfile.findOne({ userId: req.user.id }).populate(
      'userId',
      'name email phone location'
    );

    if (!profile) {
      profile = await WorkerProfile.create({ userId: req.user.id });
    }

    res.json({ success: true, profile });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update worker profile attributes (skills, experience, availability, radius)
 * @route   PUT /api/workers/profile
 * @access  Private (JOB_SEEKER)
 */
const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      skills,
      education,
      experience,
      experienceYears,
      expectedSalary,
      jobPreference,
      availability,
      preferredRadius,
      languages,
      resume,
      bio,
      isStudent,
      availableToday,
      phone,
      location,
    } = req.body;

    // Sync basic phone/location to user document
    if (phone || location) {
      const userUpdates = {};
      if (phone) userUpdates.phone = phone;
      if (location) userUpdates.location = location;
      await User.findByIdAndUpdate(req.user.id, userUpdates);
    }

    let profile = await WorkerProfile.findOne({ userId: req.user.id });
    if (!profile) {
      profile = await WorkerProfile.create({ userId: req.user.id });
    }

    if (skills !== undefined) profile.skills = skills;
    if (education !== undefined) profile.education = education;
    if (experience !== undefined) profile.experience = experience;
    if (experienceYears !== undefined) profile.experienceYears = experienceYears;
    if (expectedSalary !== undefined) profile.expectedSalary = expectedSalary;
    if (jobPreference !== undefined) profile.jobPreference = jobPreference;
    if (availability !== undefined) profile.availability = availability;
    if (preferredRadius !== undefined) profile.preferredRadius = preferredRadius;
    if (languages !== undefined) profile.languages = languages;
    if (resume !== undefined) profile.resume = resume;
    if (bio !== undefined) profile.bio = bio;
    if (isStudent !== undefined) profile.isStudent = isStudent;
    if (availableToday !== undefined) profile.availableToday = availableToday;

    await profile.save();

    const updated = await WorkerProfile.findById(profile._id).populate(
      'userId',
      'name email phone location'
    );

    res.json({ success: true, profile: updated });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Business & Employer Lookups
// ============================================================================

/**
 * @desc    Fetch public/safe worker profile details for employer review
 * @route   GET /api/workers/:id
 * @access  Private
 */
const getWorkerById = async (req, res, next) => {
  try {
    const profile = await WorkerProfile.findOne({ userId: req.params.id }).populate(
      'userId',
      'name email phone location isActive'
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Worker profile not found' });
    }

    // Mask exact coordinates for privacy protection
    const safeProfile = profile.toObject();
    if (safeProfile.userId?.location) {
      safeProfile.userId.location.coordinates = undefined;
    }

    res.json({ success: true, profile: safeProfile });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProfile,
  updateProfile,
  getWorkerById,
};
