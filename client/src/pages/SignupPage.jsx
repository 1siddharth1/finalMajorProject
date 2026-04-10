import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, AlertCircle, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({ displayName: '', email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.displayName || !form.email || !form.password || !form.confirmPassword) {
      setError('Please fill in all fields.'); return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.'); return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.'); return;
    }

    setLoading(true);
    try {
      await register(form.email, form.password, form.displayName);
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strength = form.password.length === 0 ? 0
    : form.password.length < 8 ? 1
    : form.password.length < 12 ? 2
    : 3;
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#22c55e'];

  return (
    <div className="auth-page">
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />

      <div className="auth-card">
        <div className="auth-logo">
          <Sparkles size={32} className="auth-logo-icon" />
          <span className="auth-logo-text">DocuMagic AI</span>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start formatting and saving documents today</p>

        <form onSubmit={handleSubmit} className="auth-form" id="signup-form">
          {/* Display Name */}
          <div className="auth-field">
            <label htmlFor="signup-name" className="auth-label">Display Name</label>
            <div className="auth-input-wrapper">
              <User size={18} className="auth-input-icon" />
              <input
                id="signup-name"
                type="text"
                name="displayName"
                className="auth-input"
                placeholder="Your name"
                value={form.displayName}
                onChange={handleChange}
                autoComplete="name"
                disabled={loading}
              />
            </div>
          </div>

          {/* Email */}
          <div className="auth-field">
            <label htmlFor="signup-email" className="auth-label">Email Address</label>
            <div className="auth-input-wrapper">
              <Mail size={18} className="auth-input-icon" />
              <input
                id="signup-email"
                type="email"
                name="email"
                className="auth-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="auth-field">
            <label htmlFor="signup-password" className="auth-label">Password</label>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input
                id="signup-password"
                type={showPass ? 'text' : 'password'}
                name="password"
                className="auth-input"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={loading}
              />
              <button
                type="button"
                className="auth-toggle-pass"
                onClick={() => setShowPass(s => !s)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Password strength indicator */}
            {form.password && (
              <div className="password-strength">
                <div className="strength-bars">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className="strength-bar"
                      style={{ background: i <= strength ? strengthColor[strength] : 'var(--border)' }}
                    />
                  ))}
                </div>
                <span style={{ color: strengthColor[strength], fontSize: '0.75rem' }}>
                  {strengthLabel[strength]}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="auth-field">
            <label htmlFor="signup-confirm" className="auth-label">Confirm Password</label>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input
                id="signup-confirm"
                type={showPass ? 'text' : 'password'}
                name="confirmPassword"
                className="auth-input"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={loading}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="auth-error" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            id="signup-submit"
            type="submit"
            className="btn auth-btn"
            disabled={loading}
          >
            {loading ? (
              <><div className="spinner-sm" /> Creating account…</>
            ) : (
              <><UserPlus size={18} /> Create Account</>
            )}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>

        <div className="auth-divider" />
        <Link to="/" className="auth-back">← Back to homepage</Link>
      </div>
    </div>
  );
}
