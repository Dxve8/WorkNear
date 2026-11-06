/**
 * WorkerProfile Model
 * Maintains detailed job seeker qualifications, skills taxonomy, shift availability,
 * commute radius preferences, salary expectations, and status flags.
 */

const mongoose = require('mongoose');

// ============================================================================
// Embedded Availability Sub-Schema
// ============================================================================

const availabilitySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    },
    available: {
      type: Boolean,
      default: false,
    },
    from: {
      type: String, // e.g. "09:00"
      default: '',
    },
    to: {
      type: String, // e.g. "17:00"
      default: '',
    },
  },
  { _id: false }
);

// ============================================================================
// Worker Profile Schema
// ============================================================================

const workerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    education: {
      type: String,
      default: '',
    },
    experience: {
      type: String,
      default: '',
    },
    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },
    expectedSalary: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    jobPreference: {
      type: String,
      enum: ['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT', 'ANY'],
      default: 'ANY',
    },
    availability: {
      type: [availabilitySchema],
      default: [],
    },
    preferredRadius: {
      type: Number, // Search/commute radius in kilometers
      default: 5,
      min: 1,
      max: 50,
    },
    languages: {
      type: [String],
      default: [],
    },
    resume: {
      type: String, // Document path or URL
      default: '',
    },
    bio: {
      type: String,
      default: '',
      maxlength: 500,
    },
    isStudent: {
      type: Boolean,
      default: false,
    },
    availableToday: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('WorkerProfile', workerProfileSchema);
