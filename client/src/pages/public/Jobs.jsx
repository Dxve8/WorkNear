import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import toast from 'react-hot-toast';
import {
  FiSearch,
  FiMapPin,
  FiClock,
  FiZap,
  FiArrowUpRight,
  FiSliders,
  FiX,
} from 'react-icons/fi';
import api from '../../services/api';

/**
 * Public Job Discovery Page
 * Supports keyword search, category filtering, employment type toggles,
 * browser geolocation "Near Me" radius matching, and sort controls.
 */
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const jobImage = (category = '') => {
  const key = category.toLowerCase();

  if (
    key.includes('cafe') ||
    key.includes('restaurant') ||
    key.includes('hotel')
  ) {
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80';
  }

  if (key.includes('salon')) {
    return 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80';
  }

  if (key.includes('shop') || key.includes('retail')) {
    return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80';
  }

  if (key.includes('office')) {
    return 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80';
  }

  if (key.includes('garage')) {
    return 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&w=900&q=80';
  }

  return 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=900&q=80';
};

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    jobType: '',
    urgent: '',
    sort: 'newest',
    distance: '',
    lat: '',
    lng: '',
  });

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [locating, setLocating] = useState(false);

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFilters((prev) => ({
          ...prev,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          distance: '10', // Default 10km radius
        }));
        setLocating(false);
      },
      (error) => {
        toast.error('Unable to retrieve your location. Please allow location access.');
        setLocating(false);
      }
    );
  };

  const fetchJobs = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, v);
      });

      const { data } = await api.get(`/jobs?${params.toString()}`);

      setJobs(data.jobs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [filters.lat, filters.lng, filters.distance, filters.sort, filters.category, filters.jobType, filters.urgent]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const applyFilters = (e) => {
    e.preventDefault();
    fetchJobs();
    setMobileFiltersOpen(false);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      jobType: '',
      urgent: '',
      sort: 'newest',
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.category ||
    filters.jobType ||
    filters.urgent;

  return (
    <div className="wn-jobs-page">
      <div className="wn-container wn-jobs-container">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <motion.section
          className="wn-jobs-header"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="wn-jobs-header-content">

            <div>
              <div className="wn-eyebrow">
                <span className="wn-eyebrow-dot" />
                LOCAL OPPORTUNITIES
              </div>

              <h1 className="wn-jobs-title">
                Find work
                <span> nearby.</span>
              </h1>

              <p className="wn-jobs-subtitle">
                Discover local opportunities that match your skills,
                schedule and lifestyle.
              </p>
            </div>

            <div className="wn-jobs-header-decoration">
              <div className="wn-floating-orb wn-orb-one" />
              <div className="wn-floating-orb wn-orb-two" />

              <div className="wn-location-bubble">
                <FiMapPin size={16} />
                <span>Opportunities near you</span>
              </div>
            </div>

          </div>
        </motion.section>

        {/* =====================================================
            SEARCH BAR
        ===================================================== */}

        <motion.section
          className="wn-job-search-panel"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4 }}
        >
          <form onSubmit={applyFilters}>

            <div className="wn-search-main">

              <div className="wn-search-input-wrap">
                <FiSearch className="wn-search-icon" />

                <input
                  name="search"
                  type="search"
                  placeholder="Search jobs, skills or businesses..."
                  value={filters.search}
                  onChange={handleFilterChange}
                  className="wn-search-input"
                  aria-label="Search jobs"
                />

                {filters.search && (
                  <button
                    type="button"
                    className="wn-search-clear"
                    onClick={() =>
                      setFilters({
                        ...filters,
                        search: '',
                      })
                    }
                    aria-label="Clear search"
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="wn-search-button"
              >
                <FiSearch size={17} />
                <span>Search</span>
              </button>

              <button
                type="button"
                className="wn-search-button"
                style={{ background: filters.distance ? '#10b981' : 'var(--wn-primary)' }}
                onClick={handleNearMe}
                disabled={locating}
              >
                <FiMapPin size={17} />
                <span>{locating ? 'Locating...' : (filters.distance ? 'Near You' : 'Near Me')}</span>
              </button>


              <button
                type="button"
                className={`wn-mobile-filter-button ${
                  mobileFiltersOpen ? 'active' : ''
                }`}
                onClick={() =>
                  setMobileFiltersOpen(!mobileFiltersOpen)
                }
              >
                <FiSliders size={18} />
                <span>Filters</span>

                {hasActiveFilters && (
                  <span className="wn-filter-count">
                    {[
                      filters.category,
                      filters.jobType,
                      filters.urgent,
                    ].filter(Boolean).length}
                  </span>
                )}
              </button>

            </div>

            {/* =================================================
                FILTERS
            ================================================= */}

            <div
              className={`wn-job-filters ${
                mobileFiltersOpen ? 'wn-filters-open' : ''
              }`}
            >

              <div className="wn-filter-item">
                <label htmlFor="distance">Distance</label>
                <select
                  id="distance"
                  name="distance"
                  value={filters.distance}
                  onChange={handleFilterChange}
                  disabled={!filters.lat} // Only enable if location is set
                >
                  <option value="">Anywhere</option>
                  <option value="5">Within 5 km</option>
                  <option value="10">Within 10 km</option>
                  <option value="25">Within 25 km</option>
                  <option value="50">Within 50 km</option>
                </select>
              </div>

              <div className="wn-filter-item">
                <label htmlFor="category">
                  Category
                </label>

                <select
                  id="category"
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                >
                  <option value="">All categories</option>

                  {[
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
                  ].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="wn-filter-item">
                <label htmlFor="jobType">
                  Job type
                </label>

                <select
                  id="jobType"
                  name="jobType"
                  value={filters.jobType}
                  onChange={handleFilterChange}
                >
                  <option value="">All types</option>
                  <option value="PART_TIME">
                    Part Time
                  </option>
                  <option value="FULL_TIME">
                    Full Time
                  </option>
                  <option value="INTERNSHIP">
                    Internship
                  </option>
                  <option value="DAILY_WAGE">
                    Daily Wage
                  </option>
                </select>
              </div>

              <div className="wn-filter-item">
                <label htmlFor="urgent">
                  Availability
                </label>

                <select
                  id="urgent"
                  name="urgent"
                  value={filters.urgent}
                  onChange={handleFilterChange}
                >
                  <option value="">Any opportunity</option>
                  <option value="true">
                    Urgent only
                  </option>
                </select>
              </div>

              <div className="wn-filter-actions">

                {hasActiveFilters && (
                  <button
                    type="button"
                    className="wn-clear-filters"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </button>
                )}

                <button
                  type="submit"
                  className="wn-apply-filters"
                >
                  Apply filters
                </button>

              </div>

            </div>
          </form>
        </motion.section>

        {/* =====================================================
            RESULTS HEADER
        ===================================================== */}

        {!loading && (
          <motion.div
            className="wn-results-header"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <div>
              <h2>
                {jobs.length > 0
                  ? 'Opportunities for you'
                  : 'No opportunities yet'}
              </h2>

              {jobs.length > 0 && (
                <p>
                  {jobs.length}{' '}
                  {jobs.length === 1
                    ? 'opportunity'
                    : 'opportunities'}{' '}
                  available
                </p>
              )}
            </div>

            {hasActiveFilters && (
              <div className="d-flex align-items-center gap-2 flex-wrap">
                {filters.search && (
                  <span
                    onClick={() => setFilters({ ...filters, search: '' })}
                    style={{ background: 'rgba(15, 118, 110, 0.1)', color: 'var(--wn-primary)', fontSize: '0.8rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    Search: "{filters.search}" <FiX size={14} />
                  </span>
                )}
                {filters.category && (
                  <span
                    onClick={() => setFilters({ ...filters, category: '' })}
                    style={{ background: 'rgba(15, 118, 110, 0.1)', color: 'var(--wn-primary)', fontSize: '0.8rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    Category: {filters.category} <FiX size={14} />
                  </span>
                )}
                {filters.jobType && (
                  <span
                    onClick={() => setFilters({ ...filters, jobType: '' })}
                    style={{ background: 'rgba(15, 118, 110, 0.1)', color: 'var(--wn-primary)', fontSize: '0.8rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    Type: {filters.jobType.replace('_', ' ')} <FiX size={14} />
                  </span>
                )}
                {filters.urgent === 'true' && (
                  <span
                    onClick={() => setFilters({ ...filters, urgent: '' })}
                    style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.8rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    ⚡ Urgent Only <FiX size={14} />
                  </span>
                )}
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 text-decoration-none"
                  style={{ color: 'var(--wn-text-muted)', fontSize: '0.8rem', fontWeight: 600 }}
                  onClick={clearFilters}
                >
                  Clear all
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* =====================================================
            LOADING
        ===================================================== */}

        {loading ? (
          <div className="wn-jobs-grid">

            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                className="wn-job-skeleton"
                key={i}
              >
                <div className="wn-skeleton-image" />

                <div className="wn-skeleton-content">
                  <div className="wn-skeleton-line large" />
                  <div className="wn-skeleton-line medium" />
                  <div className="wn-skeleton-line small" />

                  <div className="wn-skeleton-tags">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            ))}

          </div>
        ) : jobs.length === 0 ? (

          /* ===================================================
             EMPTY STATE
             =================================================== */

          <motion.div
            className="wn-empty-jobs p-4 p-md-5"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="wn-empty-icon">
              <FiSearch size={28} />
            </div>

            <h3>
              Nothing matched your search
            </h3>

            <p>
              Try clearing your active filters or explore one of these popular categories:
            </p>

            <div className="d-flex flex-wrap gap-2 justify-content-center my-3">
              {['Cafe', 'Restaurant', 'Shop', 'Retail', 'Salon', 'Hotel', 'Office'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilters({ ...filters, category: cat, search: '', jobType: '', urgent: '' })}
                  className="btn btn-sm"
                  style={{
                    borderRadius: 10,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    background: 'var(--wn-surface)',
                    border: '1px solid var(--wn-border)',
                    color: 'var(--wn-text-secondary)',
                    padding: '0.3rem 0.75rem',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              className="wn-empty-button mt-2"
              onClick={() => {
                clearFilters();
                setTimeout(fetchJobs, 0);
              }}
            >
              Explore all jobs
            </button>
          </motion.div>

        ) : (

          /* ===================================================
             JOB GRID
             =================================================== */

          <div className="wn-jobs-grid">

            {jobs.map((job, i) => (

              <motion.div
                key={job._id}
                className="wn-job-grid-item"
                initial={{
                  opacity: 0,
                  y: 22,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: Math.min(i * 0.045, 0.4),
                  duration: 0.4,
                }}
              >

                <Tilt
                  tiltMaxAngleX={4}
                  tiltMaxAngleY={4}
                  scale={1.015}
                  transitionSpeed={600}
                  glareEnable={false}
                >

                  <Link
                    to={`/jobs/${job._id}`}
                    className="wn-job-link"
                  >

                    <article className="wn-job-card-new">

                      {/* IMAGE */}

                      <div className="wn-job-image">

                        <img
                          src={job.businessId?.businessImage
                            ? `${API_BASE}/uploads/business/${job.businessId.businessImage}`
                            : jobImage(job.category)}
                          alt={job.businessId?.businessName || job.category || 'Local job'}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = jobImage(job.category);
                          }}
                        />

                        <div className="wn-job-image-shade" />

                        <div className="wn-job-category">
                          {job.category ||
                            'Local opportunity'}
                        </div>

                        <div className="wn-job-arrow">
                          <FiArrowUpRight size={18} />
                        </div>

                        {job.urgent && (
                          <div className="wn-job-urgent">
                            <FiZap size={12} />
                            URGENT
                          </div>
                        )}

                      </div>

                      {/* CONTENT */}

                      <div className="wn-job-content">

                        <div className="wn-job-title-row">

                          <h3>
                            {job.title}
                          </h3>

                        </div>

                        <p className="wn-job-business">

                          <span>
                            {job.businessId?.businessName}
                          </span>

                          {job.businessId?.verified && (
                            <span className="wn-verified">
                              ✓ Verified
                            </span>
                          )}

                        </p>

                        <div className="wn-job-details-row">

                          <span>
                            ₹
                            {job.salaryMin?.toLocaleString()}
                            {' – '}
                            ₹
                            {job.salaryMax?.toLocaleString()}
                          </span>

                          <span className="wn-job-type">
                            {job.jobType
                              ?.replace('_', ' ')}
                          </span>

                        </div>

                        {/* SKILLS */}

                        <div className="wn-job-skills">

                          {(job.skills || [])
                            .slice(0, 4)
                            .map((s) => (
                              <span
                                key={s}
                                className="wn-job-skill"
                              >
                                {s}
                              </span>
                            ))}

                          {(job.skills || []).length > 4 && (
                            <span className="wn-job-skill-more">
                              +{job.skills.length - 4}
                            </span>
                          )}

                        </div>

                        {/* FOOTER */}

                        <div className="wn-job-footer">

                          <span className="wn-job-location">
                            <FiMapPin size={14} />
                            {job.location?.locality || job.location?.city || job.businessId?.location?.locality || job.businessId?.location?.city || 'Local role'}
                          </span>

                          {job.workingHours?.from ? (
                            <span className="wn-job-reach">
                              <FiClock size={13} />
                              {job.workingHours.from}–{job.workingHours.to}
                            </span>
                          ) : (
                            <span className="wn-job-reach">
                              <FiClock size={13} />
                              Flexible hours
                            </span>
                          )}

                        </div>


                      </div>

                    </article>

                  </Link>

                </Tilt>

              </motion.div>

            ))}

          </div>
        )}

      </div>
    </div>
  );
};

export default Jobs;