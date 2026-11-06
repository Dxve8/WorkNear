import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { loadUser } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) return toast.error('Passwords do not match.');
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      await loadUser();
      toast.success('Password reset successfully. You are now signed in.');
      navigate('/');
    } catch (error) {
      const firstError = error.response?.data?.errors?.[0]?.msg;
      toast.error(firstError || error.response?.data?.message || 'Unable to reset your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page d-flex align-items-center justify-content-center" style={{ minHeight: 'calc(100vh - 140px)', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div className="text-center mb-4"><h2 style={{ fontWeight: 800 }}>Choose a new password</h2><p style={{ color: 'var(--wn-text-secondary)' }}>Use at least 8 characters.</p></div>
        <form onSubmit={submit} style={{ background: 'var(--wn-surface)', border: '1px solid var(--wn-border)', borderRadius: 20, boxShadow: 'var(--wn-shadow-md)', padding: '2rem' }}>
          <label className="form-label fw-semibold">New password</label>
          <input type="password" className="form-control mb-3" value={password} onChange={(event) => setPassword(event.target.value)} minLength="8" required />
          <label className="form-label fw-semibold">Confirm new password</label>
          <input type="password" className="form-control mb-3" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength="8" required />
          <button className="btn btn-primary w-100" disabled={loading}>{loading ? 'Resetting…' : 'Reset password'}</button>
          <p className="text-center mt-3 mb-0" style={{ fontSize: '0.875rem' }}><Link to="/login">Back to login</Link></p>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
