import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ItemCard = ({ item }) => {
  const { toggleWishlist, isWishlisted } = useAuth();
  const wishlisted = isWishlisted(item._id);

  const handleHeartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(item._id);
  };

  const primaryImage =
    item.images && item.images.length > 0
      ? item.images[0]
      : 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';

  return (
    <div className="item-card">
      <div className="item-card-image-wrap">
        <Link to={`/item/${item._id}`}>
          <img
            src={primaryImage}
            alt={item.title}
            className="item-card-image"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23f1f5f9' width='400' height='300'/%3E%3Ctext fill='%2364748b' font-family='sans-serif' font-size='16' font-weight='bold' x='50%25' y='50%25' text-anchor='middle' dy='6'%3ERentify Item%3C/text%3E%3C/svg%3E";
            }}
          />
        </Link>
        <button
          className={`item-heart-btn ${wishlisted ? 'active' : ''}`}
          onClick={handleHeartClick}
          title={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-label="Wishlist"
        >
          <Heart size={16} fill={wishlisted ? '#ef4444' : 'none'} color={wishlisted ? '#ef4444' : 'currentColor'} />
        </button>
      </div>

      <div className="item-card-body">
        <Link to={`/item/${item._id}`}>
          <h3 className="item-card-title" title={item.title}>
            {item.title}
          </h3>
        </Link>

        <div className="item-card-price-row">
          <span className="item-card-price">₹{item.pricePerDay?.toLocaleString('en-IN')}</span>
          <span className="item-card-unit">/ day</span>
        </div>

        <div className="item-card-footer">
          <div className="item-card-rating">
            {item.numReviews && item.numReviews > 0 ? (
              <>
                <Star size={14} fill="#F59E0B" color="#F59E0B" />
                <span>{item.rating ? item.rating.toFixed(1) : '5.0'}</span>
                <span className="item-card-reviews">({item.numReviews})</span>
              </>
            ) : (
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                ✨ New
              </span>
            )}
          </div>

          <div className="item-card-location">
            <MapPin size={13} />
            <span>
              {item.location || 'Mumbai'}
              {item.distance ? ` • ${item.distance}` : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
