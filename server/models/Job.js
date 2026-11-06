/**
 * Job Model
 * Represents hyper-local employment listings, salary ranges, shift timings,
 * geospatial job locations, and lifecycle statuses.
 */

const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: true,
      maxlength: 3000,
    },
    category: {
      type: String,
      required: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    salaryMin: {
      type: Number,
      required: true,
      min: 0,
    },
    salaryMax: {
      type: Number,
      required: true,
      min: 0,
    },
    jobType: {
      type: String,
      enum: ['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT', 'DAILY_WAGE'],
      required: true,
    },
    experienceRequired: {
      type: Number, // Years of experience required
      default: 0,
      min: 0,
    },
    workingHours: {
      from: { type: String, default: '' }, // e.g. "09:00"
      to: { type: String, default: '' },   // e.g. "17:00"
      days: {
        type: [String],
        default: [],
      },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude] in WGS84 GeoJSON format
        default: [0, 0],
      },
      address: {
        type: String,
        default: '',
      },
      locality: {
        type: String,
        default: '',
      },
      city: {
        type: String,
        default: '',
      },
    },
    urgent: {
      type: Boolean,
      default: false,
    },
    deadline: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'CLOSED', 'EXPIRED'],
      default: 'ACTIVE',
    },
    applicantsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================================
// Geospatial & Query Indexes
// ============================================================================
jobSchema.index({ location: '2dsphere' });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ skills: 1 });
jobSchema.index({ urgent: 1 });

module.exports = mongoose.model('Job', jobSchema);
