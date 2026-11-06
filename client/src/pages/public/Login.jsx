import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiBriefcase, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { breathe } from '../../animations';

/**
 * User Sign-In Component
 * Authenticates users, initializes session tokens/cookies,
 * and routes dynamically according to user role (Seeker, Business, Admin).
 */
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password);
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);
      if (data.user.role === 'JOB_SEEKER') navigate('/seeker/dashboard');
      else if (data.user.role === 'BUSINESS') navigate('/business/dashboard');
      else if (data.user.role === 'ADMIN') navigate('/admin');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-page d-flex align-items-center justify-content-center"
      style={{ minHeight: 'calc(100vh - 140px)', padding: '2rem 1rem', background: 'var(--wn-bg)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{ width: '100%', maxWidth: 420 }}
      >
        <div className="text-center mb-4">
          <motion.div
            className="d-inline-flex align-items-center justify-content-center mb-3"
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #0f766e, #14b8a6)',
              color: '#fff',
            }}
            animate={breathe.animate}
            transition={breathe.transition}
          >
            <FiBriefcase size={24} />
          </motion.div>
          <h2 style={{ fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>Welcome back</h2>
          <p style={{ color: 'var(--wn-text-secondary)', fontSize: '0.95rem' }}>
            Login to your WorkNear account
          </p>
        </div>

        <div
          style={{
            background: 'var(--wn-surface)',
            borderRadius: 20,
            border: '1px solid var(--wn-border)',
            boxShadow: 'var(--wn-shadow-md)',
            padding: '2rem',
          }}
        >
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: '0.875rem' }}>Email</label>
              <div className="position-relative wn-input-wrap">
                <FiMail size={16} className="wn-input-icon" />
                <input
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: 40 }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="form-label fw-semibold" style={{ fontSize: '0.875rem' }}>Password</label>
              <div className="position-relative wn-input-wrap">
                <FiLock size={16} className="wn-input-icon" />
                <input
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: 40 }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
              <div className="text-end mt-2">
                <Link to="/forgot-password" style={{ color: 'var(--wn-primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                  Forgot password?
                </Link>
              </div>
            </div>
            <motion.button
              type="submit"
              className="btn btn-primary w-100 py-2 wn-btn-morph"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              animate={{ width: '100%' }}
            >
              {loading ? (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="wn-btn-morph"
                >
                  <span className="wn-btn-spinner" /> Logging in...
                </motion.span>
              ) : (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="wn-btn-morph"
                >
                  Login <FiArrowRight />
                </motion.span>
              )}
            </motion.button>
          </form>

          <p className="text-center mt-3 mb-0" style={{ fontSize: '0.875rem', color: 'var(--wn-text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--wn-primary)', fontWeight: 600 }}>Register</Link>
          </p>
        </div>

        <div
          className="mt-4 p-3"
          style={{
            background: 'var(--wn-surface)',
            borderRadius: 12,
            border: '1px solid var(--wn-border)',
            fontSize: '0.8rem',
            color: 'var(--wn-text-muted)',
          }}
        >
          <strong style={{ color: 'var(--wn-text-secondary)' }}>Demo accounts</strong>
          <div className="mt-1">Seeker: rahul@example.com / password123</div>
          <div>Business: abc@cafe.com / password123</div>
          <div>Admin: admin@worknear.com / admin123</div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
