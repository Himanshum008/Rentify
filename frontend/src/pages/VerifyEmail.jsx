import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight, Home, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { setUser, openAuthModal } = useAuth();

  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token was provided.');
      return;
    }

    const performVerification = async () => {
      try {
        const { data } = await api.get(`/auth/verify-email/${token}`);
        if (data.success) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');

          // Store token and log in user
          if (data.token) {
            localStorage.setItem('rentify_token', data.token);
            localStorage.setItem('rentify_user', JSON.stringify(data.user));
            setUser(data.user);
          }

          // Start redirect countdown
          let timer = 3;
          const interval = setInterval(() => {
            timer -= 1;
            setCountdown(timer);
            if (timer <= 0) {
              clearInterval(interval);
              navigate('/');
            }
          }, 1000);

          return () => clearInterval(interval);
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed.');
        }
      } catch (err) {
        setStatus('error');
        setMessage(
          err.response?.data?.message || 'Verification link is invalid or has already been used.'
        );
      }
    };

    performVerification();
  }, [token, navigate, setUser]);

  return (
    <div className="container" style={{ padding: '80px 20px 120px 20px', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          background: 'white',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xl)',
          padding: '40px 32px',
          boxShadow: 'var(--shadow-xl)',
          textAlign: 'center'
        }}
      >
        {/* Loading State */}
        {status === 'verifying' && (
          <div>
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
                margin: '0 auto 20px auto'
              }}
            >
              <Loader2 size={36} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Verifying Your Email...</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Please wait while we confirm your email address with Rentify security.
            </p>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto'
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px', color: '#059669' }}>Email Verified! 🎉</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '24px', lineHeight: 1.6 }}>
              Your email has been verified and your Rentify account is now active.
            </p>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Redirecting you to the Home page in <strong>{countdown} seconds</strong>...
            </div>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
            >
              <Home size={18} />
              <span>Go to Home Page Now</span>
            </button>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto'
              }}
            >
              <XCircle size={36} />
            </div>

            <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px', color: '#dc2626' }}>Verification Failed</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '28px', lineHeight: 1.5 }}>
              {message}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  navigate('/');
                  setTimeout(() => openAuthModal('login'), 150);
                }}
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
              >
                Go to Log In
              </button>

              <Link to="/" className="btn btn-secondary" style={{ width: '100%' }}>
                Back to Home Page
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
