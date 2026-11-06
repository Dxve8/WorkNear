import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { FiArrowLeft, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

/**
 * Employer Applicant Review Pipeline
 * Lists job candidates, displays matching percentages and qualifications,
 * auto-updates application status to VIEWED, and provides interview/selection actions.
 */
const Applicants = () => {
  const { jobId } = useParams();
  const [applicants, setApplicants] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [jobRes, appRes] = await Promise.all([
        api.get(`/jobs/${jobId}`),
        api.get(`/jobs/${jobId}/applicants`),
      ]);
      setJob(jobRes.data.job);
      const apps = appRes.data.applicants || [];
      setApplicants(apps);

      // Auto-mark APPLIED → VIEWED silently when business opens this page
      const newlyApplied = apps.filter((a) => a.status === 'APPLIED');
      if (newlyApplied.length > 0) {
        await Promise.allSettled(
          newlyApplied.map((a) =>
            api.put(`/applications/${a._id}/status`, { status: 'VIEWED' })
          )
        );
        // Update local state without a full reload
        setApplicants((prev) =>
          prev.map((a) => a.status === 'APPLIED' ? { ...a, status: 'VIEWED' } : a)
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [jobId]);

  const updateStatus = async (appId, status) => {
    try {
      await api.put(`/applications/${appId}/status`, { status });
      toast.success(`Status updated to ${status}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--wn-bg)', minHeight: '80vh' }}>
      <div className="container py-4 py-md-5">
        <Link to="/business/dashboard" className="d-inline-flex align-items-center gap-1 mb-3 text-decoration-none" style={{ color: 'var(--wn-text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
          <FiArrowLeft size={16} /> Back to Dashboard
        </Link>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4, fontSize: 'clamp(1.4rem, 3vw, 1.75rem)' }}>
            Applicants
          </h1>
          {job && <p style={{ color: 'var(--wn-text-secondary)', marginBottom: '1.5rem' }}>{job.title}</p>}
        </motion.div>

        {applicants.length === 0 ? (
          <div className="text-center py-5" style={{ background: 'var(--wn-surface)', borderRadius: 16, border: '1px solid var(--wn-border)' }}>
            <p style={{ color: 'var(--wn-text-muted)' }}>No applicants yet.</p>
          </div>
        ) : (
          <div className="row g-3">
            {applicants.map((app, i) => {
              const scoreColor = app.matchScore >= 80 ? '#10b981' : app.matchScore >= 60 ? '#0f766e' : '#94a3b8';
              return (
                <div className="col-md-6" key={app._id}>
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 h-100"
                    style={{ background: 'var(--wn-surface)', borderRadius: 16, border: '1px solid var(--wn-border)' }}
                  >
                    <div className="d-flex gap-3 mb-3">
                      <div style={{ width: 64, flexShrink: 0 }}>
                        <CircularProgressbar
                          value={app.matchScore}
                          text={`${app.matchScore}%`}
                          styles={buildStyles({ pathColor: scoreColor, textColor: scoreColor, trailColor: '#e2e8f0', textSize: '24px' })}
                        />
                      </div>
                      <div>
                        <h5 style={{ fontWeight: 700, marginBottom: 2 }}>{app.workerId?.name}</h5>
                        <p style={{ fontSize: '0.85rem', color: 'var(--wn-text-muted)', marginBottom: 4 }}>{app.workerId?.email}</p>
                        <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: 6 }}>
                          {app.status}
                        </span>
                      </div>
                    </div>

                    <div style={{
                      background: 'var(--wn-bg)', borderRadius: 12,
                      padding: '0.75rem 1rem', marginBottom: 12,
                      border: '1px solid var(--wn-border)',
                    }}>
                      <p style={{ fontWeight: 700, fontSize: '0.78rem', margin: '0 0 6px', color: 'var(--wn-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Contact Info
                      </p>
                      <div className="d-flex flex-column gap-1" style={{ fontSize: '0.85rem' }}>
                        <a href={`mailto:${app.workerId?.email}`} className="d-flex align-items-center gap-2 text-decoration-none" style={{ color: 'var(--wn-primary)' }}>
                          <FiMail size={14} /> {app.workerId?.email}
                        </a>
                        {app.workerId?.phone ? (
                          <a href={`tel:${app.workerId.phone}`} className="d-flex align-items-center gap-2 text-decoration-none" style={{ color: 'var(--wn-primary)' }}>
                            <FiPhone size={14} /> {app.workerId.phone}
                          </a>
                        ) : (
                          <span className="d-flex align-items-center gap-2" style={{ color: 'var(--wn-text-muted)' }}>
                            <FiPhone size={14} /> No phone provided
                          </span>
                        )}
                        {app.workerId?.location?.locality || app.workerId?.location?.city ? (
                          <span className="d-flex align-items-center gap-2" style={{ color: 'var(--wn-text-secondary)' }}>
                            <FiMapPin size={14} /> {[app.workerId.location.locality, app.workerId.location.city].filter(Boolean).join(', ')}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Match Highlights */}
                    <div style={{ background: 'rgba(15, 118, 110, 0.05)', borderRadius: 12, padding: '0.75rem 1rem', marginBottom: 14, border: '1px solid rgba(15, 118, 110, 0.12)' }}>
                      <p style={{ fontWeight: 700, fontSize: '0.78rem', margin: '0 0 6px', color: 'var(--wn-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Match Breakdown
                      </p>
                      <div className="d-flex flex-column gap-1" style={{ fontSize: '0.8rem' }}>
                        {(app.matchReasons || []).slice(0, 3).map((r, j) => (
                          <div key={j} style={{ color: r.startsWith('✓') ? '#059669' : 'var(--wn-text-secondary)', fontWeight: r.startsWith('✓') ? 600 : 400 }}>
                            {r}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Candidate Skills */}
                    <div className="d-flex flex-wrap gap-1 mb-2">
                      {(app.workerProfile?.skills || []).slice(0, 5).map((s) => (
                        <span key={s} style={{ background: 'var(--wn-bg)', color: 'var(--wn-text-secondary)', fontSize: '0.75rem', fontWeight: 500, padding: '0.2rem 0.5rem', borderRadius: 6, border: '1px solid var(--wn-border)' }}>
                          {s}
                        </span>
                      ))}
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--wn-text-muted)', marginBottom: 14 }}>
                      Experience: <strong style={{ color: 'var(--wn-text)' }}>{app.workerProfile?.experienceYears || 0} yrs</strong> · Preferred Radius: <strong style={{ color: 'var(--wn-text)' }}>{app.workerProfile?.preferredRadius || '-'} km</strong>
                    </p>

                    {/* Quick Action Hiring Pipeline */}
                    <div className="pt-3 border-top" style={{ borderColor: 'var(--wn-border)' }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--wn-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Update Hiring Status:
                      </p>
                      <div className="d-flex flex-wrap gap-1">
                        {[
                          { key: 'SHORTLISTED', label: 'Shortlist', color: '#0f766e', bg: '#ccfbf1' },
                          { key: 'INTERVIEW', label: 'Interview', color: '#b45309', bg: '#fef3c7' },
                          { key: 'SELECTED', label: 'Hire / Select', color: '#047857', bg: '#d1fae5' },
                          { key: 'REJECTED', label: 'Decline', color: '#b91c1c', bg: '#fee2e2' },
                        ].map((action) => {
                          const isActive = app.status === action.key;
                          return (
                            <button
                              key={action.key}
                              className="btn btn-sm"
                              style={{
                                borderRadius: 8,
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                background: isActive ? action.color : 'transparent',
                                color: isActive ? '#fff' : 'var(--wn-text-secondary)',
                                border: `1px solid ${isActive ? action.color : 'var(--wn-border)'}`,
                                padding: '0.25rem 0.6rem',
                                opacity: isActive ? 1 : 0.85,
                              }}
                              onClick={() => updateStatus(app._id, action.key)}
                              disabled={isActive}
                            >
                              {isActive ? `✓ ${action.label}` : action.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Applicants;
