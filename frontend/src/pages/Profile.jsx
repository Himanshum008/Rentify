import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Star, 
  Calendar, 
  Package, 
  ShoppingBag, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  MessageSquare,
  ShieldCheck,
  Upload,
  Loader2,
  Crosshair,
  Eye,
  EyeOff
} from 'lucide-react';
import { FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { getPreciseLocation } from '../utils/geolocation';
import api from '../services/api';

const Profile = () => {
  const { user, updateUserProfile, openAuthModal } = useAuth();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'listings' | 'reviews_received' | 'reviews_given'
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    bio: '',
    avatar: ''
  });
  const [reviewsData, setReviewsData] = useState({
    receivedReviews: [],
    givenReviews: [],
    totalReceived: 0,
    totalGiven: 0
  });
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [myListings, setMyListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [togglingItemId, setTogglingItemId] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    setMessage({ type: '', text: '' });
    try {
      const loc = await getPreciseLocation();
      const detectedText = loc.formattedLocation || `${loc.locality ? loc.locality + ', ' : ''}${loc.city}` || loc.city;
      setFormData((prev) => ({
        ...prev,
        location: detectedText
      }));
      setMessage({ type: 'success', text: `Location detected: ${detectedText}` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to detect precise location.' });
    } finally {
      setDetectingLocation(false);
    }
  };

  // Initialize form data from user
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || '',
        avatar: user.avatar || ''
      });
      fetchUserReviews();
      fetchMyListings();
    }
  }, [user]);

  const fetchUserReviews = async () => {
    setLoadingReviews(true);
    try {
      const { data } = await api.get('/auth/reviews');
      if (data.success) {
        setReviewsData({
          receivedReviews: data.receivedReviews || [],
          givenReviews: data.givenReviews || [],
          totalReceived: data.totalReceived || 0,
          totalGiven: data.totalGiven || 0
        });
      }
    } catch (err) {
      console.error('Failed to load user reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchMyListings = async () => {
    setLoadingListings(true);
    try {
      const { data } = await api.get('/items/my/listings');
      if (data.success) {
        setMyListings(data.items || []);
      }
    } catch (err) {
      console.error('Failed to load user listings in profile:', err);
    } finally {
      setLoadingListings(false);
    }
  };

  const handleToggleAvailability = async (itemId) => {
    setTogglingItemId(itemId);
    try {
      const { data } = await api.patch(`/items/${itemId}/toggle-availability`);
      if (data.success) {
        setMyListings((prev) =>
          prev.map((i) =>
            i._id === itemId
              ? {
                  ...i,
                  isAvailable: data.isAvailable,
                  status: data.item?.status || (data.isAvailable ? 'available' : 'inactive')
                }
              : i
          )
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update item availability');
    } finally {
      setTogglingItemId(null);
    }
  };

  if (!user) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>Please Log In</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Log in to view and edit your profile.</p>
        <button onClick={() => openAuthModal('login')} className="btn btn-primary btn-lg">Log In</button>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage({ type: '', text: '' });
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAvatar(true);
    setMessage({ type: '', text: '' });

    const uploadData = new FormData();
    uploadData.append('images', file);

    try {
      const { data } = await api.post('/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data.success && data.urls && data.urls.length > 0) {
        const newAvatarUrl = data.urls[0];
        setFormData((prev) => ({ ...prev, avatar: newAvatarUrl }));
        
        // Auto-save avatar to profile
        await updateUserProfile({ avatar: newAvatarUrl });
        setMessage({ type: 'success', text: 'Profile photo updated successfully!' });
      }
    } catch (err) {
      console.error('Avatar upload failed:', err);
      // Fallback: Read as Data URL directly
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Url = reader.result;
        setFormData((prev) => ({ ...prev, avatar: base64Url }));
        await updateUserProfile({ avatar: base64Url });
        setMessage({ type: 'success', text: 'Profile photo updated successfully!' });
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    const res = await updateUserProfile(formData);
    setSaving(false);

    if (res.success) {
      setMessage({ type: 'success', text: 'Profile details saved successfully!' });
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to update profile' });
    }
  };

  return (
    <div className="container" style={{ padding: '32px 0 80px 0' }}>
      {/* Hidden File Input for Avatar */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarFileChange}
        accept="image/png, image/jpeg, image/webp"
        style={{ display: 'none' }}
      />

      {/* Profile Header Banner */}
      <div
        style={{
          background: 'white',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xl)',
          padding: '36px',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '32px'
        }}
      >
        <div className="profile-header-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            {/* Avatar with Upload Hover Button */}
            <div style={{ position: 'relative', width: '100px', height: '100px' }}>
              {formData.avatar ? (
                <img
                  src={formData.avatar}
                  alt={formData.name}
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid var(--primary-light)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <FaUserCircle size={100} color="#94a3b8" />
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Change profile photo"
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: 'white',
                  border: '2px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {uploadingAvatar ? (
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Camera size={16} />
                )}
              </button>
            </div>

            {/* Basic Info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 800 }}>{user.name}</h1>
                <span className="badge badge-primary">Verified Member</span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '14px', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={15} />
                  <span>{user.email}</span>
                </div>
                {user.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={15} color="var(--primary)" />
                    <span>{user.phone}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={15} />
                  <span>{user.location || 'Mumbai, Maharashtra'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ display: 'flex', gap: '24px', background: 'var(--bg-subtle)', padding: '16px 24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>{user.rentalsCount || 0}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Rentals</div>
            </div>
            <div style={{ width: '1px', background: 'var(--border-light)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                {user.rating && user.rating > 0 && reviewsData.totalReceived > 0 ? (
                  <>
                    <Star size={18} fill="#F59E0B" />
                    <span>{user.rating.toFixed(1)}</span>
                  </>
                ) : (
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-muted)' }}>None</span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Rating</div>
            </div>
            <div style={{ width: '1px', background: 'var(--border-light)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#059669' }}>{reviewsData.totalReceived}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Reviews</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '2px solid var(--border-light)', marginBottom: '32px', flexWrap: 'wrap' }}>
        <button
          className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Edit3 size={18} />
          <span>Edit Profile Details</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'listings' ? 'active' : ''}`}
          onClick={() => setActiveTab('listings')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Package size={18} />
          <span>My Listings & Availability ({myListings.length})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'reviews_received' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews_received')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Star size={18} />
          <span>Reviews on My Items ({reviewsData.totalReceived})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'reviews_given' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews_given')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <MessageSquare size={18} />
          <span>Reviews I've Given ({reviewsData.totalGiven})</span>
        </button>
      </div>

      {/* TAB 1: Edit Profile Details */}
      {activeTab === 'details' && (
        <div style={{ maxWidth: '680px' }}>
          <div
            style={{
              background: 'white',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xl)',
              padding: '32px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>Personal Information</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
              Keep your contact details up to date so lenders and renters can reach you smoothly.
            </p>

            {message.text && (
              <div
                style={{
                  background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                  color: message.type === 'success' ? '#059669' : '#dc2626',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px',
                  marginBottom: '20px'
                }}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSaveProfile}>
              {/* Photo Upload Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', marginBottom: '24px', border: '1px solid var(--border-light)' }}>
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt="Avatar Preview"
                    style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <FaUserCircle size={60} color="#94a3b8" />
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '2px' }}>Profile Photo</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>JPG, PNG or WEBP (Max 5MB)</div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={14} />
                    <span>Upload New Photo</span>
                  </button>
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-light)' }} />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="form-input"
                      style={{ paddingLeft: '40px', width: '100%' }}
                      required
                    />
                  </div>
                </div>

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
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label className="form-label">Email Address (Read-only)</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-light)' }} />
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="form-input"
                      style={{ paddingLeft: '40px', width: '100%', background: '#f1f5f9', cursor: 'not-allowed' }}
                    />
                  </div>
                </div>

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
                      title="Auto-detect current location via browser GPS"
                    >
                      {detectingLocation ? (
                        <>
                          <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                          <span>Detecting GPS...</span>
                        </>
                      ) : (
                        <>
                          <Crosshair size={13} />
                          <span>Detect Precise Location</span>
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
              </div>

              <div className="form-group">
                <label className="form-label">About Me / Bio</label>
                <textarea
                  rows={3}
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell the community about yourself and your hobbies..."
                  className="form-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: '12px' }}
                disabled={saving}
              >
                {saving ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB: My Listed Items & Availability Control */}
      {activeTab === 'listings' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>My Listed Items & Rental Availability</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                Control which items other users can rent. If you don't want to give an item right now, pause it here until you give permission.
              </p>
            </div>
            <Link to="/list-item" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Package size={16} />
              <span>List New Item</span>
            </Link>
          </div>

          {loadingListings ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>Loading listings...</div>
          ) : myListings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
              <Package size={40} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>No items listed yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>Upload items you own to start earning rental income!</p>
              <Link to="/list-item" className="btn btn-primary">List Your First Item</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '20px' }}>
              {myListings.map((item) => (
                <div
                  key={item._id}
                  style={{
                    background: 'white',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <img
                    src={item.images?.[0] || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80'}
                    alt={item.title}
                    style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                  />
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge badge-primary">{item.category}</span>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--dark)' }}>
                        ₹{item.pricePerDay?.toLocaleString('en-IN')} <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>/day</span>
                      </span>
                    </div>

                    <h4 style={{ fontSize: '16px', fontWeight: 700 }}>{item.title}</h4>

                    {/* Status Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Marketplace Status:</span>
                      {(item.status === 'booked' || item.status === 'rented') ? (
                        <span style={{ color: '#b45309', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          🔒 Booked (On Rent)
                        </span>
                      ) : item.isAvailable ? (
                        <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          🟢 Available to Rent
                        </span>
                      ) : (
                        <span style={{ color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          ⚪ Paused / Hidden
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', gap: '8px' }}>
                      <Link to={`/item/${item._id}`} className="btn btn-secondary" style={{ fontSize: '12px', padding: '7px 12px' }}>
                        View Item
                      </Link>

                      {/* Owner Permission to Make Available / Pause */}
                      {(item.status === 'booked' || item.status === 'rented') ? (
                        <span style={{ fontSize: '12px', color: '#b45309', fontWeight: 700 }}>
                          Currently Rented
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleAvailability(item._id)}
                          disabled={togglingItemId === item._id}
                          className="btn"
                          style={{
                            fontSize: '12px',
                            padding: '7px 12px',
                            background: item.isAvailable ? '#f1f5f9' : '#ecfdf5',
                            color: item.isAvailable ? '#475569' : '#059669',
                            border: `1.5px solid ${item.isAvailable ? '#cbd5e1' : '#10b981'}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: 700
                          }}
                          title={item.isAvailable ? "Pause item so others cannot rent it" : "Give permission to make item available for rent"}
                        >
                          {item.isAvailable ? <EyeOff size={14} /> : <Eye size={14} />}
                          <span>{item.isAvailable ? 'Pause Listing' : 'Make Available'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Reviews Received on User's Items (What, When, Who, Which Item) */}
      {activeTab === 'reviews_received' && (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Reviews on My Listed Items</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Detailed reviews left by verified renters who booked your gear.
            </p>
          </div>

          {loadingReviews ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>Loading reviews...</div>
          ) : reviewsData.receivedReviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
              <Star size={36} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>No reviews received yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>When other users rent and review your items, their feedback will show up here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {reviewsData.receivedReviews.map((rev) => (
                <div
                  key={rev._id}
                  style={{
                    background: 'white',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '24px',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  {/* Top Bar: Who gave it & When & Rating */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                    {/* WHO: Reviewer Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      {rev.user?.avatar ? (
                        <img
                          src={rev.user.avatar}
                          alt={rev.user?.name || 'Reviewer'}
                          style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <FaUserCircle size={48} color="#94a3b8" />
                      )}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '16px' }}>{rev.user?.name || 'Verified Renter'}</span>
                          <span className="badge badge-success" style={{ fontSize: '11px' }}>Renter</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '12px', marginTop: '2px' }}>
                          <span>📍 {rev.user?.location || 'Mumbai'}</span>
                          {rev.user?.phone && <span>📞 {rev.user.phone}</span>}
                        </div>
                      </div>
                    </div>

                    {/* WHEN: Date & Time & WHAT: Rating */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginBottom: '4px' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            fill={i < rev.rating ? '#F59E0B' : 'none'}
                            color={i < rev.rating ? '#F59E0B' : '#cbd5e1'}
                          />
                        ))}
                        <span style={{ fontWeight: 700, fontSize: '14px', marginLeft: '4px' }}>{rev.rating}.0</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        <span>{new Date(rev.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(rev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* WHAT: Review Comment */}
                  <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: '16px' }}>
                    <p style={{ fontSize: '15px', color: 'var(--text-main)', lineHeight: 1.6 }}>
                      "{rev.comment}"
                    </p>
                  </div>

                  {/* WHICH ITEM: Item Details & Link */}
                  {rev.item && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={rev.item.images?.[0] || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=100&q=80'}
                          alt={rev.item.title}
                          style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Review given on item:</div>
                          <span style={{ fontWeight: 700, fontSize: '14px' }}>{rev.item.title}</span>
                        </div>
                      </div>

                      <Link to={`/item/${rev.item._id}`} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 14px' }}>
                        View Item Listing
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Reviews Written / Given by User (What, When, Which Item) */}
      {activeTab === 'reviews_given' && (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Reviews I've Given</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Feedback you have posted for items you rented from other community members.
            </p>
          </div>

          {loadingReviews ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>Loading reviews...</div>
          ) : reviewsData.givenReviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
              <MessageSquare size={36} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>You haven't reviewed any items yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Rent gear from other users and share your experience!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {reviewsData.givenReviews.map((rev) => (
                <div
                  key={rev._id}
                  style={{
                    background: 'white',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '24px',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          fill={i < rev.rating ? '#F59E0B' : 'none'}
                          color={i < rev.rating ? '#F59E0B' : '#cbd5e1'}
                        />
                      ))}
                      <span style={{ fontWeight: 700, fontSize: '14px', marginLeft: '4px' }}>{rev.rating}.0</span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      <span>{new Date(rev.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '15px', color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '16px' }}>
                    "{rev.comment}"
                  </p>

                  {rev.item && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '10px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={rev.item.images?.[0] || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=100&q=80'}
                          alt={rev.item.title}
                          style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }}
                        />
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{rev.item.title}</span>
                      </div>
                      <Link to={`/item/${rev.item._id}`} className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 10px' }}>
                        View Item
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
