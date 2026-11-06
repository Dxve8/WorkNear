import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiBriefcase, FiFileText, FiCheckCircle, FiAlertCircle, FiBarChart2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

/**
 * Superadmin Management & Oversight Dashboard
 * Provides aggregate system telemetry, moderation tools for accounts and job postings,
 * report reviews, and macro skill demand visualizations.
 */
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [reports, setReports] = useState([]);
  const [skills, setSkills] = useState({ topSkills: [], topCategories: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('skills');

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, usersRes, bizRes, jobsRes, reportsRes, skillsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/users'),
          api.get('/admin/businesses'),
          api.get('/admin/jobs'),
          api.get('/admin/reports'),
          api.get('/admin/skills-demand'),
        ]);
        setStats(statsRes.data.stats);
        setUsers(usersRes.data.users || []);
        setBusinesses(bizRes.data.businesses || []);
        setJobs(jobsRes.data.jobs || []);
        setReports(reportsRes.data.reports || []);
        setSkills(skillsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleSuspend = async (user) => {
    let reason = '';
    if (!user.isSuspended) {
      const input = window.prompt(`Enter suspension reason for ${user.name} (optional):`, 'Policy violation');
      if (input === null) return; // User cancelled prompt
      reason = input;
    }
    try {
      const { data } = await api.put(`/admin/users/${user._id}/suspend`, { reason });
      toast.success(data.message);
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, isSuspended: data.user.isSuspended, suspensionReason: data.user.suspensionReason } : u)));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const verifyBusiness = async (id) => {
    try {
      const { data } = await api.put(`/admin/businesses/${id}/verify`);
      toast.success(data.message);
      setBusinesses((prev) => prev.map((b) => (b._id === id ? { ...b, verified: data.business.verified } : b)));
    } catch (err) {
      toast.error('Failed');
    }
  };

  const closeJob = async (id) => {
    try {
      await api.put(`/admin/jobs/${id}/close`);
      toast.success('Job closed');
      setJobs((prev) => prev.map((j) => (j._id === id ? { ...j, status: 'CLOSED' } : j)));
    } catch (err) {
      toast.error('Failed');
    }
  };

  const resolveReport = async (id, status) => {
    try {
      await api.put(`/admin/reports/${id}`, { status });
      toast.success(`Report marked as ${status.toLowerCase()}`);
      setReports((prev) => prev.map((r) => (r._id === id ? { ...r, status } : r)));
      // Decrement pending count in stats
      if (status !== 'PENDING') {
        setStats((prev) => prev ? { ...prev, pendingReports: Math.max(0, (prev.pendingReports || 1) - 1) } : prev);
      }
    } catch (err) {
      toast.error('Failed to update report');
    }
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="row g-3 mb-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div className="col-6 col-md-2" key={i}><div className="skeleton" style={{ height: 90, borderRadius: 14 }} /></div>
          ))}
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'skills', label: 'Skill Demand' },
    { key: 'users', label: 'Users' },
    { key: 'businesses', label: 'Businesses' },
    { key: 'jobs', label: 'Jobs' },
    { key: 'reports', label: `Reports (${stats?.pendingReports || 0})` },
  ];

  return (
    <div style={{ background: 'var(--wn-bg)', minHeight: '80vh' }}>
      <div className="container py-4 py-md-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1.5rem', fontSize: 'clamp(1.5rem, 3vw, 1.85rem)' }}>
            Admin Dashboard
          </h1>
        </motion.div>

        <div className="row g-3 mb-4">
          {[
            { label: 'Users', value: stats?.totalUsers, icon: <FiUsers />, color: '#0f766e' },
            { label: 'Seekers', value: stats?.totalSeekers, icon: <FiUsers />, color: '#3b82f6' },
            { label: 'Businesses', value: stats?.totalBusinesses, icon: <FiBriefcase />, color: '#8b5cf6' },
            { label: 'Active Jobs', value: stats?.activeJobs, icon: <FiBriefcase />, color: '#f59e0b' },
            { label: 'Applications', value: stats?.totalApplications, icon: <FiFileText />, color: '#06b6d4' },
            { label: 'Hires', value: stats?.successfulHires, icon: <FiCheckCircle />, color: '#10b981' },
          ].map((s, i) => (
            <div className="col-6 col-md-2" key={s.label}>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="stat-card">
                <div style={{ color: s.color, marginBottom: 4 }}>{s.icon}</div>
                <div className="stat-value" style={{ color: s.color, fontSize: '1.4rem' }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </motion.div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="d-flex flex-wrap gap-1 mb-4 p-1" style={{ background: 'var(--wn-surface)', borderRadius: 12, border: '1px solid var(--wn-border)' }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="btn btn-sm"
              style={{
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '0.85rem',
                background: tab === t.key ? 'var(--wn-primary)' : 'transparent',
                color: tab === t.key ? '#fff' : 'var(--wn-text-secondary)',
                border: 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'skills' && (
          <div className="row g-3">
            <div className="col-md-6">
              <div style={{ background: 'var(--wn-surface)', borderRadius: 16, border: '1px solid var(--wn-border)', overflow: 'hidden' }}>
                <div className="px-3 py-3" style={{ borderBottom: '1px solid var(--wn-border)', fontWeight: 700 }}>Most Demanded Skills</div>
                <div className="p-3">
                  {(skills.topSkills || []).length === 0 ? (
                    <p style={{ color: 'var(--wn-text-muted)', margin: 0 }}>No data yet</p>
                  ) : (
                    (skills.topSkills || []).map((s) => (
                      <div key={s.skill} className="d-flex justify-content-between align-items-center py-2" style={{ borderBottom: '1px solid var(--wn-border)' }}>
                        <span className="text-capitalize" style={{ fontWeight: 500 }}>{s.skill}</span>
                        <span style={{ background: 'rgba(15,118,110,0.12)', color: 'var(--wn-primary)', fontWeight: 700, fontSize: '0.8rem', padding: '0.2rem 0.55rem', borderRadius: 6 }}>{s.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div style={{ background: 'var(--wn-surface)', borderRadius: 16, border: '1px solid var(--wn-border)', overflow: 'hidden' }}>
                <div className="px-3 py-3" style={{ borderBottom: '1px solid var(--wn-border)', fontWeight: 700 }}>Popular Categories</div>
                <div className="p-3">
                  {(skills.topCategories || []).map((c) => (
                    <div key={c.category} className="d-flex justify-content-between align-items-center py-2" style={{ borderBottom: '1px solid var(--wn-border)' }}>
                      <span style={{ fontWeight: 500 }}>{c.category}</span>
                      <span style={{ background: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: '0.8rem', padding: '0.2rem 0.55rem', borderRadius: 6 }}>{c.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div style={{ background: 'var(--wn-surface)', borderRadius: 16, border: '1px solid var(--wn-border)', overflow: 'auto' }}>
            <table className="table mb-0" style={{ fontSize: '0.9rem' }}>
              <thead style={{ background: 'var(--wn-bg)' }}>
                <tr>
                  <th className="border-0 px-3 py-3">Name</th>
                  <th className="border-0 px-3 py-3">Email</th>
                  <th className="border-0 px-3 py-3">Role</th>
                  <th className="border-0 px-3 py-3">Status</th>
                  <th className="border-0 px-3 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="px-3 py-2 fw-semibold">{u.name}</td>
                    <td className="px-3 py-2" style={{ color: 'var(--wn-text-secondary)' }}>{u.email}</td>
                    <td className="px-3 py-2"><span style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>{u.role}</span></td>
                    <td className="px-3 py-2">
                      <span style={{ background: u.isSuspended ? '#fee2e2' : '#d1fae5', color: u.isSuspended ? '#b91c1c' : '#047857', padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                        {u.isSuspended ? 'Suspended' : 'Active'}
                      </span>
                      {u.isSuspended && u.suspensionReason && (
                        <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem' }}>
                          Reason: {u.suspensionReason}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {u.role !== 'ADMIN' && (
                        <button className="btn btn-sm" style={{ borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, border: '1px solid var(--wn-border)' }} onClick={() => toggleSuspend(u)}>
                          {u.isSuspended ? 'Activate' : 'Suspend'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'businesses' && (
          <div style={{ background: 'var(--wn-surface)', borderRadius: 16, border: '1px solid var(--wn-border)', overflow: 'auto' }}>
            <table className="table mb-0" style={{ fontSize: '0.9rem' }}>
              <thead style={{ background: 'var(--wn-bg)' }}>
                <tr>
                  <th className="border-0 px-3 py-3">Name</th>
                  <th className="border-0 px-3 py-3">Category</th>
                  <th className="border-0 px-3 py-3">Owner</th>
                  <th className="border-0 px-3 py-3">Verified</th>
                  <th className="border-0 px-3 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((b) => (
                  <tr key={b._id}>
                    <td className="px-3 py-2 fw-semibold">{b.businessName}</td>
                    <td className="px-3 py-2">{b.category}</td>
                    <td className="px-3 py-2">{b.userId?.name}</td>
                    <td className="px-3 py-2">
                      <span style={{ background: b.verified ? '#d1fae5' : '#f1f5f9', color: b.verified ? '#047857' : '#64748b', padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                        {b.verified ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <button className="btn btn-sm btn-primary" style={{ fontSize: '0.75rem' }} onClick={() => verifyBusiness(b._id)}>
                        {b.verified ? 'Unverify' : 'Verify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'jobs' && (
          <div style={{ background: 'var(--wn-surface)', borderRadius: 16, border: '1px solid var(--wn-border)', overflow: 'auto' }}>
            <table className="table mb-0" style={{ fontSize: '0.9rem' }}>
              <thead style={{ background: 'var(--wn-bg)' }}>
                <tr>
                  <th className="border-0 px-3 py-3">Title</th>
                  <th className="border-0 px-3 py-3">Business</th>
                  <th className="border-0 px-3 py-3">Status</th>
                  <th className="border-0 px-3 py-3">Applicants</th>
                  <th className="border-0 px-3 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j._id}>
                    <td className="px-3 py-2 fw-semibold">
                      {j.title}
                      {j.urgent && <span style={{ color: '#dc2626', fontSize: '0.7rem', fontWeight: 700, marginLeft: 6 }}>URGENT</span>}
                    </td>
                    <td className="px-3 py-2">{j.businessId?.businessName}</td>
                    <td className="px-3 py-2">
                      <span style={{ background: j.status === 'ACTIVE' ? '#d1fae5' : '#f1f5f9', color: j.status === 'ACTIVE' ? '#047857' : '#64748b', padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>{j.status}</span>
                    </td>
                    <td className="px-3 py-2">{j.applicantsCount || 0}</td>
                    <td className="px-3 py-2">
                      {j.status === 'ACTIVE' && (
                        <button className="btn btn-sm" style={{ borderRadius: 8, fontSize: '0.75rem', border: '1px solid #fecaca', color: '#dc2626' }} onClick={() => closeJob(j._id)}>
                          Close
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'reports' && (
          <div style={{ background: 'var(--wn-surface)', borderRadius: 16, border: '1px solid var(--wn-border)', overflow: 'hidden' }}>
            {reports.length === 0 ? (
              <p style={{ color: 'var(--wn-text-muted)', margin: '1.5rem', textAlign: 'center' }}>No reports yet.</p>
            ) : (
              reports.map((r) => (
                <div key={r._id} className="d-flex flex-wrap justify-content-between align-items-start gap-3 px-3 py-3" style={{ borderBottom: '1px solid var(--wn-border)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, margin: '0 0 2px', fontSize: '0.9rem' }}>{r.reason}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--wn-text-muted)', margin: 0 }}>
                      Reported by <strong>{r.reportedBy?.name || 'Unknown'}</strong>
                      {r.jobId?.title && <> · Job: <em>{r.jobId.title}</em></>}
                    </p>
                  </div>
                  <div className="d-flex align-items-center gap-2 flex-shrink-0">
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: 6,
                      background: r.status === 'PENDING' ? '#fef3c7' : r.status === 'RESOLVED' ? '#d1fae5' : '#f1f5f9',
                      color: r.status === 'PENDING' ? '#92400e' : r.status === 'RESOLVED' ? '#065f46' : '#64748b',
                    }}>
                      {r.status}
                    </span>
                    {r.status === 'PENDING' && (
                      <>
                        <button
                          className="btn btn-sm"
                          style={{ fontSize: '0.75rem', borderRadius: 8, background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7', fontWeight: 600 }}
                          onClick={() => resolveReport(r._id, 'RESOLVED')}
                        >
                          ✓ Resolve
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ fontSize: '0.75rem', borderRadius: 8, border: '1px solid var(--wn-border)', color: 'var(--wn-text-secondary)' }}
                          onClick={() => resolveReport(r._id, 'DISMISSED')}
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
