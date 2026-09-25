import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Search, 
  Plus, 
  User, 
  MessageSquare, 
  LogOut, 
  Bookmark, 
  Package, 
  ShoppingBag,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const Navbar = () => {
  const { user, logout, openAuthModal } = useAuth();
  const { unreadCount } = useSocket();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleListClick = () => {
    setMobileMenuOpen(false);
    if (!user) {
      openAuthModal('login');
    } else {
      navigate('/list-item');
    }
  };

  return (
    <header className="navbar">
      <div className="container nav-container">
        {/* Brand Logo */}
        <Link to="/" className="brand-logo">
          <div className="logo-cube">
            <Box size={22} strokeWidth={2.4} />
          </div>
          <span>Rentify</span>
        </Link>

        {/* Navigation Links */}
        <nav>
          <ul className="nav-links">
            <li>
              <Link 
                to="/explore" 
                className={`nav-link ${location.pathname === '/explore' ? 'active' : ''}`}
              >
                Explore
              </Link>
            </li>
            <li>
              <Link 
                to="/explore?category=Cameras" 
                className="nav-link"
              >
                Categories
              </Link>
            </li>
            <li>
              <a href="#how-it-works" className="nav-link">
                How it works
              </a>
            </li>
            {user && (
              <li>
                <Link 
                  to="/my-rentals" 
                  className={`nav-link ${location.pathname === '/my-rentals' ? 'active' : ''}`}
                >
                  My Rentals
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Action Buttons */}
        <div className="nav-actions">
          {/* Search Trigger */}
          <Link to="/explore" className="nav-icon-btn" title="Search catalog">
            <Search size={18} />
          </Link>

          {/* Messages Button (if logged in) */}
          {user && (
            <Link to="/messages" className="nav-icon-btn" title="Messages">
              <MessageSquare size={18} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 700,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* + List Item Button */}
          <button onClick={handleListClick} className="btn btn-primary" id="btn-list-item">
            <Plus size={18} strokeWidth={2.5} />
            <span>List Item</span>
          </button>

          {/* User Profile / Auth Toggle */}
          {user ? (
            <div style={{ position: 'relative' }}>
              <button 
                className="nav-avatar-btn" 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                id="user-menu-btn"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="nav-avatar-img" 
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <FaUserCircle className="nav-avatar-icon" size={32} />
                )}
                <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
              </button>

              {dropdownOpen && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '48px',
                    right: 0,
                    background: 'white',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-xl)',
                    width: '220px',
                    padding: '8px 0',
                    zIndex: 200
                  }}
                  onClick={() => setDropdownOpen(false)}
                >
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>{user.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.email}</div>
                  </div>

                  <Link 
                    to="/profile" 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      padding: '10px 16px', 
                      fontSize: '14px', 
                      color: 'var(--text-main)' 
                    }}
                  >
                    <User size={16} />
                    <span>My Profile & Reviews</span>
                  </Link>

                  <Link 
                    to="/my-rentals" 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      padding: '10px 16px', 
                      fontSize: '14px', 
                      color: 'var(--text-main)' 
                    }}
                  >
                    <ShoppingBag size={16} />
                    <span>My Bookings & Rentals</span>
                  </Link>

                  <Link 
                    to="/my-rentals?tab=listings" 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      padding: '10px 16px', 
                      fontSize: '14px', 
                      color: 'var(--text-main)' 
                    }}
                  >
                    <Package size={16} />
                    <span>My Listed Items</span>
                  </Link>

                  <Link 
                    to="/messages" 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      padding: '10px 16px', 
                      fontSize: '14px', 
                      color: 'var(--text-main)' 
                    }}
                  >
                    <MessageSquare size={16} />
                    <span>Inbox / Chats</span>
                  </Link>

                  <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }}></div>

                  <button 
                    onClick={logout} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      padding: '10px 16px', 
                      fontSize: '14px', 
                      color: '#ef4444', 
                      background: 'none', 
                      border: 'none', 
                      width: '100%', 
                      textAlign: 'left', 
                      cursor: 'pointer' 
                    }}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={() => openAuthModal('login')} 
              className="btn btn-secondary"
              id="btn-login-header"
            >
              <User size={16} />
              <span>Log in</span>
            </button>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            style={{
              display: 'none',
              background: 'none',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '8px',
              color: 'var(--text-main)',
              cursor: 'pointer'
            }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-nav-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link 
                to="/explore" 
                className={`mobile-nav-link ${location.pathname === '/explore' ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Search size={18} />
                <span>Explore Catalog</span>
              </Link>

              <Link 
                to="/explore?category=Cameras" 
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Package size={18} />
                <span>All Categories</span>
              </Link>

              <a 
                href="/#how-it-works" 
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Bookmark size={18} />
                <span>How It Works</span>
              </a>

              {user ? (
                <>
                  <div style={{ height: '1px', background: 'var(--border-light)', margin: '8px 0' }}></div>

                  <Link 
                    to="/my-rentals" 
                    className={`mobile-nav-link ${location.pathname === '/my-rentals' ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ShoppingBag size={18} />
                    <span>My Bookings & Rentals</span>
                  </Link>

                  <Link 
                    to="/messages" 
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MessageSquare size={18} />
                    <span>Messages {unreadCount > 0 && `(${unreadCount})`}</span>
                  </Link>

                  <Link 
                    to="/profile" 
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User size={18} />
                    <span>My Profile & Reviews</span>
                  </Link>

                  <div style={{ height: '1px', background: 'var(--border-light)', margin: '8px 0' }}></div>

                  <button 
                    onClick={() => { setMobileMenuOpen(false); logout(); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      color: '#ef4444',
                      background: 'none',
                      border: 'none',
                      width: '100%',
                      textAlign: 'left',
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    onClick={() => { setMobileMenuOpen(false); openAuthModal('login'); }}
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                  >
                    Log In
                  </button>
                  <button 
                    onClick={() => { setMobileMenuOpen(false); openAuthModal('signup'); }}
                    className="btn btn-secondary"
                    style={{ width: '100%' }}
                  >
                    Create Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
