import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CircularProgressbar,
  buildStyles,
} from 'react-circular-progressbar';

import {
  FiMapPin,
  FiClock,
  FiBriefcase,
  FiZap,
  FiBookmark,
  FiCheckCircle,
  FiArrowLeft,
  FiShare2,
  FiFlag,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

/**
 * Public & Seeker Job Details View
 * Presents job requirements, compensation, employer metadata,
 * algorithmic profile matching score breakdown, and application submission flow.
 */
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const jobImage = (category = '') => {
  const key = category.toLowerCase();

  if (
    key.includes('cafe') ||
    key.includes('restaurant') ||
    key.includes('hotel')
  ) {
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=85';
  }

  if (key.includes('salon')) {
    return 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1400&q=85';
  }

  if (
    key.includes('shop') ||
    key.includes('retail')
  ) {
    return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=85';
  }

  if (key.includes('office')) {
    return 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=85';
  }

  if (key.includes('garage')) {
    return 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&w=1400&q=85';
  }

  return 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=85';
};

const JobDetails = () => {
  const { id } = useParams();
  const { user, isSeeker } = useAuth();

  const [job, setJob] = useState(null);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/jobs/${id}`);
        setJob(data.job);

        if (user?.role === 'JOB_SEEKER') {
          // Check match score and whether already applied — in parallel
          const [matchRes, appsRes] = await Promise.allSettled([
            api.get(`/jobs/${id}/match`),
            api.get('/applications/my'),
          ]);

          if (matchRes.status === 'fulfilled') {
            setMatch({
              score: matchRes.value.data.matchScore,
              reasons: matchRes.value.data.matchReasons,
              distance: matchRes.value.data.distance,
            });
          }

          if (appsRes.status === 'fulfilled') {
            const apps = appsRes.value.data.applications || [];
            setAlreadyApplied(apps.some((a) => a.jobId?._id === id || a.jobId === id));
          }
        }
      } catch (err) {
        toast.error('Job not found');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, user]);

  const handleApply = async () => {
    setApplying(true);
    try {
      await api.post(`/jobs/${id}/apply`);
      toast.success('Application submitted!');
      setAlreadyApplied(true);   // flip to "Applied ✓" immediately
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        'Failed to apply'
      );
    } finally {
      setApplying(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.post('/saved', {
        jobId: id,
      });

      toast.success('Job saved!');
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        'Failed to save'
      );
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: job?.title || 'WorkNear Job',
          text: `Check out this job on WorkNear: ${job?.title}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(
          window.location.href
        );

        toast.success(
          'Job link copied!'
        );
      }
    } catch (_) {}
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) { toast.error('Please describe the reason for reporting'); return; }
    setReporting(true);
    try {
      await api.post('/reports', { jobId: id, reason: reportReason.trim() });
      toast.success('Report submitted — thank you for keeping WorkNear safe');
      setShowReportForm(false);
      setReportReason('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setReporting(false);
    }
  };



  /* =========================================================
     LOADING
     ========================================================= */

  if (loading) {
    return (
      <div className="wn-job-details-page">

        <div className="wn-container wn-job-details-container">

          <div className="wn-job-details-skeleton">

            <div className="wn-skeleton-back" />

            <div className="wn-skeleton-hero" />

            <div className="wn-job-details-skeleton-grid">

              <div>
                <div className="skeleton mb-3" style={{ height: 32, width: '65%', borderRadius: 8 }} />
                <div className="skeleton mb-4" style={{ height: 18, width: '40%', borderRadius: 8 }} />

                <div className="skeleton mb-2" style={{ height: 15, width: '100%', borderRadius: 8 }} />
                <div className="skeleton mb-2" style={{ height: 15, width: '92%', borderRadius: 8 }} />
                <div className="skeleton mb-4" style={{ height: 15, width: '78%', borderRadius: 8 }} />
              </div>

              <div className="skeleton" style={{ height: 300, borderRadius: 20 }} />

            </div>

          </div>

        </div>

      </div>
    );
  }

  /* =========================================================
     NOT FOUND
     ========================================================= */

  if (!job) {
    return (
      <div className="wn-job-details-page">

        <div className="wn-container">

          <div className="wn-job-not-found">

            <div className="wn-job-not-found-icon">
              <FiBriefcase size={26} />
            </div>

            <h3>Job not found</h3>

            <p>
              This opportunity may have been removed
              or is no longer available.
            </p>

            <Link
              to="/jobs"
              className="wn-job-primary-button"
            >
              Browse Jobs
            </Link>

          </div>

        </div>

      </div>
    );
  }

  const scoreColor =
    match?.score >= 80
      ? '#10b981'
      : match?.score >= 60
        ? '#0f766e'
        : '#94a3b8';

  return (
    <div className="wn-job-details-page">

      <div className="wn-container wn-job-details-container">

        {/* =====================================================
            BACK + SHARE + REPORT
        ===================================================== */}

        <div className="wn-job-topbar">

          <Link
            to="/jobs"
            className="wn-back-link"
          >
            <FiArrowLeft size={16} />
            <span>Back to jobs</span>
          </Link>

          <div className="d-flex align-items-center gap-2">
            <a
              className="wn-share-button"
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this job on WorkNear: ${job?.title} - ${window.location.href}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on WhatsApp"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              <span>WhatsApp</span>
            </a>

            <button
              className="wn-share-button"
              onClick={handleShare}
              aria-label="Share job"
            >
              <FiShare2 size={16} />
              <span>Copy Link</span>
            </button>

            {user && (
              <button
                className="wn-share-button"
                onClick={() => setShowReportForm((v) => !v)}
                aria-label="Report job"
                style={{ color: showReportForm ? '#dc2626' : undefined, borderColor: showReportForm ? '#fecaca' : undefined }}
              >
                <FiFlag size={16} />
                <span>Report</span>
              </button>
            )}
          </div>

        </div>

        {/* Inline report form */}
        {showReportForm && (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleReport}
            style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1rem' }}
          >
            <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', color: '#9a3412' }}>
              <FiFlag size={14} className="me-1" />Report this job listing
            </p>
            <textarea
              className="form-control mb-2"
              rows={2}
              placeholder="Describe the issue (e.g. fake listing, inappropriate content, wrong salary...)"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              style={{ fontSize: '0.875rem', borderColor: '#fdba74' }}
              required
            />
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-sm btn-danger" disabled={reporting}>
                {reporting ? 'Submitting...' : 'Submit Report'}
              </button>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowReportForm(false)}>
                Cancel
              </button>
            </div>
          </motion.form>
        )}

        {/* =====================================================
            HERO IMAGE
        ===================================================== */}

        <motion.div
          className="wn-job-detail-hero"
          initial={{
            opacity: 0,
            y: 16,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.45,
          }}
        >

          <img
            src={job.businessId?.businessImage
              ? `${API_BASE}/uploads/business/${job.businessId.businessImage}`
              : jobImage(job.category)}
            alt={job.businessId?.businessName || job.category || 'Local opportunity'}
            onError={(e) => {
              e.currentTarget.src = jobImage(job.category);
            }}
          />

          <div className="wn-job-detail-hero-overlay" />

          <div className="wn-job-detail-category">
            {job.category ||
              'Local opportunity'}
          </div>

          {job.urgent && (
            <div className="wn-job-detail-urgent">
              <FiZap size={13} />
              URGENT HIRING
            </div>
          )}

          <div className="wn-job-detail-hero-text">

            <p>
              {job.businessId?.businessName}

              {job.businessId?.verified && (
                <span className="wn-hero-verified">
                  <FiCheckCircle size={14} />
                  Verified
                </span>
              )}
            </p>

            <h1>
              {job.title}
            </h1>

          </div>

        </motion.div>

        {/* =====================================================
            MAIN CONTENT
        ===================================================== */}

        <div className="wn-job-details-layout">

          {/* ===================================================
              LEFT / MAIN
              =================================================== */}

          <main className="wn-job-details-main">

            <motion.section
              className="wn-job-detail-card wn-job-overview-card"
              initial={{
                opacity: 0,
                y: 18,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.08,
                duration: 0.4,
              }}
            >

              {/* QUICK INFORMATION */}

              <div className="wn-job-detail-info-grid">

                <div className="wn-job-info-item">
                  <span className="wn-job-info-icon salary">
                    ₹
                  </span>

                  <div>
                    <small>Salary</small>

                    <strong>
                      ₹
                      {job.salaryMin?.toLocaleString()}
                      {' – '}
                      ₹
                      {job.salaryMax?.toLocaleString()}
                    </strong>
                  </div>
                </div>

                <div className="wn-job-info-item">

                  <span className="wn-job-info-icon">
                    <FiBriefcase size={17} />
                  </span>

                  <div>
                    <small>Job type</small>

                    <strong>
                      {job.jobType
                        ?.replace('_', ' ')}
                    </strong>
                  </div>

                </div>

                {job.workingHours?.from && (
                  <div className="wn-job-info-item">

                    <span className="wn-job-info-icon">
                      <FiClock size={17} />
                    </span>

                    <div>
                      <small>Working hours</small>

                      <strong>
                        {job.workingHours.from}
                        {' – '}
                        {job.workingHours.to}
                      </strong>
                    </div>

                  </div>
                )}

                {job.location?.locality && (
                  <div className="wn-job-info-item">

                    <span className="wn-job-info-icon">
                      <FiMapPin size={17} />
                    </span>

                    <div>
                      <small>Location</small>

                      <strong>
                        {job.location.locality}
                      </strong>
                    </div>

                  </div>
                )}

              </div>

              {/* DESCRIPTION */}

              <div className="wn-job-detail-section">

                <h2>
                  About the role
                </h2>

                <p className="wn-job-description">
                  {job.description}
                </p>

              </div>

              {/* SKILLS */}

              <div className="wn-job-detail-section">

                <h2>
                  What you'll need
                </h2>

                <div className="wn-detail-skills">

                  {(job.skills || []).map(
                    (skill) => (
                      <span
                        key={skill}
                        className="wn-detail-skill"
                      >
                        {skill}
                      </span>
                    )
                  )}

                </div>

              </div>

              {/* EXPERIENCE */}

              {job.experienceRequired > 0 && (
                <div className="wn-experience-box">

                  <div className="wn-experience-icon">
                    <FiBriefcase size={18} />
                  </div>

                  <div>
                    <small>
                      Experience required
                    </small>

                    <strong>
                      {job.experienceRequired}{' '}
                      {job.experienceRequired === 1
                        ? 'year'
                        : 'years'}
                    </strong>
                  </div>

                </div>
              )}

            </motion.section>

          </main>

          {/* ===================================================
              RIGHT SIDEBAR
              =================================================== */}

          <aside className="wn-job-details-sidebar">

            {/* MATCH CARD */}

            {match && (
              <motion.section
                className="wn-job-detail-card wn-match-detail-card"
                initial={{
                  opacity: 0,
                  y: 18,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.15,
                  duration: 0.4,
                }}
              >

                <div className="wn-match-heading">

                  <div>
                    <span>
                      PERSONALIZED FOR YOU
                    </span>

                    <h2>
                      Your match
                    </h2>
                  </div>

                  <div className="wn-match-spark">
                    ✦
                  </div>

                </div>

                <div className="wn-match-circle">

                  <CircularProgressbar
                    value={match.score}
                    text={`${match.score}%`}
                    styles={buildStyles({
                      pathColor: scoreColor,
                      textColor: scoreColor,
                      trailColor: '#e2e8f0',
                      textSize: '21px',
                      pathTransitionDuration: 1,
                    })}
                  />

                </div>

                <div
                  className="wn-match-score-label"
                  style={{
                    color: scoreColor,
                  }}
                >
                  {match.score >= 80
                    ? 'Excellent match'
                    : match.score >= 60
                      ? 'Good match'
                      : 'Potential match'}
                </div>

                {match.distance != null && (
                  <div className="wn-match-distance">
                    <FiMapPin size={14} />
                    {match.distance} km away
                  </div>
                )}

                <div className="wn-match-reasons">

                  {(match.reasons || []).map(
                    (reason, index) => (
                      <div
                        key={index}
                        className={
                          reason.startsWith('✓')
                            ? 'positive'
                            : ''
                        }
                      >
                        {reason.startsWith('✓') && (
                          <FiCheckCircle size={14} />
                        )}

                        <span>
                          {reason}
                        </span>
                      </div>
                    )
                  )}

                </div>

              </motion.section>
            )}

            {/* APPLY CARD */}

            {isSeeker && (
              <motion.section
                className="wn-job-detail-card wn-apply-card"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <div className="wn-apply-heading">
                  <span className="wn-apply-dot" style={{ background: alreadyApplied ? '#10b981' : undefined }} />
                  <div>
                    <strong>{alreadyApplied ? 'Application Sent!' : 'Interested?'}</strong>
                    <small>{alreadyApplied ? 'You have already applied for this job.' : 'Take the next step.'}</small>
                  </div>
                </div>

                {alreadyApplied ? (
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: 8, padding: '0.85rem', borderRadius: 12,
                      background: '#d1fae5', color: '#065f46',
                      fontWeight: 700, fontSize: '0.95rem',
                    }}
                  >
                    <FiCheckCircle size={18} />
                    Applied ✓
                  </div>
                ) : (
                  <motion.button
                    className="wn-apply-button"
                    onClick={handleApply}
                    disabled={applying}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {applying ? 'Applying...' : 'Apply Now'}
                    {!applying && (
                      <FiArrowLeft size={17} style={{ transform: 'rotate(180deg)' }} />
                    )}
                  </motion.button>
                )}

                <button className="wn-save-button" onClick={handleSave}>
                  <FiBookmark size={16} />
                  Save Job
                </button>

              </motion.section>
            )}


            {/* LOGIN CARD */}

            {!user && (
              <motion.section
                className="wn-job-detail-card wn-login-job-card"
                initial={{
                  opacity: 0,
                  y: 18,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.15,
                  duration: 0.4,
                }}
              >

                <div className="wn-login-job-icon">
                  <FiBriefcase size={20} />
                </div>

                <h3>
                  Want this opportunity?
                </h3>

                <p>
                  Login as a job seeker to
                  apply and see your personalized
                  match score.
                </p>

                <Link
                  to="/login"
                  className="wn-login-job-button"
                >
                  Login to continue
                </Link>

              </motion.section>
            )}

          </aside>

        </div>

      </div>

      {/* =======================================================
          MOBILE STICKY APPLY BAR
          ======================================================= */}

      {isSeeker && (
        <div className="wn-mobile-apply-bar">

          <div className="wn-mobile-apply-info">

            <strong>
              ₹
              {job.salaryMin?.toLocaleString()}
              {' – '}
              ₹
              {job.salaryMax?.toLocaleString()}
            </strong>

            {match && (
              <span>
                {match.score}% match
              </span>
            )}

          </div>

          <div className="wn-mobile-apply-actions">

            <button
              className="wn-mobile-save"
              onClick={handleSave}
              aria-label="Save job"
            >
              <FiBookmark size={18} />
            </button>

            {alreadyApplied ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0.5rem 1.2rem', borderRadius: 10,
                background: '#d1fae5', color: '#065f46',
                fontWeight: 700, fontSize: '0.875rem',
              }}>
                <FiCheckCircle size={16} /> Applied ✓
              </div>
            ) : (
              <button
                className="wn-mobile-apply"
                onClick={handleApply}
                disabled={applying}
              >
                {applying ? 'Applying...' : 'Apply'}
              </button>
            )}

          </div>

        </div>
      )}

    </div>
  );
};

export default JobDetails;