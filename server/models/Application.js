/**
 * Application Model
 * Represents a job application submission, computing match score and rationale,
 * tracking recruitment status progression, and preventing duplicate submissions.
 */

const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    matchScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    matchReasons: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['APPLIED', 'VIEWED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'],
      default: 'APPLIED',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================================
// Compound & Unique Indexes
// ============================================================================

// Guard against duplicate applications from the same worker for the same job
applicationSchema.index({ jobId: 1, workerId: 1 }, { unique: true });
applicationSchema.index({ workerId: 1, status: 1 });
applicationSchema.index({ jobId: 1, matchScore: -1 });

module.exports = mongoose.model('Application', applicationSchema);
