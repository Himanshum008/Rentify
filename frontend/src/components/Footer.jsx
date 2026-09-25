import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Shield, Heart, HelpCircle, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={{ background: '#ffffff', borderTop: '1px solid var(--border-light)', padding: '60px 0 30px 0' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '40px' }}>
          {/* Brand Col */}
          <div>
            <Link to="/" className="brand-logo" style={{ marginBottom: '16px', display: 'inline-flex' }}>
              <div className="logo-cube">
                <Box size={22} strokeWidth={2.4} />
              </div>
              <span>Rentify</span>
            </Link>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6, maxWidth: '280px' }}>
              The modern peer-to-peer rental marketplace. Rent what you need, rent out what you don't.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Popular Categories</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: 'var(--text-muted)' }}>
              <li><Link to="/explore?category=Cameras" style={{ color: 'inherit' }}>Cameras & Lenses</Link></li>
              <li><Link to="/explore?category=Electronics" style={{ color: 'inherit' }}>Electronics & Laptops</Link></li>
              <li><Link to="/explore?category=Gaming" style={{ color: 'inherit' }}>Gaming & Consoles</Link></li>
              <li><Link to="/explore?category=Vehicles" style={{ color: 'inherit' }}>Bikes & Vehicles</Link></li>
              <li><Link to="/explore?category=Camping" style={{ color: 'inherit' }}>Outdoor & Camping</Link></li>
            </ul>
          </div>

          {/* How it works */}
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Rentify Platform</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: 'var(--text-muted)' }}>
              <li><Link to="/list-item" style={{ color: 'inherit' }}>List an Item</Link></li>
              <li><Link to="/explore" style={{ color: 'inherit' }}>Explore Catalog</Link></li>
              <li><a href="#trust-safety" style={{ color: 'inherit' }}>Trust & Safety</a></li>
              <li><a href="#insurance" style={{ color: 'inherit' }}>Security Deposits</a></li>
            </ul>
          </div>

          {/* Trust Banner */}
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Safe & Verified</h4>
            <div style={{ background: 'var(--primary-light)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, marginBottom: '6px', fontSize: '14px' }}>
                <Shield size={18} />
                <span>100% Verified Community</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Every lender and borrower is verified with secure deposits and real-time chat.
              </p>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: 'var(--text-light)' }}>
          <div>© {new Date().getFullYear()} Rentify Inc. Built with MERN Stack & Cloudinary. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="#" style={{ color: 'inherit' }}>Privacy Policy</a>
            <a href="#" style={{ color: 'inherit' }}>Terms of Service</a>
            <a href="#" style={{ color: 'inherit' }}>Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
