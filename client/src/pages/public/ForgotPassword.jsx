import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success(data.message);
      if (data.previewUrl) console.info(`Development email preview: ${data.previewUrl}`);
    } catch (error) {
      const firstError = error.response?.data?.errors?.[0]?.msg;
      toast.error(firstError || error.response?.data?.message || 'Unable to request a reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page d-flex align-items-center justify-content-center" style={{ minHeight: 'calc(100vh - 140px)', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div className="text-center mb-4"><FiMail size={30} style={{ color: 'var(--wn-primary)' }} /><h2 className="mt-3" style={{ fontWeight: 800 }}>Reset your password</h2><p style={{ color: 'var(--wn-text-secondary)' }}>Enter your email and we’ll send a reset link.</p></div>
        <form onSubmit={submit} style={{ background: 'var(--wn-surface)', border: '1px solid var(--wn-border)', borderRadius: 20, boxShadow: 'var(--wn-shadow-md)', padding: '2rem' }}>
          <label className="form-label fw-semibold">Email address</label>
          <input type="email" className="form-control mb-3" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@example.com" />
          <button className="btn btn-primary w-100" disabled={loading}>{loading ? 'Sending…' : sent ? 'Send another link' : 'Send reset link'}</button>
          <p className="text-center mt-3 mb-0" style={{ fontSize: '0.875rem' }}><Link to="/login">Back to login</Link></p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
