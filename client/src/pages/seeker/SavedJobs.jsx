import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';

/**
 * Saved / Bookmarked Jobs Collection
 * Enables job seekers to revisit bookmarked opportunities and manage their shortlist.
 */
const SavedJobs = () => {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get('/saved');
      setSaved(data.savedJobs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const unsave = async (jobId) => {
    try {
      await api.delete(`/saved/${jobId}`);
      toast.success('Removed from saved');
      load();
    } catch (err) {
      toast.error('Failed to remove');
    }
  };

  return (
    <div style={{ background: 'var(--wn-bg)', minHeight: '80vh' }}>
      <div className="container py-4 py-md-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1.5rem', fontSize: 'clamp(1.5rem, 3vw, 1.85rem)' }}>
            Saved Jobs
          </h1>
        </motion.div>

        {loading ? (
          <div className="row g-3">
            {[1, 2].map((i) => (
              <div className="col-md-6" key={i}><div className="skeleton" style={{ height: 120, borderRadius: 16 }} /></div>
            ))}
          </div>
        ) : saved.length === 0 ? (
          <div className="text-center py-5" style={{ background: 'var(--wn-surface)', borderRadius: 16, border: '1px solid var(--wn-border)' }}>
            <p style={{ color: 'var(--wn-text-muted)' }}>No saved jobs yet.</p>
            <Link to="/jobs" className="btn btn-primary">Browse Jobs</Link>
          </div>
        ) : (
          <div className="row g-3">
            {saved.map((s, i) => {
              const job = s.jobId;
              if (!job) return null;
              return (
                <div className="col-md-6" key={s._id}>
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="p-4 h-100"
                    style={{ background: 'var(--wn-surface)', borderRadius: 16, border: '1px solid var(--wn-border)' }}
                  >
                    <h5 style={{ fontWeight: 700, marginBottom: 4 }}>{job.title}</h5>
                    <p style={{ fontSize: '0.85rem', color: 'var(--wn-text-muted)', marginBottom: 12 }}>
                      {job.businessId?.businessName} · ₹{job.salaryMin?.toLocaleString()}–₹{job.salaryMax?.toLocaleString()}
                      {job.urgent && <span style={{ color: '#dc2626', fontWeight: 700, marginLeft: 6 }}>URGENT</span>}
                    </p>
                    <div className="d-flex gap-2">
                      <Link to={`/jobs/${job._id}`} className="btn btn-primary btn-sm">View</Link>
                      <button className="btn btn-outline-danger btn-sm" style={{ borderRadius: 8 }} onClick={() => unsave(job._id)}>
                        Remove
                      </button>
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

export default SavedJobs;
