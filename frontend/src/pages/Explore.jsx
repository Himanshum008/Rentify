import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, SlidersHorizontal, ArrowUpDown, Crosshair, Loader2 } from 'lucide-react';
import api from '../services/api';
import ItemCard from '../components/ItemCard';
import { getPreciseLocation } from '../utils/geolocation';

const CATEGORY_LIST = [
  'Cameras',
  'Electronics',
  'Vehicles',
  'Tools',
  'Gaming',
  'Furniture',
  'Fashion',
  'Books',
  'Others'
];

const Explore = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filter States
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategories, setSelectedCategories] = useState(
    searchParams.get('category') ? [searchParams.get('category')] : []
  );
  const [maxPrice, setMaxPrice] = useState(5000);
  const [location, setLocation] = useState(searchParams.get('location') || 'Mumbai');
  const [within10km, setWithin10km] = useState(false);
  const [availability, setAvailability] = useState('Anytime');
  const [sortBy, setSortBy] = useState('recent');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    try {
      const loc = await getPreciseLocation();
      if (loc.city) {
        setLocation(loc.city);
      }
    } catch (err) {
      alert(err.message || 'Unable to retrieve location.');
    } finally {
      setDetectingLocation(false);
    }
  };

  useEffect(() => {
    fetchFilteredItems();
  }, [searchParams, sortBy]);

  const fetchFilteredItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategories.length > 0) params.append('category', selectedCategories.join(','));
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (location && location !== 'All') params.append('location', location);
      if (availability !== 'Anytime') params.append('availability', availability);
      if (sortBy) params.append('sort', sortBy);

      const { data } = await api.get(`/items?${params.toString()}`);
      if (data.success) {
        setItems(data.items);
        setTotalCount(data.total);
      }
    } catch (err) {
      console.error('Failed to filter items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleApplyFilters = () => {
    fetchFilteredItems();
    setShowMobileFilters(false);
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setMaxPrice(5000);
    setLocation('Mumbai');
    setAvailability('Anytime');
    setSearchQuery('');
    setSearchParams({});
    setShowMobileFilters(false);
  };

  return (
    <div className="container">
      {/* Top Filter Bar matching Screenshot 4 */}
      <div className="explore-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '200px' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
            placeholder="Search anything..."
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--text-muted)' }}>
            <MapPin size={16} color="var(--primary)" />
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}
            >
              {location && !['Mumbai', 'Thane', 'Pune', 'Delhi', 'Bengaluru', 'All'].includes(location) && (
                <option value={location}>📍 {location}</option>
              )}
              <option value="Mumbai">Mumbai</option>
              <option value="Thane">Thane</option>
              <option value="Pune">Pune</option>
              <option value="Delhi">Delhi</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="All">All Cities</option>
            </select>
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={detectingLocation}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Detect my current location via GPS"
            >
              {detectingLocation ? (
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Crosshair size={14} />
              )}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="explore-sort-select"
            >
              <option value="recent">Sort: Most recent</option>
              <option value="price_asc">Sort: Price: Low to High</option>
              <option value="price_desc">Sort: Price: High to Low</option>
              <option value="rating">Sort: Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Filters Toggle Button */}
      <button
        type="button"
        className="explore-mobile-filter-btn"
        onClick={() => setShowMobileFilters(!showMobileFilters)}
      >
        <SlidersHorizontal size={16} />
        <span>{showMobileFilters ? 'Hide Filters' : 'Show Filters & Categories'}</span>
        {selectedCategories.length > 0 && (
          <span className="badge badge-primary" style={{ marginLeft: '4px' }}>
            {selectedCategories.length}
          </span>
        )}
      </button>

      {/* Main Explore Grid Layout matching Screenshot 4 */}
      <div className="explore-layout">
        {/* Left Sidebar Filters */}
        <aside className={`sidebar-filters ${showMobileFilters ? 'show-mobile' : ''}`}>
          <div className="filter-header">
            <span className="filter-title">Filters</span>
            <button onClick={handleClearFilters} className="filter-clear-btn">
              Clear all
            </button>
          </div>

          {/* Category Checkboxes */}
          <div className="filter-group">
            <div className="filter-group-title">Category</div>
            <div className="filter-checkbox-list">
              {CATEGORY_LIST.map((cat) => (
                <label key={cat} className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => handleCategoryToggle(cat)}
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Per Day Slider */}
          <div className="filter-group">
            <div className="filter-group-title">Price per day</div>
            <div className="filter-price-labels">
              <span>₹ 0</span>
              <span>₹ {maxPrice.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="filter-price-slider"
            />
          </div>

          {/* Location Filter */}
          <div className="filter-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div className="filter-group-title" style={{ marginBottom: 0 }}>Location</div>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detectingLocation}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                {detectingLocation ? <Loader2 size={11} className="spin" /> : <Crosshair size={11} />}
                <span>Auto-detect</span>
              </button>
            </div>
            <label className="filter-checkbox-label" style={{ marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={within10km}
                onChange={(e) => setWithin10km(e.target.checked)}
              />
              <span>Within 10 km</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '13px' }}>
              <MapPin size={14} color="var(--primary)" />
              <span style={{ fontWeight: 600 }}>{location}</span>
            </div>
          </div>

          {/* Availability */}
          <div className="filter-group">
            <div className="filter-group-title">Availability</div>
            <div className="filter-checkbox-list">
              {['Anytime', 'Today', 'This Weekend'].map((avail) => (
                <label key={avail} className="filter-checkbox-label">
                  <input
                    type="radio"
                    name="availability"
                    checked={availability === avail}
                    onChange={() => setAvailability(avail)}
                  />
                  <span>{avail}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Apply Filters Button */}
          <button
            onClick={handleApplyFilters}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '8px' }}
          >
            Apply Filters
          </button>
        </aside>

        {/* Right Products Catalog */}
        <main>
          <div className="explore-main-header">
            <span className="explore-results-count">
              {totalCount} items found
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
              Searching listings...
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No items match your filters</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
                Try adjusting your category, price range, or location filters.
              </p>
              <button onClick={handleClearFilters} className="btn btn-secondary">
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="items-grid explore-items-grid">
              {items.map((item) => (
                <ItemCard key={item._id} item={item} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Explore;
