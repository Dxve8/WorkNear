import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import LocationPicker from '../../components/common/LocationPicker';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/**
 * Employer Job Creation View
 * Multi-field form for listing new hyper-local job vacancies, setting shifts,
 * compensation bounds, skill tags, urgency markers, and custom location coordinates.
 */
const PostJob = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', category: 'Cafe', skills: '',
    salaryMin: '', salaryMax: '', jobType: 'PART_TIME',
    experienceRequired: 0, workingHoursFrom: '16:00', workingHoursTo: '21:00',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    deadline: '', urgent: false,
  });
  const [customLocation, setCustomLocation] = useState(false);
  const [location, setLocation] = useState({
    type: 'Point', coordinates: [0, 0], address: '', locality: '', city: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (customLocation && location.coordinates?.[0] === 0 && location.coordinates?.[1] === 0) {
      toast.error('Set a location for this job, or turn off "different location"');
      return;
    }
    setLoading(true);
    try {
      await api.post('/jobs', {
        title: form.title,
        description: form.description,
        category: form.category,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        salaryMin: Number(form.salaryMin),
        salaryMax: Number(form.salaryMax),
        jobType: form.jobType,
        experienceRequired: Number(form.experienceRequired),
        workingHours: { from: form.workingHoursFrom, to: form.workingHoursTo, days: form.workingDays },
        urgent: form.urgent,
        ...(form.deadline ? { deadline: new Date(form.deadline).toISOString() } : {}),
        ...(customLocation ? { location } : {}),
      });
      toast.success('Job posted successfully!');
      navigate('/business/dashboard');
    } catch (err) {
      const validationErrors = err.response?.data?.errors;
      const message = Array.isArray(validationErrors) && validationErrors.length > 0
        ? validationErrors[0].msg
        : err.response?.data?.message || 'Failed to post job';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--wn-bg)', minHeight: '80vh' }}>
      <div className="container py-4 py-md-5" style={{ maxWidth: 700 }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1.5rem', fontSize: 'clamp(1.5rem, 3vw, 1.85rem)' }}>
            Post a New Job
          </h1>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onSubmit={handleSubmit}
          style={{ background: 'var(--wn-surface)', borderRadius: 20, border: '1px solid var(--wn-border)', padding: '1.75rem' }}
        >
          <div className="mb-3">
            <label className="form-label fw-semibold">Job Title *</label>
            <input name="title" className="form-control" value={form.title} onChange={handleChange} required placeholder="Part-Time Cashier" />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Description *</label>
            <textarea name="description" className="form-control" rows={4} value={form.description} onChange={handleChange} required />
          </div>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Category</label>
              <select name="category" className="form-select" value={form.category} onChange={handleChange}>
                {['Cafe', 'Restaurant', 'Shop', 'Salon', 'Hotel', 'Garage', 'Clinic', 'Tuition', 'Retail', 'Office', 'Other'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Job Type</label>
              <select name="jobType" className="form-select" value={form.jobType} onChange={handleChange}>
                <option value="PART_TIME">Part Time</option>
                <option value="FULL_TIME">Full Time</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="DAILY_WAGE">Daily Wage</option>
                <option value="CONTRACT">Contract</option>
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Required Skills (comma separated)</label>
            <input name="skills" className="form-control" value={form.skills} onChange={handleChange} placeholder="Billing, Customer Service, Excel" />
          </div>
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label fw-semibold">Salary Min (₹) *</label>
              <input type="number" name="salaryMin" className="form-control" value={form.salaryMin} onChange={handleChange} required />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">Salary Max (₹) *</label>
              <input type="number" name="salaryMax" className="form-control" value={form.salaryMax} onChange={handleChange} required />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">Experience (years)</label>
              <input type="number" name="experienceRequired" className="form-control" value={form.experienceRequired} onChange={handleChange} min="0" />
            </div>
          </div>
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label fw-semibold">Hours From</label>
              <input type="time" name="workingHoursFrom" className="form-control" value={form.workingHoursFrom} onChange={handleChange} />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">Hours To</label>
              <input type="time" name="workingHoursTo" className="form-control" value={form.workingHoursTo} onChange={handleChange} />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">Closing Date (optional)</label>
              <input
                type="date"
                name="deadline"
                className="form-control"
                value={form.deadline}
                min={new Date().toISOString().split('T')[0]}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Working Days</label>
            <div className="d-flex flex-wrap gap-2 mt-1">
              {DAYS.map((day) => (
                <label
                  key={day}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '0.3rem 0.75rem', borderRadius: 20, cursor: 'pointer',
                    border: `1px solid ${form.workingDays.includes(day) ? 'var(--wn-primary)' : 'var(--wn-border)'}`,
                    background: form.workingDays.includes(day) ? 'rgba(15,118,110,0.1)' : 'transparent',
                    fontWeight: form.workingDays.includes(day) ? 600 : 400,
                    fontSize: '0.83rem',
                    color: form.workingDays.includes(day) ? 'var(--wn-primary)' : 'var(--wn-text-secondary)',
                    transition: 'all 0.15s',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    className="d-none"
                    checked={form.workingDays.includes(day)}
                    onChange={(e) => {
                      const days = e.target.checked
                        ? [...form.workingDays, day]
                        : form.workingDays.filter((d) => d !== day);
                      setForm({ ...form, workingDays: days });
                    }}
                  />
                  {day.slice(0, 3)}
                </label>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <div className="form-check">
              <input type="checkbox" className="form-check-input" name="urgent" id="urgent" checked={form.urgent} onChange={handleChange} />
              <label className="form-check-label fw-semibold" htmlFor="urgent">Mark as URGENT</label>
            </div>
          </div>

          <div className="mt-2 mb-4">
            <div className="form-check mb-2">
              <input
                type="checkbox"
                className="form-check-input"
                id="customLocation"
                checked={customLocation}
                onChange={(e) => setCustomLocation(e.target.checked)}
              />
              <label className="form-check-label fw-semibold" htmlFor="customLocation">
                This job is at a different location than my business profile
              </label>
            </div>
            {customLocation ? (
              <LocationPicker value={location} onChange={setLocation} />
            ) : (
              <p style={{ fontSize: '0.82rem', color: 'var(--wn-text-muted)' }}>
                This job will use your business profile's location for distance-based matching.
              </p>
            )}
          </div>

          <motion.button type="submit" className="btn btn-primary btn-lg" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            {loading ? 'Posting...' : 'Post Job'}
          </motion.button>
        </motion.form>
      </div>
    </div>
  );
};

export default PostJob;
