import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import api from '../../services/api';

/**
 * AI / Algorithmic Recommended Jobs Feed
 * Surfaces hyper-local jobs ranked by matching algorithms, displaying
 * circular matching gauges and direct application links.
 */
const Recommended = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/jobs/recommended');
        setRecommendations(data.recommendations || []);
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
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4, fontSize: 'clamp(1.5rem, 3vw, 1.85rem)' }}>
            Recommended Jobs
          </h1>
          <p style={{ color: 'var(--wn-text-secondary)', marginBottom: '1.75rem' }}>
            Ranked by match score — skills, availability, distance & preferences
          </p>
        </motion.div>

        {loading ? (
          <div className="row g-3">
            {[1, 2, 3, 4].map((i) => (
              <div className="col-md-6" key={i}>
                <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
              </div>
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-5" style={{ background: 'var(--wn-surface)', borderRadius: 16, border: '1px solid var(--wn-border)' }}>
            <p style={{ color: 'var(--wn-text-muted)' }}>No recommendations yet. Complete your profile with skills and availability.</p>
            <Link to="/seeker/profile" className="btn btn-primary">Complete Profile</Link>
          </div>
        ) : (
          <div className="row g-3">
            {recommendations.map((rec, i) => {
              const scoreColor = rec.matchScore >= 80 ? '#10b981' : rec.matchScore >= 60 ? '#0f766e' : '#94a3b8';
              return (
                <div className="col-md-6" key={rec.job._id}>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Tilt tiltMaxAngleX={4} tiltMaxAngleY={4} scale={1.015}>
                      <div
                        className="job-card h-100 p-4"
                        style={{ background: 'var(--wn-surface)', borderRadius: 16, border: '1px solid var(--wn-border)' }}
                      >
                        <div className="d-flex gap-3">
                          <div style={{ width: 72, flexShrink: 0 }}>
                            <CircularProgressbar
                              value={rec.matchScore}
                              text={`${rec.matchScore}%`}
                              styles={buildStyles({
                                pathColor: scoreColor,
                                textColor: scoreColor,
                                trailColor: '#e2e8f0',
                                textSize: '24px',
                              })}
                            />
                          </div>
                          <div className="flex-grow-1">
                            <h5 style={{ fontWeight: 700, marginBottom: 4, color: 'var(--wn-text)' }}>{rec.job.title}</h5>
                            <p style={{ fontSize: '0.85rem', color: 'var(--wn-text-muted)', marginBottom: 6 }}>
                              {rec.job.businessId?.businessName}
                              {rec.distance != null && ` · ${rec.distance} km`}
                            </p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--wn-text-secondary)', marginBottom: 8 }}>
                              ₹{rec.job.salaryMin?.toLocaleString()} – ₹{rec.job.salaryMax?.toLocaleString()} · {rec.job.jobType?.replace('_', ' ')}
                              {rec.job.urgent && <span style={{ color: '#dc2626', fontWeight: 700, marginLeft: 6 }}>URGENT</span>}
                            </p>
                            <div style={{ fontSize: '0.8rem' }}>
                              {(rec.matchReasons || []).slice(0, 3).map((r, j) => (
                                <div key={j} style={{ color: r.startsWith('✓') ? '#059669' : 'var(--wn-text-secondary)' }}>{r}</div>
                              ))}
                            </div>
                            <Link to={`/jobs/${rec.job._id}`} className="btn btn-primary btn-sm mt-3">
                              View & Apply
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Tilt>
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

export default Recommended;
