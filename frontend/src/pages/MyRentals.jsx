import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  ShoppingBag, 
  Package, 
  Calendar, 
  Clock, 
  MapPin, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Star, 
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const MyRentals = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'listings' ? 'listings' : (searchParams.get('tab') === 'incoming' || searchParams.get('tab') === 'lending') ? 'incoming' : 'bookings';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [rentals, setRentals] = useState({ asRenter: [], asOwner: [] });
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Deletion State
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Early Return State (Renter)
  const [returnEarlyRental, setReturnEarlyRental] = useState(null);
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Confirm Return & Availability State (Owner)
  const [confirmReturnRental, setConfirmReturnRental] = useState(null);
  const [makeItemAvailable, setMakeItemAvailable] = useState(true);
  const [submittingConfirm, setSubmittingConfirm] = useState(false);

  // Toggle availability state
  const [togglingItemId, setTogglingItemId] = useState(null);

  const { user, openAuthModal } = useAuth();
  const { startChatWithOwner } = useSocket();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [rentalsRes, listingsRes] = await Promise.all([
          api.get('/rentals/my'),
          api.get('/items/my/listings')
        ]);

        if (rentalsRes.data.success) {
          setRentals({
            asRenter: rentalsRes.data.asRenter,
            asOwner: rentalsRes.data.asOwner
          });
        }

        if (listingsRes.data.success) {
          setMyListings(listingsRes.data.items);
        }
      } catch (err) {
        console.error('Failed to load user rentals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    setDeleting(true);

    try {
      const { data } = await api.delete(`/items/${itemToDelete._id}`);
      if (data.success) {
        setMyListings((prev) => prev.filter((item) => item._id !== itemToDelete._id));
        setItemToDelete(null);
      }
    } catch (err) {
      console.error('Failed to delete item listing:', err);
      alert(err.response?.data?.message || 'Failed to delete listing');
    } finally {
      setDeleting(false);
    }
  };

  // Renter Early Return Handler
  const handleReturnEarly = async () => {
    if (!returnEarlyRental) return;
    setSubmittingReturn(true);
    try {
      const { data } = await api.post(`/rentals/${returnEarlyRental._id}/return-early`);
      if (data.success) {
        setRentals((prev) => ({
          ...prev,
          asRenter: prev.asRenter.map((r) =>
            r._id === returnEarlyRental._id ? { ...r, status: 'return_requested', returnedEarly: true } : r
          )
        }));
        setReturnEarlyRental(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit early return request');
    } finally {
      setSubmittingReturn(false);
    }
  };

  // Owner Confirm Return & Availability Handler
  const handleConfirmReturn = async () => {
    if (!confirmReturnRental) return;
    setSubmittingConfirm(true);
    try {
      const { data } = await api.post(`/rentals/${confirmReturnRental._id}/confirm-return`, {
        makeAvailable: makeItemAvailable
      });
      if (data.success) {
        setRentals((prev) => ({
          ...prev,
          asOwner: prev.asOwner.map((r) =>
            r._id === confirmReturnRental._id ? { ...r, status: 'completed' } : r
          )
        }));

        // Refresh listed items availability in owner's dashboard
        const itemId = confirmReturnRental.item?._id || confirmReturnRental.item;
        setMyListings((prev) =>
          prev.map((i) =>
            i._id === itemId
              ? { ...i, status: makeItemAvailable ? 'available' : 'inactive', isAvailable: makeItemAvailable }
              : i
          )
        );

        setConfirmReturnRental(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm return');
    } finally {
      setSubmittingConfirm(false);
    }
  };

  // Owner Toggles Item Availability (Available vs Paused)
  const handleToggleAvailability = async (itemId) => {
    setTogglingItemId(itemId);
    try {
      const { data } = await api.patch(`/items/${itemId}/toggle-availability`);
      if (data.success) {
        setMyListings((prev) =>
          prev.map((i) =>
            i._id === itemId ? { ...i, isAvailable: data.isAvailable, status: data.item?.status || (data.isAvailable ? 'available' : 'inactive') } : i
          )
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle availability');
    } finally {
      setTogglingItemId(null);
    }
  };

  if (!user) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>Please Log In</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Log in to view your booked rentals and listed items.</p>
        <button onClick={() => openAuthModal('login')} className="btn btn-primary btn-lg">Log In</button>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '32px 0 80px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '4px' }}>My Rental Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Track your active bookings and items listed for rent.</p>
        </div>

        <Link to="/list-item" className="btn btn-primary">
          <Plus size={18} />
          <span>List Another Item</span>
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-light)', marginBottom: '32px' }}>
        <button
          className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <ShoppingBag size={18} />
          <span>Items I Rented ({rentals.asRenter.length})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'listings' ? 'active' : ''}`}
          onClick={() => setActiveTab('listings')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Package size={18} />
          <span>My Listed Items ({myListings.length})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'incoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('incoming')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Calendar size={18} />
          <span>Borrower Requests ({rentals.asOwner.length})</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>Loading records...</div>
      ) : (
        <>
          {/* TAB 1: Items Rented by User */}
          {activeTab === 'bookings' && (
            <div>
              {rentals.asRenter.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No active rentals yet</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>Explore items available for rent in your city.</p>
                  <Link to="/explore" className="btn btn-primary">Browse Items</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {rentals.asRenter.map((rental) => (
                    <div
                      key={rental._id}
                      className="rental-card-wrapper"
                    >
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <img
                          src={rental.item?.images?.[0] || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=200&q=80'}
                          alt={rental.item?.title}
                          style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
                            <span className={`badge ${
                              rental.status === 'return_requested' ? 'badge-warning' :
                              rental.status === 'completed' ? 'badge-info' :
                              'badge-success'
                            }`} style={rental.status === 'return_requested' ? { backgroundColor: '#fef3c7', color: '#b45309' } : {}}>
                              {rental.status === 'return_requested' ? 'RETURN REQUESTED' : rental.status?.toUpperCase()}
                            </span>
                            {rental.paymentMethod === 'Cash on Delivery (COD)' && (
                              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                                CASH ON DELIVERY
                              </span>
                            )}
                            <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>ID: {rental.transactionId}</span>
                          </div>
                          <h4 style={{ fontSize: '16px', fontWeight: 700 }}>{rental.item?.title}</h4>
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            📅 {new Date(rental.startDate).toLocaleDateString()} → {new Date(rental.endDate).toLocaleDateString()} ({rental.totalDays} days)
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            Owner: <strong>{rental.owner?.name}</strong> ({rental.owner?.location || 'Mumbai'})
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {rental.paymentMethod === 'Cash on Delivery (COD)' ? 'Payable upon Delivery' : 'Total Paid'}
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)' }}>₹{rental.totalAmount?.toLocaleString('en-IN')}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                            {rental.paymentMethod === 'Cash on Delivery (COD)' ? 'Cash on Pickup' : `Includes ₹${rental.securityDeposit} deposit`}
                          </div>
                        </div>

                        <button
                          className="btn btn-outline-primary"
                          onClick={() => startChatWithOwner(rental.owner, rental.item)}
                        >
                          <MessageSquare size={16} />
                          <span>Chat Owner</span>
                        </button>

                        {/* Early Return Action for Renter */}
                        {(rental.status === 'confirmed' || rental.status === 'active') && (
                          <button
                            type="button"
                            className="btn"
                            style={{
                              background: '#fffbeb',
                              color: '#b45309',
                              border: '1px solid #fcd34d',
                              fontWeight: 700,
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                            onClick={() => setReturnEarlyRental(rental)}
                            title="Return item early before scheduled end date"
                          >
                            <RotateCcw size={15} />
                            <span>Return Early</span>
                          </button>
                        )}

                        {rental.status === 'return_requested' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '6px 12px', borderRadius: 'var(--radius-md)' }}>
                            <RotateCcw size={14} />
                            <span>Awaiting Owner Confirmation</span>
                          </div>
                        )}

                        {rental.status === 'completed' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '6px 12px', borderRadius: 'var(--radius-md)' }}>
                            <CheckCircle2 size={14} />
                            <span>Returned & Completed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: My Listed Items */}
          {activeTab === 'listings' && (
            <div>
              {myListings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>You haven't listed any items</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>Upload items you own to start earning rental income!</p>
                  <Link to="/list-item" className="btn btn-primary">List an Item</Link>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                  {myListings.map((item) => (
                    <div
                      key={item._id}
                      style={{
                        background: 'white',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <img
                        src={item.images?.[0] || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80'}
                        alt={item.title}
                        style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                      />
                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="badge badge-primary">{item.category}</span>
                          {item.numReviews > 0 ? (
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Star size={13} fill="#F59E0B" color="#F59E0B" />
                              {item.rating?.toFixed(1)} ({item.numReviews})
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)' }}>
                              ✨ New
                            </span>
                          )}
                        </div>

                        <h4 style={{ fontSize: '16px', fontWeight: 700 }}>{item.title}</h4>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--dark)' }}>
                          ₹{item.pricePerDay?.toLocaleString('en-IN')} <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>/ day</span>
                        </div>

                        {/* Availability Status Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', fontSize: '12px', margin: '4px 0' }}>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span>
                          {(item.status === 'booked' || item.status === 'rented') ? (
                            <span style={{ color: '#b45309', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              🔒 Booked (On Rent)
                            </span>
                          ) : item.isAvailable ? (
                            <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              🟢 Available
                            </span>
                          ) : (
                            <span style={{ color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              ⚪ Paused / Hidden
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', gap: '6px', flexWrap: 'wrap' }}>
                          <Link to={`/item/${item._id}`} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 10px' }}>
                            View
                          </Link>

                          {/* Toggle availability button if not rented */}
                          {item.status === 'booked' || item.status === 'rented' ? (
                            <span style={{ fontSize: '11px', color: '#b45309', fontWeight: 600 }}>Active Rental</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleAvailability(item._id)}
                              disabled={togglingItemId === item._id}
                              className="btn"
                              style={{
                                fontSize: '12px',
                                padding: '6px 10px',
                                background: item.isAvailable ? '#f1f5f9' : '#ecfdf5',
                                color: item.isAvailable ? '#475569' : '#059669',
                                border: `1px solid ${item.isAvailable ? '#cbd5e1' : '#a7f3d0'}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontWeight: 700
                              }}
                              title={item.isAvailable ? "Pause listing (don't show to others)" : "Make item available for rent"}
                            >
                              {item.isAvailable ? <EyeOff size={13} /> : <Eye size={13} />}
                              <span>{item.isAvailable ? 'Pause' : 'Make Available'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            className="btn"
                            style={{
                              fontSize: '12px',
                              padding: '6px 8px',
                              background: '#fee2e2',
                              color: '#dc2626',
                              border: '1px solid #fca5a5',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontWeight: 600
                            }}
                            title="Delete this listing"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Incoming Requests from Borrowers */}
          {activeTab === 'incoming' && (
            <div>
              {rentals.asOwner.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No borrower requests yet</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>When users rent your items, their bookings will show up here.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {rentals.asOwner.map((rental) => (
                    <div
                      key={rental._id}
                      style={{
                        background: 'white',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '20px'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <img
                          src={rental.item?.images?.[0] || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=200&q=80'}
                          alt={rental.item?.title}
                          style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                            <span className={`badge ${
                              rental.status === 'return_requested' ? 'badge-warning' :
                              rental.status === 'completed' ? 'badge-info' :
                              'badge-success'
                            }`} style={rental.status === 'return_requested' ? { backgroundColor: '#fef3c7', color: '#b45309', fontWeight: 800 } : {}}>
                              {rental.status === 'return_requested' ? '⚠️ RETURN REQUESTED' : rental.status?.toUpperCase()}
                            </span>
                            {rental.paymentMethod === 'Cash on Delivery (COD)' && (
                              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                                CASH ON DELIVERY
                              </span>
                            )}
                          </div>

                          <h4 style={{ fontSize: '16px', fontWeight: 700 }}>{rental.item?.title}</h4>
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            Rented By: <strong>{rental.renter?.name}</strong> ({rental.renter?.email})
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            Period: {new Date(rental.startDate).toLocaleDateString()} → {new Date(rental.endDate).toLocaleDateString()}
                          </div>

                          {rental.status === 'return_requested' && (
                            <div style={{ marginTop: '8px', padding: '6px 10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: '#92400e', fontWeight: 600 }}>
                              🔔 Renter requested early return. Please confirm receipt below once you inspect the item.
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Earnings</div>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669' }}>₹{rental.subtotal?.toLocaleString('en-IN')}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                            {rental.paymentMethod === 'Cash on Delivery (COD)' ? 'Collect in Cash' : 'Paid Online'}
                          </div>
                        </div>

                        <button
                          className="btn btn-outline-primary"
                          onClick={() => startChatWithOwner(rental.renter, rental.item)}
                        >
                          <MessageSquare size={16} />
                          <span>Chat Renter</span>
                        </button>

                        {/* Owner Return Confirmation Button */}
                        {rental.status === 'return_requested' ? (
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{
                              background: '#059669',
                              borderColor: '#059669',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontWeight: 700
                            }}
                            onClick={() => {
                              setConfirmReturnRental(rental);
                              setMakeItemAvailable(true);
                            }}
                          >
                            <CheckCircle2 size={16} />
                            <span>Confirm Return Received</span>
                          </button>
                        ) : (rental.status === 'confirmed' || rental.status === 'active') ? (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontWeight: 600
                            }}
                            onClick={() => {
                              setConfirmReturnRental(rental);
                              setMakeItemAvailable(true);
                            }}
                          >
                            <CheckCircle2 size={15} />
                            <span>Confirm Return</span>
                          </button>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '6px 12px', borderRadius: 'var(--radius-md)' }}>
                            <CheckCircle2 size={14} />
                            <span>Completed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="modal-backdrop" onClick={() => !deleting && setItemToDelete(null)}>
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
                Are you sure you want to delete <strong>"{itemToDelete.title}"</strong>? This will permanently remove the item listing.
              </p>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setItemToDelete(null)}
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
                  onClick={handleDeleteItem}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Renter Early Return Modal */}
      {returnEarlyRental && (
        <div className="modal-backdrop" onClick={() => !submittingReturn && setReturnEarlyRental(null)}>
          <div className="modal-content" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', padding: '12px 4px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#fef3c7',
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}
              >
                <RotateCcw size={28} />
              </div>

              <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px', color: 'var(--text-main)' }}>
                Return Item Early?
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.5, marginBottom: '20px' }}>
                You are returning <strong>"{returnEarlyRental.item?.title}"</strong> early before your rental end date (
                {new Date(returnEarlyRental.endDate).toLocaleDateString()}).
              </p>

              <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '24px', textAlign: 'left', fontSize: '13px', color: 'var(--text-muted)' }}>
                ℹ️ The item owner (<strong>{returnEarlyRental.owner?.name}</strong>) will be notified to inspect and confirm receipt of the item. Once the owner confirms, your rental will be completed.
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setReturnEarlyRental(null)}
                  disabled={submittingReturn}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ flex: 1, backgroundColor: '#f59e0b', borderColor: '#f59e0b', fontWeight: 700 }}
                  onClick={handleReturnEarly}
                  disabled={submittingReturn}
                >
                  {submittingReturn ? 'Submitting...' : 'Confirm Early Return'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Owner Confirm Return & Availability Modal */}
      {confirmReturnRental && (
        <div className="modal-backdrop" onClick={() => !submittingConfirm && setConfirmReturnRental(null)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '8px 4px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}
              >
                <CheckCircle2 size={30} />
              </div>

              <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px', textAlign: 'center' }}>
                Confirm Return Received
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', marginBottom: '20px' }}>
                Have you received back <strong>"{confirmReturnRental.item?.title}"</strong> from <strong>{confirmReturnRental.renter?.name}</strong>?
              </p>

              {/* Owner availability permission selection */}
              <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '24px', border: '1px solid var(--border-light)' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: 'var(--dark)' }}>
                  Marketplace Availability for Other Users:
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', padding: '12px', borderRadius: 'var(--radius-md)', background: makeItemAvailable ? 'white' : 'transparent', border: makeItemAvailable ? '1.5px solid var(--primary)' : '1px solid var(--border-light)' }}>
                    <input
                      type="radio"
                      name="makeAvailable"
                      checked={makeItemAvailable === true}
                      onChange={() => setMakeItemAvailable(true)}
                      style={{ marginTop: '3px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#059669' }}>
                        🟢 Make Available Immediately
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Show this item as Available on the platform so other users can view and book it right away.
                      </div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', padding: '12px', borderRadius: 'var(--radius-md)', background: !makeItemAvailable ? 'white' : 'transparent', border: !makeItemAvailable ? '1.5px solid var(--primary)' : '1px solid var(--border-light)' }}>
                    <input
                      type="radio"
                      name="makeAvailable"
                      checked={makeItemAvailable === false}
                      onChange={() => setMakeItemAvailable(false)}
                      style={{ marginTop: '3px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#475569' }}>
                        ⚪ Keep Paused / Hidden for Now
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Do not give permission to make it available yet. You can make it available anytime from your profile or listings.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setConfirmReturnRental(null)}
                  disabled={submittingConfirm}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ flex: 1, backgroundColor: '#059669', borderColor: '#059669', fontWeight: 700 }}
                  onClick={handleConfirmReturn}
                  disabled={submittingConfirm}
                >
                  {submittingConfirm ? 'Confirming...' : 'Confirm Return Received'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRentals;
