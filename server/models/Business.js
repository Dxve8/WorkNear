/**
 * Business Model
 * Encapsulates employer organizational profiles, category classification,
 * verified status flags, company imagery, and geospatial location coordinates.
 */

const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      maxlength: 150,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Cafe',
        'Restaurant',
        'Shop',
        'Salon',
        'Hotel',
        'Garage',
        'Clinic',
        'Tuition',
        'Retail',
        'Office',
        'Other',
      ],
    },
    description: {
      type: String,
      default: '',
      maxlength: 1000,
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
      city: {
        type: String,
        default: '',
      },
      locality: {
        type: String,
        default: '',
      },
    },
    phone: {
      type: String,
      trim: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    businessImage: {
      type: String, // Relative URL or upload file path
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================================
// Geospatial Indexing
// ============================================================================
businessSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Business', businessSchema);
