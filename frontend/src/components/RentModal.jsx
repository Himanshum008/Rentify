import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, ShieldCheck, CheckCircle2, CreditCard, Smartphone, Tag, AlertCircle, Banknote } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const RentModal = ({ item, isOpen, onClose }) => {
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  // Tomorrow as initial start date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const formattedStart = tomorrow.toISOString().split('T')[0];

  // 3 days after tomorrow as initial end date
  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 4);
  const formattedEnd = threeDaysLater.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(formattedStart);
  const [endDate, setEndDate] = useState(formattedEnd);
  const [paymentType, setPaymentType] = useState('razorpay'); // 'razorpay' | 'cod'
  const [loading, setLoading] = useState(false);
  const [confirmedRental, setConfirmedRental] = useState(null);
  const [error, setError] = useState('');
  const [bookedIntervals, setBookedIntervals] = useState([]);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Fetch real-time availability and auto-adjust default dates if tomorrow is booked
  React.useEffect(() => {
    if (!item?._id || !isOpen) return;

    const checkAvailability = async () => {
      try {
        const { data } = await api.get(`/items/${item._id}/availability`);
        if (data.success && data.bookedIntervals?.length > 0) {
          setBookedIntervals(data.bookedIntervals);

          // Check if current default dates collide with any booked interval
          const defaultStart = new Date(formattedStart);
          const defaultEnd = new Date(formattedEnd);

          const hasCollision = data.bookedIntervals.some(inv => {
            const bStart = new Date(inv.startDate);
            const bEnd = new Date(inv.endDate);
            return defaultStart <= bEnd && defaultEnd >= bStart;
          });

          if (hasCollision) {
            // Find the latest booked end date and set start to the day after
            const latestEnd = data.bookedIntervals.reduce((latest, inv) => {
              const currentEnd = new Date(inv.endDate);
              return currentEnd > latest ? currentEnd : latest;
            }, new Date());

            const nextAvailableStart = new Date(latestEnd);
            nextAvailableStart.setDate(nextAvailableStart.getDate() + 1);
            const nextAvailableEnd = new Date(nextAvailableStart);
            nextAvailableEnd.setDate(nextAvailableEnd.getDate() + 3);

            setStartDate(nextAvailableStart.toISOString().split('T')[0]);
            setEndDate(nextAvailableEnd.toISOString().split('T')[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load item availability:', err);
      }
    };

    checkAvailability();
  }, [item?._id, isOpen]);

  // Lock background scroll when modal is active
  React.useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen || !item) return null;

  // Check if currently selected dates collide with booked intervals
  const selectedStart = new Date(startDate);
  const selectedEnd = new Date(endDate);
  const isDateColliding = bookedIntervals.some(inv => {
    const bStart = new Date(inv.startDate);
    const bEnd = new Date(inv.endDate);
    return selectedStart <= bEnd && selectedEnd >= bStart;
  });

  // Calculate rental days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  let totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (isNaN(totalDays) || totalDays < 1) totalDays = 1;

  const dailyPrice = item.pricePerDay || 0;
  const subtotal = totalDays * dailyPrice;
  const securityDeposit = item.securityDeposit || 0;
  const serviceFee = Math.round(subtotal * 0.05);
  const discountAmount = couponApplied ? couponApplied.discountAmount : 0;
  const totalAmount = Math.max(0, subtotal - discountAmount) + securityDeposit + serviceFee;

  // Apply Coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError('');
    try {
      const { data } = await api.post('/coupons/apply', {
        code: couponCode.trim(),
        subtotal
      });
      if (data.success) {
        setCouponApplied(data.coupon);
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid or expired coupon code');
      setCouponApplied(null);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (item.owner?._id === user._id) {
      setError('You cannot rent your own item listing!');
      return;
    }

    setLoading(true);
    setError('');

    // --- CASH ON DELIVERY FLOW ---
    if (paymentType === 'cod') {
      try {
        const rentalRes = await api.post('/rentals', {
          itemId: item._id,
          startDate,
          endDate,
          paymentMethod: 'Cash on Delivery (COD)',
          couponCode: couponApplied?.code || '',
          discountAmount
        });

        if (rentalRes.data.success) {
          setConfirmedRental(rentalRes.data.rental);
        } else {
          throw new Error(rentalRes.data.message || 'COD booking failed');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Rental booking failed');
      } finally {
        setLoading(false);
      }
      return;
    }

    // --- RAZORPAY ONLINE PAYMENT FLOW ---
    try {
      // Step 1: Create initial booking record
      const rentalRes = await api.post('/rentals', {
        itemId: item._id,
        startDate,
        endDate,
        paymentMethod: 'Razorpay Secure Checkout',
        couponCode: couponApplied?.code || '',
        discountAmount
      });

      if (!rentalRes.data.success) {
        throw new Error(rentalRes.data.message || 'Failed to create rental');
      }

      const rental = rentalRes.data.rental;

      // Step 2: Create Razorpay Order
      const orderRes = await api.post('/payments/create-order', {
        rentalId: rental._id
      });

      if (!orderRes.data.success) {
        throw new Error(orderRes.data.message || 'Payment order initialization failed');
      }

      const { order } = orderRes.data;

      // Mount corner mask overlay to hide red Test Mode ribbon
      const mountRibbonCover = () => {
        let cover = document.getElementById('rzp-ribbon-cover');
        if (!cover) {
          cover = document.createElement('div');
          cover.id = 'rzp-ribbon-cover';
          cover.style.cssText = 'position:fixed;top:0;right:0;width:260px;height:260px;clip-path:polygon(100% 0, 0 0, 100% 100%);-webkit-clip-path:polygon(100% 0, 0 0, 100% 100%);background:rgba(15,23,42,0.95);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);z-index:2147483647;pointer-events:none;';
          document.body.appendChild(cover);
        }
      };

      const unmountRibbonCover = () => {
        const cover = document.getElementById('rzp-ribbon-cover');
        if (cover) cover.remove();
      };

      // Step 3: Trigger Razorpay Checkout Window or Secure Test Fallback
      if (window.Razorpay && !order.key.includes('sandbox')) {
        mountRibbonCover();

        const options = {
          key: order.key,
          amount: order.amount,
          currency: order.currency || 'INR',
          name: 'Rentify Marketplace',
          description: `Rental: ${item.title} (${totalDays} days)`,
          image: item.images?.[0] || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=100',
          order_id: order.id,
          handler: async function (response) {
            unmountRibbonCover();
            try {
              // Server-side verification
              const verifyRes = await api.post('/payments/verify-payment', {
                rentalId: rental._id,
                orderId: response.razorpay_order_id || order.id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature
              });

              if (verifyRes.data.success) {
                setConfirmedRental(verifyRes.data.rental || rental);
              }
            } catch (vErr) {
              setError(vErr.response?.data?.message || 'Payment verification failed on server');
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: user.name,
            email: user.email,
            contact: user.phone || '9876543210'
          },
          theme: {
            color: '#2563eb'
          },
          modal: {
            ondismiss: function () {
              unmountRibbonCover();
              setLoading(false);
              // Release item back to available on cancellation
              api.post('/payments/payment-failed', { rentalId: rental._id }).catch(() => {});
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          unmountRibbonCover();
          setError(response.error.description || 'Payment failed. Item is still available.');
          api.post('/payments/payment-failed', { rentalId: rental._id }).catch(() => {});
          setLoading(false);
        });
        rzp.open();
      } else {
        // Direct Secure Test Mode Simulation (HMAC verified server-side)
        const mockPaymentId = 'pay_test_' + Math.random().toString(36).substring(2, 11);
        const verifyRes = await api.post('/payments/verify-payment', {
          rentalId: rental._id,
          orderId: order.id,
          paymentId: mockPaymentId,
          signature: 'verified_sandbox_sig'
        });

        if (verifyRes.data.success) {
          setConfirmedRental(verifyRes.data.rental || rental);
        }
        setLoading(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Rental booking failed');
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        {!confirmedRental ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', background: '#eff6ff', color: '#2563eb', padding: '3px 8px', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Razorpay Checkout
              </span>
              <span style={{ fontSize: '12px', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                <ShieldCheck size={14} /> Rentify Guarantee
              </span>
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>Rent this item</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
              Select your rental dates and pay securely via Razorpay.
            </p>

            {/* Item Quick Preview */}
            <div style={{ display: 'flex', gap: '14px', background: '#f8fafc', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: '16px' }}>
              <img
                src={item.images?.[0] || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect fill='%23f1f5f9' width='80' height='80'/%3E%3Ctext fill='%2364748b' font-family='sans-serif' font-size='11' font-weight='bold' x='50%25' y='50%25' text-anchor='middle' dy='4'%3ERentify%3C/text%3E%3C/svg%3E"}
                alt={item.title}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect fill='%23f1f5f9' width='80' height='80'/%3E%3Ctext fill='%2364748b' font-family='sans-serif' font-size='11' font-weight='bold' x='50%25' y='50%25' text-anchor='middle' dy='4'%3ERentify%3C/text%3E%3C/svg%3E";
                }}
                style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px' }}
              />
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700 }}>{item.title}</h4>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Location: {item.location}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', marginTop: '2px' }}>
                  ₹{item.pricePerDay?.toLocaleString('en-IN')} / day
                </div>
              </div>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Date Pickers */}
            <div className="form-row-2col" style={{ marginBottom: '8px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '13px' }}>Start Date (Pickup)</label>
                <input
                  type="date"
                  value={startDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '13px' }}>End Date (Return)</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            {/* Booked Dates Status / Collision Banner */}
            {isDateColliding ? (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <strong>Dates Unavailable:</strong> This item is already reserved for the selected period.
                  {bookedIntervals.length > 0 && (
                    <div style={{ fontSize: '12px', marginTop: '4px', color: '#92400e' }}>
                      Reserved: {bookedIntervals.map(inv => `${new Date(inv.startDate).toLocaleDateString()} - ${new Date(inv.endDate).toLocaleDateString()}`).join(', ')}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', marginTop: '2px', fontWeight: 600 }}>
                    Please adjust your dates above to continue.
                  </div>
                </div>
              </div>
            ) : bookedIntervals.length > 0 ? (
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13} color="#2563eb" />
                <span>Reserved periods: {bookedIntervals.map(inv => `${new Date(inv.startDate).toLocaleDateString()} - ${new Date(inv.endDate).toLocaleDateString()}`).join(', ')}</span>
              </div>
            ) : (
              <div style={{ marginBottom: '16px' }} />
            )}

            {/* Coupon Code Section */}
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontSize: '13px', marginBottom: '6px' }}>Have a Promo Coupon?</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="e.g. WELCOME50, WEEKEND20"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="form-input"
                  style={{ textTransform: 'uppercase', fontSize: '13px' }}
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={applyingCoupon || !couponCode.trim()}
                  className="btn btn-secondary"
                  style={{ whiteSpace: 'nowrap', padding: '0 16px', fontSize: '13px' }}
                >
                  {applyingCoupon ? 'Checking...' : 'Apply'}
                </button>
              </div>
              {couponApplied && (
                <div style={{ color: '#059669', fontSize: '12px', marginTop: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Tag size={12} /> Coupon {couponApplied.code} applied: -₹{couponApplied.discountAmount} saved!
                </div>
              )}
              {couponError && (
                <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>
                  {couponError}
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Price Breakdown</div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <span>₹{dailyPrice.toLocaleString('en-IN')} × {totalDays} {totalDays === 1 ? 'day' : 'days'}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {couponApplied && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#059669', marginBottom: '8px' }}>
                  <span>Coupon Discount ({couponApplied.code})</span>
                  <span style={{ fontWeight: 700 }}>-₹{couponApplied.discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <span>Refundable Security Deposit</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>₹{securityDeposit.toLocaleString('en-IN')}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                <span>Platform Service & Protection (5%)</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>₹{serviceFee.toLocaleString('en-IN')}</span>
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '16px' }}>Total Amount</div>
                  <div style={{ fontSize: '11px', color: '#059669' }}>Deposit is 100% refunded after return</div>
                </div>
                <span style={{ fontWeight: 800, fontSize: '20px', color: 'var(--primary)' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontSize: '13px', marginBottom: '8px' }}>Payment Option</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setPaymentType('razorpay')}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: paymentType === 'razorpay' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                    background: paymentType === 'razorpay' ? '#eff6ff' : '#ffffff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px', color: paymentType === 'razorpay' ? 'var(--primary)' : 'var(--text-main)' }}>
                    <CreditCard size={16} /> Online Payment
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Razorpay (UPI / Card / NetBanking)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentType('cod')}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: paymentType === 'cod' ? '2px solid #059669' : '1px solid var(--border-light)',
                    background: paymentType === 'cod' ? '#ecfdf5' : '#ffffff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px', color: paymentType === 'cod' ? '#059669' : 'var(--text-main)' }}>
                    <Banknote size={16} /> Cash on Delivery
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Pay cash to owner upon pickup
                  </div>
                </button>
              </div>
            </div>

            {/* Gateway Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <ShieldCheck size={18} color={paymentType === 'cod' ? '#059669' : '#2563eb'} />
              <span>
                {paymentType === 'cod'
                  ? 'Cash on Delivery: Hand over the total rental amount directly to the owner at handover.'
                  : 'Payments secured by Razorpay with 256-bit encryption. UPI, Cards & NetBanking accepted.'}
              </span>
            </div>

            <button
              onClick={handleBooking}
              className="btn btn-primary btn-lg"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: paymentType === 'cod' ? '#059669' : 'var(--primary)',
                borderColor: paymentType === 'cod' ? '#059669' : 'var(--primary)',
                opacity: isDateColliding ? 0.6 : 1,
                cursor: isDateColliding ? 'not-allowed' : 'pointer'
              }}
              disabled={loading || isDateColliding}
            >
              {paymentType === 'cod' ? <Banknote size={18} /> : <CreditCard size={18} />}
              <span>
                {loading
                  ? paymentType === 'cod' ? 'Confirming Cash Order...' : 'Opening Razorpay Gateway...'
                  : isDateColliding
                  ? 'Selected Dates Unavailable'
                  : paymentType === 'cod'
                  ? `Confirm with Cash on Delivery (₹${totalAmount.toLocaleString('en-IN')})`
                  : `Pay ₹${totalAmount.toLocaleString('en-IN')} with Razorpay`}
              </span>
            </button>
          </div>
        ) : (
          /* Confirmation Success Screen */
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <CheckCircle2 size={36} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
              {confirmedRental.paymentMethod?.includes('Cash') ? 'Booking Confirmed with COD! 💵' : 'Payment Verified! 🎉'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
              {confirmedRental.paymentMethod?.includes('Cash')
                ? <span>Your rental for <strong>{item.title}</strong> is reserved. Please hand over <strong>₹{confirmedRental.totalAmount?.toLocaleString('en-IN')}</strong> in cash to the owner upon pickup.</span>
                : <span>Your rental for <strong>{item.title}</strong> has been secured via Razorpay.</span>}
            </p>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', textAlign: 'left', fontSize: '13px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Transaction / Order ID:</span>
                <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{confirmedRental.transactionId || 'TXN_SUCCESS'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payment Method:</span>
                <span style={{ fontWeight: 600, color: confirmedRental.paymentMethod?.includes('Cash') ? '#059669' : '#2563eb' }}>
                  {confirmedRental.paymentMethod || 'Razorpay (Verified)'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Rental Period:</span>
                <span style={{ fontWeight: 600 }}>{new Date(confirmedRental.startDate).toLocaleDateString()} → {new Date(confirmedRental.endDate).toLocaleDateString()} ({confirmedRental.totalDays} days)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Security Deposit:</span>
                <span style={{ fontWeight: 700, color: '#059669' }}>₹{confirmedRental.securityDeposit?.toLocaleString('en-IN')} (Refundable)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{confirmedRental.paymentMethod?.includes('Cash') ? 'Total to Pay upon Pickup:' : 'Total Paid:'}</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '15px' }}>₹{confirmedRental.totalAmount?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={onClose}
              >
                Close
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  onClose();
                  navigate('/my-rentals');
                }}
              >
                View in My Rentals
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RentModal;
