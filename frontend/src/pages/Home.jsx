import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  Camera, 
  Laptop, 
  Car, 
  Wrench, 
  Gamepad2, 
  Armchair, 
  Shirt, 
  BookOpen, 
  Sparkles,
  ShieldCheck,
  CreditCard,
  MessageSquare,
  Check,
  Crosshair,
  Loader2
} from 'lucide-react';
import api from '../services/api';
import ItemCard from '../components/ItemCard';
import { getPreciseLocation } from '../utils/geolocation';

const CATEGORIES = [
  { name: 'Cameras', icon: Camera, color: '#2563eb', bg: '#eff6ff' },
  { name: 'Electronics', icon: Laptop, color: '#3b82f6', bg: '#eff6ff' },
  { name: 'Vehicles', icon: Car, color: '#ec4899', bg: '#fdf2f8' },
  { name: 'Tools', icon: Wrench, color: '#f59e0b', bg: '#fffbeb' },
  { name: 'Gaming', icon: Gamepad2, color: '#8b5cf6', bg: '#f5f3ff' },
  { name: 'Furniture', icon: Armchair, color: '#f97316', bg: '#fff7ed' },
  { name: 'Fashion', icon: Shirt, color: '#a855f7', bg: '#faf5ff' },
  { name: 'Books', icon: BookOpen, color: '#06b6d4', bg: '#ecfeff' }
];

const Home = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Mumbai');
  const [selectedDate, setSelectedDate] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const navigate = useNavigate();

  const handleDetectLocation = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setDetectingLocation(true);
    try {
      const loc = await getPreciseLocation();
      if (loc.city) {
        setSelectedLocation(loc.city);
      }
    } catch (err) {
      alert(err.message || 'Unable to retrieve location.');
    } finally {
      setDetectingLocation(false);
    }
  };

  useEffect(() => {
    const fetchPopularItems = async () => {
      try {
        const { data } = await api.get('/items?limit=8&sort=popular');
        if (data.success) {
          setItems(data.items);
        }
      } catch (err) {
        console.error('Failed to load items:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularItems();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (selectedLocation && selectedLocation !== 'All') params.append('location', selectedLocation);
    navigate(`/explore?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero Banner matching Screenshot 1 */}
      <div className="container">
        <div
          className="hero-banner"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80')`
          }}
        >
          <div className="hero-overlay"></div>

          <div className="hero-content">
            <h1 className="hero-title">
              Rent what you need.<br />
              Rent out what you don't.
            </h1>
            <p className="hero-subtitle">
              Find useful things from people around you.
            </p>
          </div>

          {/* Floating Pill Search Bar matching Screenshot 1 */}
          <form onSubmit={handleSearch} className="search-bar-container">
            <div className="search-input-group">
              <Search size={20} color="var(--primary)" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for cameras, bikes, laptops..."
                className="search-input"
              />
            </div>

            <div className="search-divider"></div>

            <div className="search-select-group" style={{ position: 'relative' }}>
              <MapPin size={18} color="var(--primary)" />
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="search-select"
                style={{ paddingRight: '28px' }}
              >
                {selectedLocation && !['Mumbai', 'Thane', 'Pune', 'Delhi', 'Bengaluru', 'All'].includes(selectedLocation) && (
                  <option value={selectedLocation}>📍 {selectedLocation}</option>
                )}
                <option value="Mumbai">Mumbai</option>
                <option value="Thane">Thane</option>
                <option value="Pune">Pune</option>
                <option value="Delhi">Delhi NCR</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="All">All Locations</option>
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
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Detect my precise GPS location"
              >
                {detectingLocation ? (
                  <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Crosshair size={15} />
                )}
              </button>
            </div>

            <div className="search-divider"></div>

            <div className="search-select-group">
              <Calendar size={18} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Select dates"
                value={selectedDate}
                onFocus={(e) => (e.target.type = 'date')}
                onBlur={(e) => {
                  if (!e.target.value) e.target.type = 'text';
                }}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="search-select"
                style={{ minWidth: '120px' }}
              />
            </div>

            <button type="submit" className="search-btn" title="Search">
              <Search size={20} />
            </button>
          </form>
        </div>
      </div>

      {/* Browse Categories Section matching Screenshot 1 */}
      <section className="container">
        <div className="section-header">
          <h2 className="section-title">Browse Categories</h2>
          <Link to="/explore" className="section-link">
            <span>View all</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="categories-grid">
          {CATEGORIES.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <Link
                key={cat.name}
                to={`/explore?category=${cat.name}`}
                className="category-card"
              >
                <div
                  className="category-icon-box"
                  style={{ backgroundColor: cat.bg, color: cat.color }}
                >
                  <IconComponent size={26} strokeWidth={2} />
                </div>
                <span className="category-name">{cat.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Popular Items Section matching Screenshot 1 */}
      <section className="container">
        <div className="section-header">
          <h2 className="section-title">Popular Items</h2>
          <Link to="/explore" className="section-link">
            <span>View all</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            Loading popular rental items...
          </div>
        ) : (
          <div className="items-grid">
            {items.map((item) => (
              <ItemCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* How It Works & Trust Banner */}
      <section id="how-it-works" style={{ background: '#ffffff', borderTop: '1px solid var(--border-light)', padding: '64px 0', margin: '40px 0 0 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 48px auto' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px' }}>How Rentify Works</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
              Experience the seamless way to rent gear locally with complete peace of mind.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px' }}>
            <div style={{ padding: '24px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Search size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>1. Find & Explore</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.5 }}>
                Browse verified cameras, electronics, tools, and sports gear available near you.
              </p>
            </div>

            <div style={{ padding: '24px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <MessageSquare size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>2. Real-Time Chat</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.5 }}>
                Connect directly with owners instantly via live messaging to discuss handover details.
              </p>
            </div>

            <div style={{ padding: '24px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <CreditCard size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>3. Secure Booking</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.5 }}>
                Book with refundable security deposits and simulated UPI / card payments.
              </p>
            </div>

            <div style={{ padding: '24px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fdf2f8', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <ShieldCheck size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>4. Return & Earn</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.5 }}>
                Return the item safely to get your deposit back, or list your own idle gear to earn monthly!
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
