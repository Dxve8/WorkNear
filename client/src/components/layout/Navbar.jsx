import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBriefcase, FiMenu, FiX, FiUser, FiLogOut, FiHome,
  FiSearch, FiBookmark, FiFileText, FiPlusCircle, FiBarChart2, FiBell, FiSettings
} from 'react-icons/fi';
import { springLogo } from '../../animations';
import api from '../../services/api';
/**
 * Navigation Bar Component
 * Displays branding, role-aware navigation links (Seeker, Business, Admin),
 * real-time notification polling, and mobile slide-out drawer menu.
 */
const Navbar = () => {
  const { user, logout, isSeeker, isBusiness, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count whenever user logs in / changes
  const fetchUnread = useCallback(async () => {
    if (!user) { setUnreadCount(0); return; }
    try {
      const { data } = await api.get('/notifications?limit=1');
      setUnreadCount(data.unreadCount || 0);
    } catch (_) {}
  }, [user]);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 60_000); // re-check every 60s
    return () => clearInterval(interval);
  }, [fetchUnread]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navLinkStyle = (path) => ({
    color: isActive(path) ? 'var(--wn-primary)' : 'var(--wn-text-secondary)',
    fontWeight: isActive(path) ? 600 : 500,
    fontSize: '0.9rem',
    textDecoration: 'none',
    padding: '0.4rem 0.75rem',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    position: 'relative',
  });

  /** Desktop nav link with a shared-layout underline that slides between active items. */
  const NavItem = ({ to, children }) => (
    <Link to={to} style={navLinkStyle(to)}>
      {children}
      {isActive(to) && (
        <motion.span
          layoutId="wn-nav-underline"
          className="wn-nav-underline"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}
    </Link>
  );

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="wn-navbar"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1050,
          background: scrolled ? 'rgba(255,255,255,0.92)' : 'var(--wn-surface)',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: `1px solid ${scrolled ? 'var(--wn-border)' : 'transparent'}`,
          boxShadow: scrolled ? 'var(--wn-shadow)' : 'none',
          transition: 'all 0.25s ease',
        }}
      >
        <div className="container d-flex align-items-center justify-content-between py-3">
          {/* Logo */}
          <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none">
            <motion.div
              className="d-flex align-items-center justify-content-center wn-logo-mark"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #0f766e, #14b8a6)',
                color: '#fff',
              }}
              whileHover={springLogo.whileHover}
              transition={springLogo.transition}
            >
              <FiBriefcase size={18} />
            </motion.div>
            <div>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--wn-text)', letterSpacing: '-0.03em' }}>
                WorkNear
              </span>
              <span className="d-none d-md-inline ms-2" style={{ fontSize: '0.7rem', color: 'var(--wn-text-muted)' }}>
                Find work nearby
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="d-none d-lg-flex align-items-center gap-1 wn-nav-links">
            <NavItem to="/jobs"><FiSearch size={15} /> Browse Jobs</NavItem>
            {isSeeker && (
              <>
                <NavItem to="/seeker/recommended">Recommended</NavItem>
                <NavItem to="/seeker/profile"><FiUser size={15} /> Profile</NavItem>
                <NavItem to="/seeker/applications"><FiFileText size={15} /> Applications</NavItem>
                <NavItem to="/seeker/saved"><FiBookmark size={15} /> Saved</NavItem>
                <NavItem to="/seeker/settings"><FiSettings size={15} /> Settings</NavItem>
              </>
            )}
            {isBusiness && (
              <>
                <NavItem to="/business/jobs">My Jobs</NavItem>
                <NavItem to="/business/profile"><FiUser size={15} /> Profile</NavItem>
                <NavItem to="/business/post-job"><FiPlusCircle size={15} /> Post Job</NavItem>
                <NavItem to="/business/settings"><FiSettings size={15} /> Settings</NavItem>
              </>
            )}
            {isAdmin && (
              <NavItem to="/admin"><FiBarChart2 size={15} /> Admin</NavItem>
            )}
          </div>

          {/* Auth area */}
          <div className="d-none d-lg-flex align-items-center gap-2">
            {user ? (
              <div className="d-flex align-items-center gap-2">
                <Link
                  to={isSeeker ? '/seeker/dashboard' : isBusiness ? '/business/dashboard' : '/admin'}
                  className="d-flex align-items-center gap-2 text-decoration-none px-3 py-2"
                  style={{
                    background: 'var(--wn-bg)',
                    borderRadius: 10,
                    border: '1px solid var(--wn-border)',
                  }}
                >
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'var(--wn-primary)',
                      color: '#fff',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--wn-text)' }}>
                    {user.name?.split(' ')[0]}
                  </span>
                </Link>
                {/* Notification bell */}
                <Link
                  to={isSeeker ? '/seeker/notifications' : '/business/notifications'}
                  aria-label={`${unreadCount} unread notifications`}
                  style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', padding: '0.4rem 0.5rem', border: '1px solid var(--wn-border)', borderRadius: 8, color: unreadCount > 0 ? 'var(--wn-primary)' : 'var(--wn-text-secondary)', background: 'transparent', textDecoration: 'none' }}
                >
                  <FiBell size={16} />
                  {unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 700, borderRadius: '50%', minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="btn btn-sm"
                  style={{
                    border: '1px solid var(--wn-border)',
                    borderRadius: 8,
                    color: 'var(--wn-text-secondary)',
                    background: 'transparent',
                  }}
                >
                  <FiLogOut size={16} />
                </motion.button>
              </div>

            ) : (
              <>
                <Link to="/login" className="btn btn-sm" style={{ color: 'var(--wn-text-secondary)', fontWeight: 600 }}>
                  Login
                </Link>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link to="/register" className="btn btn-primary btn-sm px-3">
                    Get Started
                  </Link>
                </motion.div>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <motion.button
            className="d-lg-none btn p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ border: '1px solid var(--wn-border)', borderRadius: 8 }}
            aria-label="Toggle menu"
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={mobileOpen ? 'close' : 'open'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'inline-flex' }}
              >
                {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              background: 'var(--wn-surface)',
              borderBottom: '1px solid var(--wn-border)',
              overflow: 'hidden',
            }}
            className="d-lg-none"
          >
            <div className="container py-3 d-flex flex-column gap-1">
              {[
                <Link key="jobs" to="/jobs" style={navLinkStyle('/jobs')} className="py-2">
                  <FiSearch size={16} /> Browse Jobs
                </Link>,
                ...(isSeeker ? [
                  <Link key="s-dash" to="/seeker/dashboard" style={navLinkStyle('/seeker/dashboard')} className="py-2">
                    <FiHome size={16} /> Dashboard
                  </Link>,
                  <Link key="s-rec" to="/seeker/recommended" style={navLinkStyle('/seeker/recommended')} className="py-2">
                    Recommended
                  </Link>,
                  <Link key="s-app" to="/seeker/applications" style={navLinkStyle('/seeker/applications')} className="py-2">
                    <FiFileText size={16} /> Applications
                  </Link>,
                  <Link key="s-saved" to="/seeker/saved" style={navLinkStyle('/seeker/saved')} className="py-2">
                    <FiBookmark size={16} /> Saved Jobs
                  </Link>,
                  <Link key="s-notif" to="/seeker/notifications" style={navLinkStyle('/seeker/notifications')} className="py-2">
                    <FiBell size={16} /> Notifications {unreadCount > 0 && <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 700, borderRadius: '50%', minWidth: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: 4, padding: '0 3px' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
                  </Link>,
                  <Link key="s-prof" to="/seeker/profile" style={navLinkStyle('/seeker/profile')} className="py-2">
                    <FiUser size={16} /> Profile
                  </Link>,
                  <Link key="s-set" to="/seeker/settings" style={navLinkStyle('/seeker/settings')} className="py-2">
                    <FiSettings size={16} /> Settings
                  </Link>,
                ] : []),
                ...(isBusiness ? [
                  <Link key="b-dash" to="/business/dashboard" style={navLinkStyle('/business/dashboard')} className="py-2">
                    <FiHome size={16} /> Dashboard
                  </Link>,
                  <Link key="b-jobs" to="/business/jobs" style={navLinkStyle('/business/jobs')} className="py-2">
                    <FiBriefcase size={16} /> My Jobs
                  </Link>,
                  <Link key="b-post" to="/business/post-job" style={navLinkStyle('/business/post-job')} className="py-2">
                    <FiPlusCircle size={16} /> Post Job
                  </Link>,
                  <Link key="b-notif" to="/business/notifications" style={navLinkStyle('/business/notifications')} className="py-2">
                    <FiBell size={16} /> Notifications {unreadCount > 0 && <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 700, borderRadius: '50%', minWidth: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: 4, padding: '0 3px' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
                  </Link>,
                  <Link key="b-prof" to="/business/profile" style={navLinkStyle('/business/profile')} className="py-2">
                    <FiUser size={16} /> Business Profile
                  </Link>,
                  <Link key="b-set" to="/business/settings" style={navLinkStyle('/business/settings')} className="py-2">
                    <FiSettings size={16} /> Settings
                  </Link>,
                ] : []),
                ...(isAdmin ? [
                  <Link key="admin" to="/admin" style={navLinkStyle('/admin')} className="py-2">
                    <FiBarChart2 size={16} /> Admin
                  </Link>,
                ] : []),
              ].map((el, i) => (
                <motion.div
                  key={el.key}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.05 }}
                >
                  {el}
                </motion.div>
              ))}
              <hr className="my-2" />
              {user ? (
                <button
                  onClick={handleLogout}
                  className="btn btn-outline-secondary btn-sm text-start"
                  style={{ borderRadius: 8 }}
                >
                  <FiLogOut size={15} className="me-2" /> Logout
                </button>
              ) : (
                <div className="d-flex gap-2">
                  <Link to="/login" className="btn btn-outline-secondary btn-sm flex-fill" style={{ borderRadius: 8 }}>
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-primary btn-sm flex-fill">
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
