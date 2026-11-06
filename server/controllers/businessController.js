/**
 * Business Controller
 * Manages business company profiles, location coordinates, business logos/photos,
 * profile completion verification scoring, and employer settings.
 */

const path = require('path');
const fs = require('fs');
const { validationResult } = require('express-validator');
const Business = require('../models/Business');
const User = require('../models/User');

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Checks if a business profile satisfies all requirements for automatic verification.
 * Requires: name, category, descriptive bio (>=10 chars), phone, valid Geo coordinates, and an avatar/photo.
 * @param {Object} business - Business Mongoose document
 * @returns {boolean} True if profile is 100% complete
 */
const evaluateAutoVerification = (business) => {
  const hasName = Boolean(business.businessName);
  const hasCat = Boolean(business.category);
  const hasDesc = Boolean(business.description && business.description.length >= 10);
  const hasPhone = Boolean(business.phone);
  const hasLocation = Boolean(
    business.location?.coordinates &&
    (business.location.coordinates[0] !== 0 || business.location.coordinates[1] !== 0)
  );
  const hasImage = Boolean(business.businessImage);

  return hasName && hasCat && hasDesc && hasPhone && hasLocation && hasImage;
};

// ============================================================================
// Business Profile Handlers
// ============================================================================

/**
 * @desc    Create or update business profile details
 * @route   POST /api/business
 * @access  Private (BUSINESS)
 */
const createOrUpdateBusiness = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { businessName, category, description, location, phone } = req.body;

    if (!businessName || !category) {
      return res.status(400).json({
        success: false,
        message: 'Business name and category are required',
      });
    }

    let business = await Business.findOne({ userId: req.user.id });
    const wasNew = !business;

    if (business) {
      business.businessName = businessName || business.businessName;
      business.category = category || business.category;
      if (description !== undefined) business.description = description;
      if (location) business.location = location;
      if (phone) business.phone = phone;
      await business.save();
    } else {
      business = await Business.create({
        userId: req.user.id,
        businessName,
        category,
        description: description || '',
        location: location || {
          type: 'Point',
          coordinates: [0, 0],
          address: '',
          city: '',
          locality: '',
        },
        phone: phone || '',
      });
    }

    // Synchronize phone and location to the primary user record
    if (phone || location) {
      const userUpdates = {};
      if (phone) userUpdates.phone = phone;
      if (location) userUpdates.location = location;
      await User.findByIdAndUpdate(req.user.id, userUpdates);
    }

    // Evaluate verification eligibility
    if (!business.verified && evaluateAutoVerification(business)) {
      business.verified = true;
      await business.save();
    }

    const populated = await Business.findById(business._id).populate('userId', 'name email phone');

    res.status(wasNew ? 201 : 200).json({
      success: true,
      business: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Retrieve profile data for the authenticated business
 * @route   GET /api/business/me
 * @access  Private (BUSINESS)
 */
const getMyBusiness = async (req, res, next) => {
  try {
    const business = await Business.findOne({ userId: req.user.id }).populate(
      'userId',
      'name email phone location'
    );

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business profile not found. Please create one.',
      });
    }

    res.json({ success: true, business });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get public business details by ID
 * @route   GET /api/business/:id
 * @access  Public
 */
const getBusinessById = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id).populate('userId', 'name email');

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    res.json({ success: true, business });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Media Uploads & Assets
// ============================================================================

/**
 * @desc    Upload business avatar / workspace image
 * @route   POST /api/business/upload-image
 * @access  Private (BUSINESS)
 */
const uploadBusinessImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const business = await Business.findOne({ userId: req.user.id });
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business profile not found' });
    }

    // Clean up previous image from disk if one exists
    if (business.businessImage) {
      const oldPath = path.join(__dirname, '..', 'uploads', 'business', business.businessImage);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    business.businessImage = req.file.filename;

    if (!business.verified && evaluateAutoVerification(business)) {
      business.verified = true;
    }

    await business.save();

    res.json({
      success: true,
      message: business.verified
        ? 'Image uploaded! Your business is now verified ✓'
        : 'Image uploaded successfully',
      imageUrl: `/uploads/business/${req.file.filename}`,
      verified: business.verified,
      business,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete the business profile image
 * @route   DELETE /api/business/image
 * @access  Private (BUSINESS)
 */
const deleteBusinessImage = async (req, res, next) => {
  try {
    const business = await Business.findOne({ userId: req.user.id });
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business profile not found' });
    }

    if (business.businessImage) {
      const oldPath = path.join(__dirname, '..', 'uploads', 'business', business.businessImage);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
      business.businessImage = '';
      await business.save();
    }

    res.json({
      success: true,
      message: 'Profile photo removed successfully',
      business,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrUpdateBusiness,
  getMyBusiness,
  getBusinessById,
  uploadBusinessImage,
  deleteBusinessImage,
};
