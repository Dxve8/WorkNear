import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';

const statusStyle = {
  APPLIED: { bg: '#f1f5f9', color: '#475569' },
  VIEWED: { bg: '#e0f2fe', color: '#0369a1' },
  SHORTLISTED: { bg: '#ccfbf1', color: '#0f766e' },
  INTERVIEW: { bg: '#fef3c7', color: '#b45309' },
  SELECTED: { bg: '#d1fae5', color: '#047857' },
  REJECTED: { bg: '#fee2e2', color: '#b91c1c' },
};

const STAGES = [
  { key: 'APPLIED', label: 'Applied' },
  { key: 'VIEWED', label: 'Viewed' },
  { key: 'SHORTLISTED', label: 'Shortlisted' },
  { key: 'INTERVIEW', label: 'Interview' },
  { key: 'SELECTED', label: 'Selected' },
];

const getStageIndex = (status) => {
  if (status === 'REJECTED') return -1;
  const idx = STAGES.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
};

/**
 * Seeker Applications Tracking View
 * Renders submitted job applications, employer hiring pipeline progression,
 * algorithmic match scoring, and status alerts.
 */
const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/applications/my');
        setApplications(data.applications || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div style={{ background: 'var(--wn-bg)', minHeight: '80vh' }}>
      <div className="container py-4 py-md-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <h1 style={{ fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6, fontSize: 'clamp(1.5rem, 3vw, 1.85rem)' }}>
            My Applications
          </h1>
          <p style={{ color: 'var(--wn-text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            Track your application lifecycle and hiring progress
          </p>
        </motion.div>

        {loading ? (
          <div className="d-flex flex-column gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 140, borderRadius: 16 }} />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-5 px-3" style={{ background: 'var(--wn-surface)', borderRadius: 20, border: '1px solid var(--wn-border)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(15, 118, 110, 0.1)', color: 'var(--wn-primary)', display: 'grid', placeItems: 'center', margin: '0 auto 1rem', fontSize: '1.5rem', fontWeight: 800 }}>
              💼
            </div>
            <h5 style={{ fontWeight: 700, marginBottom: 6 }}>No applications yet</h5>
            <p style={{ color: 'var(--wn-text-muted)', maxWidth: 400, margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
              Explore nearby jobs that match your skills, availability, and location.
            </p>
            <Link to="/seeker/recommended" className="btn btn-primary px-4">
              Explore Recommended Jobs
            </Link>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {applications.map((app, i) => {
              const st = statusStyle[app.status] || statusStyle.APPLIED;
              const currentIndex = getStageIndex(app.status);
              const isRejected = app.status === 'REJECTED';

              return (
                <motion.div
                  key={app._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="p-3 p-md-4"
                  style={{
                    background: 'var(--wn-surface)',
                    borderRadius: 16,
                    border: '1px solid var(--wn-border)',
                    boxShadow: 'var(--wn-shadow-sm)',
                  }}
                >
                  <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <h5 style={{ fontWeight: 700, margin: 0, fontSize: '1.1rem' }}>
                          {app.jobId?.title || 'Job Application'}
                        </h5>
                        {app.jobId?.category && (
                          <span style={{ background: 'var(--wn-bg)', color: 'var(--wn-text-secondary)', fontSize: '0.75rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: 6 }}>
                            {app.jobId.category}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--wn-text-muted)', margin: 0 }}>
                        {app.jobId?.businessId?.businessName} · Applied on {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <span
                        style={{
                          background: app.matchScore >= 80 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(15, 118, 110, 0.12)',
                          color: app.matchScore >= 80 ? '#059669' : '#0f766e',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          padding: '0.3rem 0.65rem',
                          borderRadius: 8,
                        }}
                      >
                        {app.matchScore}% Fit
                      </span>
                      <span
                        style={{
                          background: st.bg,
                          color: st.color,
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          padding: '0.3rem 0.75rem',
                          borderRadius: 8,
                        }}
                      >
                        {app.status}
                      </span>
                      {app.jobId?._id && (
                        <Link
                          to={`/jobs/${app.jobId._id}`}
                          className="btn btn-sm btn-outline-primary"
                          style={{ borderRadius: 8, fontWeight: 600, fontSize: '0.8rem' }}
                        >
                          View Job
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* 5-Stage Stepper */}
                  {!isRejected ? (
                    <div className="pt-3 border-top mt-2" style={{ borderColor: 'var(--wn-border)' }}>
                      <div className="d-flex align-items-center justify-content-between position-relative" style={{ maxWidth: 650, margin: '0 auto', padding: '0.5rem 0' }}>
                        {/* Connecting Line Background */}
                        <div
                          style={{
                            position: 'absolute',
                            top: 18,
                            left: '5%',
                            right: '5%',
                            height: 3,
                            background: '#e2e8f0',
                            zIndex: 1,
                          }}
                        />
                        {/* Connecting Line Active Fill */}
                        <div
                          style={{
                            position: 'absolute',
                            top: 18,
                            left: '5%',
                            width: `${(Math.max(0, currentIndex) / (STAGES.length - 1)) * 90}%`,
                            height: 3,
                            background: 'var(--wn-primary)',
                            zIndex: 2,
                            transition: 'width 0.4s ease',
                          }}
                        />

                        {STAGES.map((s, idx) => {
                          const isDone = idx < currentIndex;
                          const isCurrent = idx === currentIndex;
                          return (
                            <div key={s.key} className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 3 }}>
                              <div
                                style={{
                                  width: isCurrent ? 24 : 20,
                                  height: isCurrent ? 24 : 20,
                                  borderRadius: '50%',
                                  background: isDone || isCurrent ? 'var(--wn-primary)' : '#fff',
                                  border: `2px solid ${isDone || isCurrent ? 'var(--wn-primary)' : '#cbd5e1'}`,
                                  boxShadow: isCurrent ? '0 0 0 4px rgba(15, 118, 110, 0.2)' : 'none',
                                  display: 'grid',
                                  placeItems: 'center',
                                  color: '#fff',
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                  transition: 'all 0.3s ease',
                                }}
                              >
                                {isDone ? '✓' : isCurrent ? '•' : ''}
                              </div>
                              <span
                                style={{
                                  marginTop: 6,
                                  fontSize: '0.72rem',
                                  fontWeight: isCurrent ? 700 : 500,
                                  color: isCurrent ? 'var(--wn-primary)' : isDone ? 'var(--wn-text)' : 'var(--wn-text-muted)',
                                }}
                              >
                                {s.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 border-top mt-2 d-flex align-items-center gap-2" style={{ borderColor: 'var(--wn-border)', fontSize: '0.82rem', color: '#b91c1c' }}>
                      <span>✕ Application not selected for this position. Don't worry—new opportunities are posted daily!</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Applications;
