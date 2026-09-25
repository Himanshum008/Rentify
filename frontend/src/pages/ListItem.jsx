import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  Laptop, 
  Car, 
  Wrench, 
  Gamepad2, 
  Armchair, 
  Shirt, 
  BookOpen, 
  MoreHorizontal,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  X,
  Sparkles,
  MapPin,
  IndianRupee,
  ShieldCheck,
  Crosshair,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getPreciseLocation } from '../utils/geolocation';
import ImageUploadDropzone from '../components/ImageUploadDropzone';
import api from '../services/api';

const CATEGORY_OPTIONS = [
  { name: 'Camera', label: 'Camera', icon: Camera, color: '#2563eb', bg: '#eff6ff' },
  { name: 'Laptop', label: 'Laptop', icon: Laptop, color: '#3b82f6', bg: '#eff6ff' },
  { name: 'Vehicle', label: 'Vehicle', icon: Car, color: '#ec4899', bg: '#fdf2f8' },
  { name: 'Tools', label: 'Tools', icon: Wrench, color: '#f59e0b', bg: '#fffbeb' },
  { name: 'Gaming', label: 'Gaming', icon: Gamepad2, color: '#8b5cf6', bg: '#f5f3ff' },
  { name: 'Furniture', label: 'Furniture', icon: Armchair, color: '#f97316', bg: '#fff7ed' },
  { name: 'Fashion', label: 'Fashion', icon: Shirt, color: '#a855f7', bg: '#faf5ff' },
  { name: 'Books', label: 'Books', icon: BookOpen, color: '#06b6d4', bg: '#ecfeff' },
  { name: 'Other', label: 'Other', icon: MoreHorizontal, color: '#64748b', bg: '#f1f5f9' }
];

const ListItem = () => {
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    category: 'Camera',
    title: '',
    description: '',
    condition: 'Like New',
    location: user?.location || 'Mumbai',
    address: 'Bandra West, Mumbai',
    pricePerDay: '',
    securityDeposit: '',
    minRentalDays: 1,
    images: [],
    features: ['Like New Condition', 'Ready to Use']
  });

  const [newFeatureInput, setNewFeatureInput] = useState('');

  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    setError('');
    try {
      const loc = await getPreciseLocation();
      const detectedCity = loc.city || 'Mumbai';
      const detectedAddress = loc.formattedLocation || (loc.locality ? `${loc.locality}, ${loc.city}` : loc.city);
      setFormData((prev) => ({
        ...prev,
        location: detectedCity,
        address: detectedAddress
      }));
    } catch (err) {
      setError(err.message || 'Unable to detect precise location. Please allow browser location access.');
    } finally {
      setDetectingLocation(false);
    }
  };

  // Protect listing page
  if (!user) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>Please Log In to List an Item</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          You need a Rentify account to create listings and rent out your items.
        </p>
        <button onClick={() => openAuthModal('login')} className="btn btn-primary btn-lg">
          Log In / Create Account
        </button>
      </div>
    );
  }

  const handleAddFeature = (e) => {
    e.preventDefault();
    if (!newFeatureInput.trim()) return;
    setFormData({
      ...formData,
      features: [...formData.features, newFeatureInput.trim()]
    });
    setNewFeatureInput('');
  };

  const handleRemoveFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, idx) => idx !== index)
    });
  };

  // Step Validation & Navigation
  const handleNext = () => {
    setError('');
    if (currentStep === 1) {
      if (!formData.category) {
        setError('Please select a category for your item.');
        return;
      }
      if (!formData.title.trim()) {
        setError('Please enter a descriptive item title.');
        return;
      }
      if (!formData.description.trim()) {
        setError('Please provide a description of your item.');
        return;
      }
    } else if (currentStep === 2) {
      if (formData.images.length === 0) {
        setError('Please upload at least 1 photo of your item.');
        return;
      }
    } else if (currentStep === 3) {
      if (!formData.pricePerDay || Number(formData.pricePerDay) <= 0) {
        setError('Please enter a valid rental price per day.');
        return;
      }
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError('');
    setCurrentStep((prev) => prev - 1);
  };

  const handlePublish = async () => {
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/items', {
        ...formData,
        pricePerDay: Number(formData.pricePerDay),
        securityDeposit: Number(formData.securityDeposit) || 0,
        minRentalDays: Number(formData.minRentalDays) || 1
      });

      if (data.success) {
        navigate(`/item/${data.item._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish listing.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '20px 0 80px 0' }}>
      <div className="wizard-container">
        {/* Step Indicator matching Screenshots 2 & 3 */}
        <div className="wizard-steps-header">
          <ul className="wizard-steps-list">
            <li className={`wizard-step-item ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}>
              <span className="step-number-badge">{currentStep > 1 ? <Check size={14} /> : '1'}</span>
              <span>Details</span>
            </li>
            <div style={{ width: '32px', height: '2px', background: currentStep > 1 ? 'var(--primary)' : 'var(--border-light)' }}></div>

            <li className={`wizard-step-item ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}>
              <span className="step-number-badge">{currentStep > 2 ? <Check size={14} /> : '2'}</span>
              <span>Photos</span>
            </li>
            <div style={{ width: '32px', height: '2px', background: currentStep > 2 ? 'var(--primary)' : 'var(--border-light)' }}></div>

            <li className={`wizard-step-item ${currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : ''}`}>
              <span className="step-number-badge">{currentStep > 3 ? <Check size={14} /> : '3'}</span>
              <span>Pricing</span>
            </li>
            <div style={{ width: '32px', height: '2px', background: currentStep > 3 ? 'var(--primary)' : 'var(--border-light)' }}></div>

            <li className={`wizard-step-item ${currentStep === 4 ? 'active' : ''}`}>
              <span className="step-number-badge">4</span>
              <span>Publish</span>
            </li>
          </ul>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '14px', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        {/* STEP 1: Details & Category Selection (Screenshot 2) */}
        {currentStep === 1 && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px' }}>What are you renting out?</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
              Choose a category for your item
            </p>

            {/* Category Grid matching Screenshot 2 */}
            <div className="wizard-category-grid">
              {CATEGORY_OPTIONS.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = formData.category.toLowerCase() === cat.name.toLowerCase();
                return (
                  <div
                    key={cat.name}
                    className={`wizard-category-card ${isSelected ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, category: cat.name })}
                  >
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: cat.bg,
                        color: cat.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <IconComponent size={28} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '15px' }}>{cat.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Details Fields */}
            <div style={{ marginTop: '32px', borderTop: '1px solid var(--border-light)', paddingTop: '24px' }}>
              <div className="form-group">
                <label className="form-label">Item Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Sony Alpha DSLR Camera with 18-55mm Lens"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your item, accessories included, and pickup instructions..."
                  className="form-input"
                  style={{ resize: 'vertical' }}
                  required
                />
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label className="form-label">Condition</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="form-input"
                  >
                    <option value="Brand New">Brand New</option>
                    <option value="Like New">Like New</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                  </select>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>City *</label>
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
                      title="Auto-detect current location"
                    >
                      {detectingLocation ? (
                        <>
                          <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                          <span>Detecting GPS...</span>
                        </>
                      ) : (
                        <>
                          <Crosshair size={13} />
                          <span>Auto-detect GPS</span>
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Mumbai, Pune, Thane"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Pickup Address / Locality</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-light)' }} />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. Bandra West, Mumbai"
                    className="form-input"
                    style={{ paddingLeft: '40px', width: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* Step 1 Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
              <button onClick={handleNext} className="btn btn-primary btn-lg">
                <span>Continue</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Photos Upload with Cloudinary (Screenshot 3) */}
        {currentStep === 2 && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px' }}>Add photos of your item</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
              Upload clear and high-quality images. You can add up to 10 photos.
            </p>

            <ImageUploadDropzone
              images={formData.images}
              setImages={(newImgs) => setFormData({ ...formData, images: typeof newImgs === 'function' ? newImgs(formData.images) : newImgs })}
              maxPhotos={10}
            />

            {/* Step 2 Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
              <button onClick={handleBack} className="btn btn-secondary btn-lg">
                <ArrowLeft size={18} />
                <span>Back</span>
              </button>

              <button onClick={handleNext} className="btn btn-primary btn-lg">
                <span>Continue</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Pricing, Security Deposit & Specs */}
        {currentStep === 3 && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px' }}>Set your rental pricing</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
              Define your daily rate, security deposit, and highlight key features.
            </p>

            <div className="form-row-2col" style={{ marginBottom: '24px' }}>
              <div className="form-group">
                <label className="form-label">Price per Day (₹) *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>₹</span>
                  <input
                    type="number"
                    value={formData.pricePerDay}
                    onChange={(e) => setFormData({ ...formData, pricePerDay: e.target.value })}
                    placeholder="e.g. 800"
                    className="form-input"
                    style={{ paddingLeft: '32px', fontSize: '16px', fontWeight: 700 }}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Security Deposit (₹)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>₹</span>
                  <input
                    type="number"
                    value={formData.securityDeposit}
                    onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                    placeholder="e.g. 4000 (Refundable)"
                    className="form-input"
                    style={{ paddingLeft: '32px' }}
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Minimum Rental Duration (Days)</label>
              <input
                type="number"
                value={formData.minRentalDays}
                onChange={(e) => setFormData({ ...formData, minRentalDays: e.target.value })}
                className="form-input"
                min="1"
                style={{ maxWidth: '160px' }}
              />
            </div>

            {/* Features Tags Builder */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
              <label className="form-label" style={{ marginBottom: '8px' }}>Key Highlights & Features</label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                <input
                  type="text"
                  value={newFeatureInput}
                  onChange={(e) => setNewFeatureInput(e.target.value)}
                  placeholder="e.g. 24.2 MP Sensor, Full HD Video, WiFi Included..."
                  className="form-input"
                  style={{ flex: 1 }}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFeature(e)}
                />
                <button type="button" onClick={handleAddFeature} className="btn btn-secondary">
                  <Plus size={16} />
                  <span>Add</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {formData.features.map((feature, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '13px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>{feature}</span>
                    <X size={14} style={{ cursor: 'pointer' }} onClick={() => handleRemoveFeature(idx)} />
                  </span>
                ))}
              </div>
            </div>

            {/* Step 3 Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '36px' }}>
              <button onClick={handleBack} className="btn btn-secondary btn-lg">
                <ArrowLeft size={18} />
                <span>Back</span>
              </button>

              <button onClick={handleNext} className="btn btn-primary btn-lg">
                <span>Continue</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Review & Publish */}
        {currentStep === 4 && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px' }}>Review & Publish</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
              Everything looks great! Review your listing before making it live on Rentify.
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
                <img
                  src={formData.images[0]}
                  alt={formData.title}
                  style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                />
                <div>
                  <span className="badge badge-primary" style={{ marginBottom: '6px' }}>{formData.category}</span>
                  <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{formData.title}</h3>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                    ₹{Number(formData.pricePerDay).toLocaleString('en-IN')} <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>/ day</span>
                  </div>
                </div>
              </div>

              <div className="form-row-3col" style={{ background: 'white', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '13px' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Location</div>
                  <div style={{ fontWeight: 700 }}>{formData.location}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Deposit</div>
                  <div style={{ fontWeight: 700 }}>₹{Number(formData.securityDeposit || 0).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Condition</div>
                  <div style={{ fontWeight: 700 }}>{formData.condition}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '36px' }}>
              <button onClick={handleBack} className="btn btn-secondary btn-lg">
                <ArrowLeft size={18} />
                <span>Back</span>
              </button>

              <button onClick={handlePublish} className="btn btn-primary btn-lg" disabled={submitting}>
                {submitting ? 'Publishing...' : '🚀 Publish Item Now'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListItem;
