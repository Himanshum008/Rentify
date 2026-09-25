import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  RotateCw,
  Eye,
  EyeOff,
  Crosshair,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getPreciseLocation } from '../utils/geolocation';

const AuthModal = () => {
  const { 
    authModalOpen, 
    setAuthModalOpen, 
    authMode, 
    setAuthMode, 
    login, 
    register, 
    resendVerificationEmail 
  } = useAuth();
  
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    location: 'Mumbai, Maharashtra'
  });

  // Password Visibility Toggle
  const [showPassword, setShowPassword] = useState(false);

  // Precise Geolocation Detection State
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Verification Screen State
  const [verificationSent, setVerificationSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  
  // UI Feedback
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend Cooldown Timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Lock background scroll when modal is active
  useEffect(() => {
    if (authModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [authModalOpen]);

  if (!authModalOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleClose = () => {
    setAuthModalOpen(false);
    setVerificationSent(false);
    setError('');
    setSuccessNotice('');
  };

  const handleForgotPasswordClick = () => {
    handleClose();
    navigate('/forgot-password');
  };

  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    setError('');
    try {
      const loc = await getPreciseLocation();
      const detectedText = loc.formattedLocation || `${loc.locality ? loc.locality + ', ' : ''}${loc.city}` || loc.city;
      setFormData((prev) => ({
        ...prev,
        location: detectedText
      }));
    } catch (err) {
      setError(err.message || 'Unable to detect your precise location. Please check browser permissions.');
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessNotice('');
    setLoading(true);

    if (authMode === 'login') {
      const res = await login(formData.email, formData.password);
      if (!res.success) {
        setError(res.message);
      }
    } else {
      if (!formData.name.trim()) {
        setError('Please enter your full name');
        setLoading(false);
        return;
      }
      if (!formData.email.trim()) {
        setError('Please enter your email address');
        setLoading(false);
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        setLoading(false);
        return;
      }

      const res = await register(
        formData.name,
        formData.email,
        formData.password,
        formData.location,
        formData.phone
      );

      if (res.success) {
        handleClose();
      } else {
        setError(res.message || 'Registration failed.');
      }
    }
    setLoading(false);
  };

  // Resend Email Verification Link
  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError('');
    setSuccessNotice('');

    const res = await resendVerificationEmail(registeredEmail);
    setLoading(false);

    if (res.success) {
      setResendCooldown(30);
      setSuccessNotice('A new verification email has been sent!');
    } else {
      setError(res.message || 'Failed to resend verification email.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={handleClose}>
          <X size={20} />
        </button>

        {verificationSent ? (
          /* ============================================================ */
          /* EMAIL VERIFICATION SENT SCREEN                               */
          /* ============================================================ */
          <div style={{ textAlign: 'center', padding: '16px 4px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}
            >
              <Mail size={32} />
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>
              Check Your Email! ✉️
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
              We've sent an activation link to <strong>{registeredEmail}</strong>.<br />
              Please check your inbox and click the verification link to activate your Rentify account.
            </p>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '13px', marginBottom: '16px', textAlign: 'left' }}>
                {error}
              </div>
            )}

            {successNotice && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '13px', marginBottom: '16px', textAlign: 'left' }}>
                {successNotice}
              </div>
            )}

            <div style={{ background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '14px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', textAlign: 'left' }}>
              💡 <strong>Tip:</strong> Don't see the email? Check your Spam or Promotions folder.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                onClick={() => {
                  setVerificationSent(false);
                  setAuthMode('login');
                }}
              >
                Go to Sign In
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onClick={handleResendEmail}
                disabled={resendCooldown > 0 || loading}
              >
                <RotateCw size={14} className={loading ? 'spin' : ''} />
                <span>{resendCooldown > 0 ? `Resend email in ${resendCooldown}s` : 'Resend Verification Email'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* LOG IN / CREATE ACCOUNT FORM                                 */
          /* ============================================================ */
          <div>
            {/* Modal Tab Switcher */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#f1f5f9', padding: '4px', borderRadius: 'var(--radius-md)' }}>
              <button
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: authMode === 'login' ? 'white' : 'transparent',
                  color: authMode === 'login' ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: authMode === 'login' ? 'var(--shadow-sm)' : 'none'
                }}
                onClick={() => { setAuthMode('login'); setError(''); setSuccessNotice(''); }}
              >
                Log In
              </button>
              <button
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: authMode === 'signup' ? 'white' : 'transparent',
                  color: authMode === 'signup' ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: authMode === 'signup' ? 'var(--shadow-sm)' : 'none'
                }}
                onClick={() => { setAuthMode('signup'); setError(''); setSuccessNotice(''); }}
              >
                Create Account
              </button>
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>
              {authMode === 'login' ? 'Welcome Back to Rentify' : 'Join Rentify Today'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
              {authMode === 'login'
                ? 'Access your listings, rentals, and real-time chat.'
                : 'Start renting gear and earning from items you own.'}
            </p>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '13px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {authMode === 'signup' && (
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-light)' }} />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Rahul Sharma"
                      className="form-input"
                      style={{ paddingLeft: '40px', width: '100%' }}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-light)' }} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="form-input"
                    style={{ paddingLeft: '40px', width: '100%' }}
                    required
                  />
                </div>
              </div>

              {authMode === 'signup' && (
                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-light)' }} />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. +91 98765 43210"
                      className="form-input"
                      style={{ paddingLeft: '40px', width: '100%' }}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Password *</label>
                  {authMode === 'login' && (
                    <button
                      type="button"
                      onClick={handleForgotPasswordClick}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-light)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="form-input"
                    style={{ paddingLeft: '40px', paddingRight: '42px', width: '100%' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title={showPassword ? 'Hide password' : 'Show typed password'}
                    aria-label={showPassword ? 'Hide password' : 'Show typed password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {authMode === 'signup' && (
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>City / Location</label>
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={detectingLocation}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Request GPS location permission to auto-fill your exact location"
                    >
                      {detectingLocation ? (
                        <>
                          <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                          <span>Detecting GPS...</span>
                        </>
                      ) : (
                        <>
                          <Crosshair size={13} />
                          <span>Use Precise Location</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-light)' }} />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g. Bandra West, Mumbai"
                      className="form-input"
                      style={{ paddingLeft: '40px', width: '100%' }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: '12px' }}
                disabled={loading}
              >
                {loading
                  ? 'Please wait...'
                  : authMode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
