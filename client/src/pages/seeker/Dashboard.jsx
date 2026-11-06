import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import { FiBriefcase, FiFileText, FiStar, FiMapPin, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

/**
 * Job Seeker Personal Dashboard
 * Summarizes application statuses, profile readiness checklist,
 * and top hyper-local job recommendations with match scores.
 */
const SeekerDashboard = () => {
  const { user, profile } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [recRes, appRes] = await Promise.all([
          api.get('/jobs/recommended').catch(() => ({ data: { recommendations: [] } })),
          api.get('/applications/my').catch(() => ({ data: { applications: [] } })),
        ]);
        setRecommendations(recRes.data.recommendations || []);
        setApplications(appRes.data.applications || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const profileComplete = profile?.skills?.length > 0 && profile?.availability?.length > 0;
  const shortlisted = applications.filter((a) => ['SHORTLISTED', 'SELECTED', 'INTERVIEW'].includes(a.status)).length;

  return (
    <div style={{ background: 'var(--wn-bg)', minHeight: '80vh' }}>
      <div className="container py-4 py-md-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4, fontSize: 'clamp(1.5rem, 3vw, 1.85rem)' }}>
            Hi, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--wn-text-secondary)', marginBottom: '1.5rem' }}>Your hyperlocal job matches</p>
        </motion.div>

        {!profileComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 p-3 d-flex flex-wrap justify-content-between align-items-center gap-2"
            style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 14 }}
          >
            <div>
              <strong style={{ color: '#92400e' }}>Complete your profile</strong>
              <p className="mb-0" style={{ fontSize: '0.85rem', color: '#a16207' }}>Add skills & availability for better matches</p>
            </div>
            <Link to="/seeker/profile" className="btn btn-sm" style={{ background: '#f59e0b', color: '#fff', fontWeight: 600, borderRadius: 8 }}>
              Complete Profile
            </Link>
          </motion.div>
        )}

        <div className="row g-3 mb-4">
          {[
            { label: 'Recommended', value: recommendations.length, icon: <FiStar />, color: '#0f766e' },
            { label: 'Applications', value: applications.length, icon: <FiFileText />, color: '#3b82f6' },
            { label: 'Shortlisted', value: shortlisted, icon: <FiBriefcase />, color: '#10b981' },
            { label: 'Radius', value: `${profile?.preferredRadius || 5} km`, icon: <FiMapPin />, color: '#f59e0b' },
          ].map((s, i) => (
            <div className="col-6 col-md-3" key={s.label}>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="stat-card"
              >
                <div style={{ color: s.color, marginBottom: 6 }}>{s.icon}</div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </motion.div>
            </div>
          ))}
        </div>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 style={{ fontWeight: 700, margin: 0 }}>Top Recommended</h4>
          <Link to="/seeker/recommended" style={{ color: 'var(--wn-primary)', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
            See all <FiArrowRight />
          </Link>
        </div>

        {loading ? (
          <div className="row g-3">
            {[1, 2, 3].map((i) => (
              <div className="col-md-6 col-lg-4" key={i}>
                <div className="skeleton" style={{ height: 160, borderRadius: 16 }} />
              </div>
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-5" style={{ background: 'var(--wn-surface)', borderRadius: 16, border: '1px solid var(--wn-border)' }}>
            <p style={{ color: 'var(--wn-text-muted)' }}>No recommendations yet. Complete your profile.</p>
            <Link to="/seeker/profile" className="btn btn-primary btn-sm">Complete Profile</Link>
          </div>
        ) : (
          <div className="row g-3">
            {recommendations.slice(0, 6).map((rec, i) => (
              <div className="col-md-6 col-lg-4" key={rec.job._id}>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.02}>
                    <Link to={`/jobs/${rec.job._id}`} className="text-decoration-none">
                      <div className="job-card h-100 p-3" style={{ background: 'var(--wn-surface)', borderRadius: 16, border: '1px solid var(--wn-border)' }}>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 style={{ fontWeight: 700, color: 'var(--wn-text)', margin: 0 }}>{rec.job.title}</h6>
                          <span
                            style={{
                              background: rec.matchScore >= 80 ? '#10b981' : rec.matchScore >= 60 ? '#0f766e' : '#94a3b8',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              padding: '0.25rem 0.55rem',
                              borderRadius: 8,
                            }}
                          >
                            {rec.matchScore}%
                          </span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--wn-text-muted)', marginBottom: 6 }}>
                          {rec.job.businessId?.businessName}
                          {rec.distance != null && ` · ${rec.distance} km`}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--wn-text-secondary)', marginBottom: 8 }}>
                          ₹{rec.job.salaryMin?.toLocaleString()}–₹{rec.job.salaryMax?.toLocaleString()}
                          {rec.job.urgent && <span style={{ color: '#dc2626', fontWeight: 700, marginLeft: 6 }}>URGENT</span>}
                        </p>
                        <div style={{ fontSize: '0.75rem', color: '#059669' }}>
                          {(rec.matchReasons || []).slice(0, 2).map((r, j) => (
                            <div key={j}>{r}</div>
                          ))}
                        </div>
                      </div>
                    </Link>
                  </Tilt>
                </motion.div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeekerDashboard;
