const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const Report = require("../models/Report");
const { protect } = require("../middleware/auth");

// @desc    Submit a job report
// @route   POST /api/reports
// @access  Private (any logged-in user)
router.post(
  "/",
  protect,
  [
    body("jobId").notEmpty().withMessage("jobId is required"),
    body("reason").trim().isLength({ min: 5, max: 500 }).withMessage("Reason must be 5-500 characters"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { jobId, reason } = req.body;

      // Prevent duplicate reports from same user for the same job
      const existing = await Report.findOne({ reportedBy: req.user.id, jobId });
      if (existing) {
        return res.status(409).json({ success: false, message: "You have already reported this job" });
      }

      const report = await Report.create({
        reportedBy: req.user.id,
        jobId,
        reason,
        status: "PENDING",
      });

      res.status(201).json({ success: true, report });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
