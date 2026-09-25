import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Star, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  MessageSquare, 
  Share2, 
  Heart, 
  CheckCircle2, 
  User, 
  Clock, 
  Info,
  Cpu,
  Layers,
  ArrowRight,
  Trash2,
  AlertTriangle,
  Package
} from 'lucide-react';
import { FaUserCircle } from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import RentModal from '../components/RentModal';

const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, openAuthModal, toggleWishlist, isWishlisted } = useAuth();
  const { startChatWithOwner } = useSocket();

  const [item, setItem] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'reviews' | 'location'
  const [rentModalOpen, setRentModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Delete Listing Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Review submission state
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [bookedIntervals, setBookedIntervals] = useState([]);

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      try {
        const [itemRes, availRes] = await Promise.all([
          api.get(`/items/${id}`),
          api.get(`/items/${id}/availability`).catch(() => ({ data: { bookedIntervals: [] } }))
        ]);

        if (itemRes.data.success) {
          setItem(itemRes.data.item);
          setReviews(itemRes.data.reviews || []);
        }
        if (availRes.data?.success) {
          setBookedIntervals(availRes.data.bookedIntervals || []);
        }
      } catch (err) {
        console.error('Failed to load item:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '120px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading item details...
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2>Item not found</h2>
        <p style={{ color: 'var(--text-muted)', margin: '16px 0 24px 0' }}>The listing you are looking for might have been removed.</p>
        <button onClick={() => navigate('/explore')} className="btn btn-primary">
          Browse Other Items
        </button>
      </div>
    );
  }

  const wishlisted = isWishlisted(item._id);
  const isOwner = user && (item.owner?._id === user._id || item.owner === user._id);

  const handleChatClick = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (isOwner) {
      alert('This is your own listing!');
      return;
    }
    startChatWithOwner(item.owner, item);
  };

  const handleRentNowClick = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setRentModalOpen(true);
  };

  // Delete Listing Handler
  const handleDeleteListing = async () => {
    setDeleting(true);
    try {
      const { data } = await api.delete(`/items/${item._id}`);
      if (data.success) {
        navigate('/my-rentals?tab=listings');
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
      alert(err.response?.data?.message || 'Failed to delete listing.');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!commentInput.trim()) return;

    setSubmittingReview(true);
    try {
      const { data } = await api.post(`/items/${item._id}/reviews`, {
        rating: ratingInput,
        comment: commentInput.trim()
      });

      if (data.success) {
        setReviews([data.review, ...reviews]);
        setItem((prev) => ({
          ...prev,
          rating: data.itemRating,
          numReviews: data.numReviews
        }));
        setCommentInput('');
      }
    } catch (err) {
      console.error('Review submit failed:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const images = item.images && item.images.length > 0
    ? item.images
    : ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80'];

  const hasReviews = item.numReviews > 0 || reviews.length > 0;
  const currentReviewsCount = item.numReviews || reviews.length;

  return (
    <div className="container" style={{ padding: '24px 0 80px 0' }}>
      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
        <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Home</span>
        <span>/</span>
        <span style={{ cursor: 'pointer' }} onClick={() => navigate(`/explore?category=${item.category}`)}>{item.category}</span>
        <span>/</span>
        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{item.title}</span>
      </div>

      {/* Main Item Layout */}
      <div className="item-details-layout">
        {/* Left: Gallery Section */}
        <div className="gallery-container">
          <div className="gallery-main-image">
            <img
              src={images[activeImageIndex] || images[0]}
              alt={item.title}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect fill='%23f1f5f9' width='600' height='400'/%3E%3Ctext fill='%2364748b' font-family='sans-serif' font-size='20' font-weight='bold' x='50%25' y='50%25' text-anchor='middle' dy='7'%3ERentify Premium Listing%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>

          {/* Gallery Thumbnails */}
          {images.length > 1 && (
            <div className="gallery-thumbnails">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  className={`gallery-thumb-btn ${activeImageIndex === idx ? 'active' : ''}`}
                  onClick={() => setActiveImageIndex(idx)}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect fill='%23f1f5f9' width='80' height='80'/%3E%3Ctext fill='%2364748b' font-family='sans-serif' font-size='10' font-weight='bold' x='50%25' y='50%25' text-anchor='middle' dy='4'%3EPhoto%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info & Actions Panel */}
        <div className="item-info-panel">
          <div>
            <h1 className="item-info-title">{item.title}</h1>
            
            {/* Real Dynamic Rating Row */}
            <div className="item-info-rating-row" style={{ marginTop: '10px' }}>
              {hasReviews ? (
                <>
                  <Star size={18} fill="#F59E0B" color="#F59E0B" />
                  <span style={{ fontWeight: 700 }}>{item.rating ? item.rating.toFixed(1) : '5.0'}</span>
                  <span style={{ color: 'var(--text-muted)' }}>({currentReviewsCount} {currentReviewsCount === 1 ? 'review' : 'reviews'})</span>
                </>
              ) : (
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ✨ New Listing (No reviews yet)
                </span>
              )}
            </div>
          </div>

          {/* Pricing & Deposit Card */}
          <div className="item-info-price-card">
            <div className="item-info-price-header">
              <div>
                <span className="item-info-price-large">₹{item.pricePerDay?.toLocaleString('en-IN')}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 500, marginLeft: '4px' }}>/ day</span>
              </div>
              <div className="item-info-deposit">
                ₹{item.securityDeposit ? item.securityDeposit.toLocaleString('en-IN') : '0'} security deposit
              </div>
            </div>

            <div className="item-info-location-tag">
              <MapPin size={16} color="var(--primary)" />
              <span>{item.location || 'Mumbai'} • {item.distance || '2.1 km'}</span>
            </div>

            {/* Availability Date Box */}
            <div className="availability-box">
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: bookedIntervals.length > 0 ? '#b45309' : '#059669' }}>
                  {bookedIntervals.length > 0 ? 'Partially Booked' : 'Available'}
                </div>
                <div className="availability-dates" style={{ fontSize: '13px', marginTop: '2px' }}>
                  {bookedIntervals.length > 0 ? (
                    <span>Reserved: {bookedIntervals.map(inv => `${new Date(inv.startDate).toLocaleDateString()} - ${new Date(inv.endDate).toLocaleDateString()}`).join(', ')}</span>
                  ) : (
                    <span>Available for instant booking</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setRentModalOpen(true)}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              >
                Select dates
              </button>
            </div>
          </div>

          {/* Owner Card with Real Dynamic Ratings */}
          {item.owner && (
            <div className="owner-card">
              <div className="owner-info">
                {item.owner.avatar ? (
                  <img
                    src={item.owner.avatar}
                    alt={item.owner.name}
                    className="owner-avatar"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <FaUserCircle size={44} color="#64748b" className="owner-avatar-icon" />
                )}
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {isOwner ? 'Your Listing' : 'Owner'}
                  </div>
                  <div className="owner-name">{item.owner.name}</div>
                  <div className="owner-rating">
                    {item.owner.rating > 0 ? (
                      <>⭐ {item.owner.rating.toFixed(1)} ({item.owner.rentalsCount || 0} listings)</>
                    ) : (
                      <>⭐ New Lender ({item.owner.rentalsCount || 0} listings)</>
                    )}
                  </div>
                </div>
              </div>

              <button
                className="btn btn-secondary"
                style={{ fontSize: '13px', padding: '8px 14px' }}
                onClick={() => alert(`Lender: ${item.owner.name}\nLocation: ${item.owner.location || 'Mumbai'}\nVerified Member since 2024`)}
              >
                View Profile
              </button>
            </div>
          )}

          {/* Action Buttons: Owner Controls VS Borrower Actions */}
          <div className="item-actions-group">
            {isOwner ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                <div
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    fontSize: '13px',
                    color: '#1e40af',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Package size={16} />
                  <span>You are the owner of this listed item</span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => navigate('/my-rentals?tab=listings')}
                    className="btn btn-secondary btn-lg"
                    style={{ flex: 1, fontSize: '15px' }}
                  >
                    My Dashboard
                  </button>

                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="btn btn-lg"
                    style={{
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: '1px solid #fca5a5',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    id="btn-delete-listing"
                  >
                    <Trash2 size={18} />
                    <span>Delete Listing</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={handleRentNowClick}
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', fontSize: '16px' }}
                  id="btn-rent-now"
                >
                  Rent Now
                </button>

                <button
                  onClick={handleChatClick}
                  className="btn btn-outline-primary btn-lg"
                  style={{ width: '100%', fontSize: '16px' }}
                  id="btn-chat-owner"
                >
                  <MessageSquare size={18} />
                  <span>Chat Owner</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation & Content */}
      <div style={{ marginTop: '48px' }}>
        <div className="tabs-navigation">
          <button
            className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button
            className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews ({reviews.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'location' ? 'active' : ''}`}
            onClick={() => setActiveTab('location')}
          >
            Location
          </button>
        </div>

        {/* Tab 1: Details */}
        {activeTab === 'details' && (
          <div style={{ padding: '32px 0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>Description</h3>
            <p style={{ color: 'var(--text-main)', lineHeight: 1.7, maxWidth: '850px', marginBottom: '36px' }}>
              {item.description}
            </p>

            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Features & Specs</h3>
            <div className="features-grid">
              {item.features && item.features.length > 0 ? (
                item.features.map((feat, idx) => (
                  <div key={idx} className="feature-pill">
                    <CheckCircle2 size={16} color="var(--primary)" />
                    <span>{feat}</span>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)' }}>Verified gear in ready-to-use condition.</div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Reviews */}
        {activeTab === 'reviews' && (
          <div style={{ padding: '32px 0', maxWidth: '850px' }}>
            {/* Add Review Box */}
            <div style={{ background: 'white', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', marginBottom: '32px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>Leave a Review</h4>
              <form onSubmit={handleReviewSubmit}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingInput(star)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                    >
                      <Star
                        size={22}
                        fill={star <= ratingInput ? '#F59E0B' : 'none'}
                        color={star <= ratingInput ? '#F59E0B' : '#cbd5e1'}
                      />
                    </button>
                  ))}
                </div>

                <div className="form-group">
                  <textarea
                    rows={3}
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Share your rental experience with this item..."
                    className="form-input"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingReview}
                >
                  {submittingReview ? 'Posting...' : 'Submit Review'}
                </button>
              </form>
            </div>

            {/* Reviews List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {reviews.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', padding: '20px 0' }}>
                  No reviews yet for this item. Be the first to rent and leave a review!
                </div>
              ) : (
                reviews.map((rev) => (
                  <div
                    key={rev._id}
                    style={{
                      background: 'white',
                      padding: '20px',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-light)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {rev.user?.avatar ? (
                          <img
                            src={rev.user.avatar}
                            alt={rev.user?.name}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <FaUserCircle size={36} color="#94a3b8" />
                        )}
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700 }}>{rev.user?.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} size={14} fill="#F59E0B" color="#F59E0B" />
                        ))}
                      </div>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-main)', lineHeight: 1.5 }}>
                      {rev.comment}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Location */}
        {activeTab === 'location' && (
          <div style={{ padding: '32px 0' }}>
            <div style={{ background: 'white', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', maxWidth: '600px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 700 }}>Pickup & Dropoff Location</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{item.address || 'Bandra West, Mumbai'}</p>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Exact meetup address and contact details will be shared directly upon rental confirmation and via real-time chat with <strong>{item.owner?.name}</strong>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Item Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop" onClick={() => !deleting && setShowDeleteModal(false)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', padding: '12px 4px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}
              >
                <AlertTriangle size={28} />
              </div>

              <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px', color: 'var(--text-main)' }}>
                Delete Listing?
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.5, marginBottom: '24px' }}>
                Are you sure you want to delete <strong>"{item.title}"</strong>? This will permanently remove the item listing and all associated reviews.
              </p>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{
                    flex: 1,
                    backgroundColor: '#dc2626',
                    color: 'white',
                    fontWeight: 700
                  }}
                  onClick={handleDeleteListing}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rent Booking Modal */}
      <RentModal
        item={item}
        isOpen={rentModalOpen}
        onClose={() => setRentModalOpen(false)}
      />
    </div>
  );
};

export default ItemDetails;
