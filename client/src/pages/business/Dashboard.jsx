import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPlus, FiUsers, FiBriefcase, FiZap, FiEdit2 } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

/**
 * Employer / Business Main Dashboard
 * Displays metrics (active listings, total candidates), recent postings,
 * direct applicant review shortcuts, and post-job actions.
 */
const BusinessDashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/jobs/my');
        setJobs(data.jobs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeJobs = jobs.filter((j) => j.status === 'ACTIVE');
  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicantsCount || 0), 0);

  return (
    <div style={{ background: 'var(--wn-bg)', minHeight: '80vh' }}>
      <div className="container py-4 py-md-5">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 style={{ fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4, fontSize: 'clamp(1.5rem, 3vw, 1.85rem)' }}>
              Business Dashboard
            </h1>
            <p style={{ color: 'var(--wn-text-secondary)', margin: 0 }}>Welcome, {user?.name}</p>
          </motion.div>
          <Link to="/business/post-job" className="btn btn-primary d-flex align-items-center gap-2">
            <FiPlus size={18} /> Post New Job
          </Link>
        </div>

        <div className="row g-3 mb-4">
          {[
            { label: 'Active Jobs', value: activeJobs.length, icon: <FiBriefcase />, color: '#0f766e' },
            { label: 'Total Jobs', value: jobs.length, icon: <FiBriefcase />, color: '#3b82f6' },
            { label: 'Applicants', value: totalApplicants, icon: <FiUsers />, color: '#10b981' },
            { label: 'Urgent', value: jobs.filter((j) => j.urgent).length, icon: <FiZap />, color: '#ef4444' },
          ].map((s, i) => (
            <div className="col-6 col-md-3" key={s.label}>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="stat-card">
                <div style={{ color: s.color, marginBottom: 4 }}>{s.icon}</div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </motion.div>
            </div>
          ))}
        </div>

        <h4 style={{ fontWeight: 700, marginBottom: '1rem' }}>Your Jobs</h4>
        {loading ? (
          <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
        ) : jobs.length === 0 ? (
          <div className="text-center py-5" style={{ background: 'var(--wn-surface)', borderRadius: 16, border: '1px solid var(--wn-border)' }}>
            <p style={{ color: 'var(--wn-text-muted)' }}>No jobs posted yet.</p>
            <Link to="/business/post-job" className="btn btn-primary">Post your first job</Link>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {jobs.map((job, i) => (
              <motion.div
                key={job._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="p-3 p-md-4 d-flex flex-wrap justify-content-between align-items-center gap-2"
                style={{ background: 'var(--wn-surface)', borderRadius: 14, border: '1px solid var(--wn-border)' }}
              >
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <h6 style={{ fontWeight: 700, margin: 0 }}>{job.title}</h6>
                    {job.urgent && <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: 4 }}>URGENT</span>}
                    <span style={{ background: job.status === 'ACTIVE' ? '#d1fae5' : '#f1f5f9', color: job.status === 'ACTIVE' ? '#047857' : '#64748b', fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.45rem', borderRadius: 4 }}>{job.status}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--wn-text-muted)', margin: 0 }}>
                    {job.jobType?.replace('_', ' ')} · ₹{job.salaryMin?.toLocaleString()}–₹{job.salaryMax?.toLocaleString()} · {job.applicantsCount || 0} applicants
                  </p>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  <Link to={`/business/jobs/${job._id}/applicants`} className="btn btn-primary btn-sm">Applicants</Link>
                  {job.status === 'ACTIVE' && (
                    <Link
                      to={`/business/jobs/${job._id}/edit`}
                      className="btn btn-sm"
                      style={{ border: '1px solid var(--wn-border)', borderRadius: 8, color: 'var(--wn-text-secondary)' }}
                    >
                      <FiEdit2 size={14} className="me-1" />Edit
                    </Link>
                  )}
                  <Link to={`/jobs/${job._id}`} className="btn btn-outline-secondary btn-sm" style={{ borderRadius: 8 }}>View</Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessDashboard;
