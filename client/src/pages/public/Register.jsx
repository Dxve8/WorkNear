import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiUser,
  FiMail,
  FiLock,
  FiPhone,
  FiBriefcase,
  FiArrowRight,
  FiCheckCircle,
  FiMapPin,
  FiUsers,
  FiUserPlus,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { breathe } from '../../animations';

/**
 * User Registration Component
 * Handles dual-role account onboarding (Job Seeker vs Business Employer)
 * with inline validation and role-specific redirection.
 */
const Register = () => {
  const [role, setRole] = useState('JOB_SEEKER');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await register({
        ...form,
        role,
      });

      toast.success('Account created successfully!');

      if (data.user.role === 'JOB_SEEKER') {
        navigate('/seeker/profile');
      } else {
        navigate('/business/profile');
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Registration failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-page d-flex align-items-center justify-content-center"
      style={{
        minHeight: 'calc(100vh - 140px)',
        padding: '2.5rem 1rem',
        background: 'var(--wn-bg)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{ width: '100%', maxWidth: 500 }}
      >
        {/* Header Branding & Icon */}
        <div className="text-center mb-4">
          <motion.div
            className="d-inline-flex align-items-center justify-content-center mb-3"
            style={{
              width: 54,
              height: 54,
              borderRadius: 15,
              background: 'linear-gradient(135deg, #0f766e, #14b8a6)',
              color: '#fff',
              boxShadow: '0 8px 20px rgba(15, 118, 110, 0.25)',
            }}
            animate={breathe.animate}
            transition={breathe.transition}
          >
            <FiUserPlus size={24} />
          </motion.div>

          <span
            className="d-block text-uppercase fw-bold mb-1"
            style={{
              fontSize: '0.72rem',
              letterSpacing: '0.12em',
              color: 'var(--wn-primary)',
            }}
          >
            Get Started
          </span>
          <h2 style={{ fontWeight: 850, letterSpacing: '-0.03em', marginBottom: 6 }}>
            Create your account
          </h2>
          <p style={{ color: 'var(--wn-text-secondary)', fontSize: '0.92rem', margin: 0 }}>
            Join WorkNear to discover opportunities or hire local talent
          </p>
        </div>

        {/* Card Form */}
        <div
          style={{
            background: 'var(--wn-surface)',
            borderRadius: 20,
            border: '1px solid var(--wn-border)',
            boxShadow: 'var(--wn-shadow-md)',
            padding: 'clamp(1.4rem, 4vw, 2.2rem)',
          }}
        >
          {/* Account Role Selector */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-semibold" style={{ fontSize: '0.875rem', color: 'var(--wn-text)' }}>
                I want to...
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--wn-text-muted)' }}>
                Select account type
              </span>
            </div>

            <div
              className="d-grid gap-2"
              style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              }}
            >
              {/* Job Seeker Option */}
              <button
                type="button"
                className="btn text-start p-3 d-flex align-items-center justify-content-between"
                style={{
                  borderRadius: 14,
                  border:
                    role === 'JOB_SEEKER'
                      ? '2px solid var(--wn-primary)'
                      : '1px solid var(--wn-border)',
                  background:
                    role === 'JOB_SEEKER'
                      ? 'rgba(15, 118, 110, 0.08)'
                      : 'var(--wn-bg)',
                  color: 'var(--wn-text)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => setRole('JOB_SEEKER')}
              >
                <div className="d-flex align-items-center gap-2">
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background:
                        role === 'JOB_SEEKER' ? 'var(--wn-primary)' : 'var(--wn-surface)',
                      color: role === 'JOB_SEEKER' ? '#fff' : 'var(--wn-primary)',
                      display: 'grid',
                      placeItems: 'center',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                      flexShrink: 0,
                    }}
                  >
                    <FiUser size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 750, fontSize: '0.9rem', lineHeight: 1.2 }}>
                      Find a job
                    </div>
                    <small style={{ color: 'var(--wn-text-secondary)', fontSize: '0.75rem' }}>
                      Looking for work
                    </small>
                  </div>
                </div>
                {role === 'JOB_SEEKER' && (
                  <FiCheckCircle size={18} style={{ color: 'var(--wn-primary)', flexShrink: 0 }} />
                )}
              </button>

              {/* Business Option */}
              <button
                type="button"
                className="btn text-start p-3 d-flex align-items-center justify-content-between"
                style={{
                  borderRadius: 14,
                  border:
                    role === 'BUSINESS'
                      ? '2px solid var(--wn-primary)'
                      : '1px solid var(--wn-border)',
                  background:
                    role === 'BUSINESS'
                      ? 'rgba(15, 118, 110, 0.08)'
                      : 'var(--wn-bg)',
                  color: 'var(--wn-text)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => setRole('BUSINESS')}
              >
                <div className="d-flex align-items-center gap-2">
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background:
                        role === 'BUSINESS' ? 'var(--wn-primary)' : 'var(--wn-surface)',
                      color: role === 'BUSINESS' ? '#fff' : 'var(--wn-primary)',
                      display: 'grid',
                      placeItems: 'center',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                      flexShrink: 0,
                    }}
                  >
                    <FiBriefcase size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 750, fontSize: '0.9rem', lineHeight: 1.2 }}>
                      Hire people
                    </div>
                    <small style={{ color: 'var(--wn-text-secondary)', fontSize: '0.75rem' }}>
                      Hiring locally
                    </small>
                  </div>
                </div>
                {role === 'BUSINESS' && (
                  <FiCheckCircle size={18} style={{ color: 'var(--wn-primary)', flexShrink: 0 }} />
                )}
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="mb-3">
              <label
                htmlFor="register-name"
                className="form-label fw-semibold"
                style={{ fontSize: '0.875rem' }}
              >
                {role === 'BUSINESS' ? 'Contact person name' : 'Full name'}
              </label>
              <div className="position-relative wn-input-wrap">
                <FiUser size={16} className="wn-input-icon" />
                <input
                  id="register-name"
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: 40 }}
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                  placeholder={role === 'BUSINESS' ? 'Your full name' : 'e.g. Rahul Sharma'}
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="mb-3">
              <label
                htmlFor="register-email"
                className="form-label fw-semibold"
                style={{ fontSize: '0.875rem' }}
              >
                Email address
              </label>
              <div className="position-relative wn-input-wrap">
                <FiMail size={16} className="wn-input-icon" />
                <input
                  id="register-email"
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: 40 }}
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Phone Number (Optional) */}
            <div className="mb-3">
              <label
                htmlFor="register-phone"
                className="form-label fw-semibold d-flex justify-content-between align-items-center"
                style={{ fontSize: '0.875rem' }}
              >
                <span>Phone number</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--wn-text-muted)', fontWeight: 400 }}>
                  Optional
                </span>
              </label>
              <div className="position-relative wn-input-wrap">
                <FiPhone size={16} className="wn-input-icon" />
                <input
                  id="register-phone"
                  type="tel"
                  className="form-control"
                  style={{ paddingLeft: 40 }}
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-4">
              <label
                htmlFor="register-password"
                className="form-label fw-semibold"
                style={{ fontSize: '0.875rem' }}
              >
                Password
              </label>
              <div className="position-relative wn-input-wrap">
                <FiLock size={16} className="wn-input-icon" />
                <input
                  id="register-password"
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: 40 }}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                />
              </div>
              <div className="mt-1" style={{ fontSize: '0.75rem', color: 'var(--wn-text-muted)' }}>
                Use at least 8 characters
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              className="btn btn-primary w-100 py-2 wn-btn-morph"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="wn-btn-morph"
                >
                  <span className="wn-btn-spinner" /> Creating account...
                </motion.span>
              ) : (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="wn-btn-morph"
                >
                  Create Account <FiArrowRight className="ms-1" />
                </motion.span>
              )}
            </motion.button>
          </form>

          {/* Login Link */}
          <p
            className="text-center mt-3 mb-0"
            style={{ fontSize: '0.875rem', color: 'var(--wn-text-secondary)' }}
          >
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--wn-primary)', fontWeight: 600 }}>
              Login
            </Link>
          </p>
        </div>

        {/* Trust Badges */}
        <div
          className="d-flex align-items-center justify-content-center flex-wrap gap-3 mt-4 text-center"
          style={{ fontSize: '0.8rem', color: 'var(--wn-text-muted)' }}
        >
          <span className="d-inline-flex align-items-center gap-1">
            <FiCheckCircle size={14} style={{ color: 'var(--wn-primary)' }} /> Free to join
          </span>
          <span className="d-inline-flex align-items-center gap-1">
            <FiMapPin size={14} style={{ color: 'var(--wn-primary)' }} /> Local opportunities
          </span>
          <span className="d-inline-flex align-items-center gap-1">
            <FiUsers size={14} style={{ color: 'var(--wn-primary)' }} /> Community focused
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;