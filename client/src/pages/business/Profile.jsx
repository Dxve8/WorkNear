import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiCamera, FiUpload, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LocationPicker from '../../components/common/LocationPicker';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

/**
 * Business Profile Management View
 * Manages company identity, category tags, contact info,
 * store/office photo uploads, and geographical map pins.
 */
const BusinessProfile = () => {
  const { loadUser } = useAuth();
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    businessName: '', category: 'Cafe', description: '', phone: '',
  });
  const [location, setLocation] = useState({
    type: 'Point', coordinates: [0, 0], address: '', locality: '', city: '',
  });
  const [imageUrl, setImageUrl] = useState('');
  const [verified, setVerified] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/business/me');
        const b = data.business;
        setForm({
          businessName: b.businessName || '',
          category: b.category || 'Cafe',
          description: b.description || '',
          phone: b.phone || '',
        });
        setLocation({
          type: 'Point',
          coordinates: b.location?.coordinates || [0, 0],
          address: b.location?.address || '',
          locality: b.location?.locality || '',
          city: b.location?.city || '',
        });
        if (b.businessImage) {
          setImageUrl(`${API_BASE}/uploads/business/${b.businessImage}`);
        }
        setVerified(!!b.verified);
      } catch (_) {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate client-side
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/business/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageUrl(`${API_BASE}${data.imageUrl}`);
      if (data.verified) {
        setVerified(true);
        toast.success('🎉 Image uploaded! Your business is now Verified ✓');
      } else {
        toast.success('Image uploaded!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (e) => {
    e?.stopPropagation();
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;
    setUploading(true);
    try {
      await api.delete('/business/image');
      setImageUrl('');
      setVerified(false);
      toast.success('Profile photo removed');
      await loadUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasRealCoords = location.coordinates?.[0] !== 0 || location.coordinates?.[1] !== 0;
    if (!hasRealCoords) {
      toast('Warning: Location not set. Distance matching will not work until you add it.', {
        duration: 4000,
        style: { background: '#fef3c7', color: '#92400e' },
      });
    }
    setSaving(true);

    try {
      await api.post('/business', {
        businessName: form.businessName,
        category: form.category,
        description: form.description,
        phone: form.phone,
        location,
      });
      toast.success('Business profile saved!');
      await loadUser();
      // Re-check verification status
      try {
        const { data: refreshed } = await api.get('/business/me');
        setVerified(!!refreshed.business?.verified);
      } catch (_) {}
    } catch (err) {
      const validationErrors = err.response?.data?.errors;
      const message = Array.isArray(validationErrors) && validationErrors.length > 0
        ? validationErrors[0].msg
        : err.response?.data?.message || 'Failed to save';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container py-5"><div className="skeleton" style={{ height: 300, borderRadius: 16 }} /></div>;

  // Placeholder image — first letter of business name
  const initial = form.businessName?.charAt(0)?.toUpperCase() || 'B';

  // Verification checklist
  const hasRealCoords = location.coordinates?.[0] !== 0 || location.coordinates?.[1] !== 0;
  const checks = [
    { label: 'Business name', done: !!form.businessName },
    { label: 'Category', done: !!form.category },
    { label: 'Description (10+ chars)', done: form.description?.length >= 10 },
    { label: 'Phone number', done: !!form.phone },
    { label: 'Location set', done: hasRealCoords },
    { label: 'Business photo uploaded', done: !!imageUrl },
  ];
  const doneCount = checks.filter((c) => c.done).length;

  return (
    <div style={{ background: 'var(--wn-bg)', minHeight: '80vh' }}>
      <div className="container py-4 py-md-5" style={{ maxWidth: 640 }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1rem', fontSize: 'clamp(1.5rem, 3vw, 1.85rem)' }}>
            Business Profile
          </h1>
        </motion.div>

        {/* ── VERIFICATION STATUS ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{
            background: verified
              ? 'linear-gradient(135deg, #065f46, #047857)'
              : 'var(--wn-surface)',
            borderRadius: 14,
            border: verified ? 'none' : '1px solid var(--wn-border)',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.25rem',
            color: verified ? '#fff' : 'inherit',
          }}
        >
          {verified ? (
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: '1.3rem' }}>✓</span>
              <div>
                <p style={{ fontWeight: 700, margin: 0, fontSize: '1rem' }}>Verified Business</p>
                <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.85 }}>
                  Your business profile is complete and verified. The ✓ badge appears on all your job listings.
                </p>
              </div>
            </div>
          ) : (
            <>
              <p style={{ fontWeight: 700, margin: '0 0 6px', fontSize: '0.95rem' }}>
                Get Verified — {doneCount}/{checks.length} complete
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--wn-text-muted)', margin: '0 0 10px' }}>
                Complete all items below to earn the ✓ Verified badge on your job listings.
              </p>
              {/* Progress bar */}
              <div style={{ background: 'var(--wn-bg)', borderRadius: 20, height: 8, marginBottom: 10 }}>
                <div style={{
                  width: `${(doneCount / checks.length) * 100}%`,
                  background: 'var(--wn-primary)',
                  borderRadius: 20, height: '100%',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <div className="d-flex flex-wrap gap-2">
                {checks.map((c) => (
                  <span key={c.label} style={{
                    fontSize: '0.78rem', fontWeight: 600,
                    padding: '0.2rem 0.6rem', borderRadius: 8,
                    background: c.done ? 'rgba(16,185,129,0.12)' : 'var(--wn-bg)',
                    color: c.done ? '#059669' : 'var(--wn-text-muted)',
                  }}>
                    {c.done ? '✓' : '○'} {c.label}
                  </span>
                ))}
              </div>
            </>
          )}
        </motion.div>
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          style={{ background: 'var(--wn-surface)', borderRadius: 20, border: '1px solid var(--wn-border)', padding: '1.75rem' }}
        >
          {/* ── BUSINESS IMAGE ── */}
          <div className="d-flex flex-column align-items-center mb-4">
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: 130, height: 130, borderRadius: 16,
                overflow: 'hidden', cursor: 'pointer',
                border: '3px dashed var(--wn-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
                background: imageUrl ? 'transparent' : 'linear-gradient(135deg, #0f766e, #14b8a6)',
              }}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Business"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={() => setImageUrl('')}
                />
              ) : (
                <span style={{ fontSize: '3rem', fontWeight: 800, color: '#fff' }}>{initial}</span>
              )}
              {/* Hover overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.45)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 0.2s',
                color: '#fff', fontSize: '0.75rem', fontWeight: 600,
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
              >
                <FiCamera size={22} />
                <span style={{ marginTop: 4 }}>{imageUrl ? 'Change' : 'Upload'}</span>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <div className="d-flex align-items-center gap-2 mt-2 flex-wrap justify-content-center">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="btn btn-sm"
                disabled={uploading}
                style={{
                  borderRadius: 8, fontWeight: 600, fontSize: '0.8rem',
                  border: '1px solid var(--wn-border)',
                  color: 'var(--wn-text-secondary)',
                  background: 'transparent',
                }}
              >
                <FiUpload size={13} className="me-1" />
                {uploading ? 'Uploading...' : imageUrl ? 'Change Photo' : 'Upload Photo'}
              </button>

              {imageUrl && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="btn btn-sm btn-outline-danger"
                  disabled={uploading}
                  style={{
                    borderRadius: 8, fontWeight: 600, fontSize: '0.8rem',
                  }}
                >
                  <FiTrash2 size={13} className="me-1" />
                  Remove
                </button>
              )}
            </div>
            <small className="text-muted mt-1">JPEG, PNG or WebP · Max 5 MB</small>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Business Name *</label>
            <input name="businessName" className="form-control" value={form.businessName} onChange={handleChange} required />
          </div>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Category *</label>
              <select name="category" className="form-select" value={form.category} onChange={handleChange}>
                {['Cafe', 'Restaurant', 'Shop', 'Salon', 'Hotel', 'Garage', 'Clinic', 'Tuition', 'Retail', 'Office', 'Other'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Phone</label>
              <input name="phone" className="form-control" value={form.phone} onChange={handleChange} />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Description</label>
            <textarea name="description" className="form-control" rows={3} value={form.description} onChange={handleChange} />
          </div>
          <div className="row g-3 mb-4">
            <div className="col-12">
              <label className="form-label fw-semibold">Business Location *</label>
              <LocationPicker value={location} onChange={setLocation} />
            </div>
          </div>
          <motion.button type="submit" className="btn btn-primary btn-lg" disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            {saving ? 'Saving...' : 'Save Profile'}
          </motion.button>
        </motion.form>
      </div>
    </div>
  );
};

export default BusinessProfile;
