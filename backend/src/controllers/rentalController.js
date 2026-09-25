import Rental from '../models/Rental.js';
import Item from '../models/Item.js';
import User from '../models/User.js';
import { createNotification } from './notificationController.js';

// @desc    Book / Rent an item
// @route   POST /api/rentals
// @access  Private
const createRental = async (req, res, next) => {
  try {
    const {
      itemId,
      startDate,
      endDate,
      paymentMethod,
      couponCode,
      discountAmount = 0
    } = req.body;

    if (!itemId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide itemId, startDate, and endDate'
      });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (item.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot rent your own item!'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Check collision with confirmed/active paid rentals or recent pending checkouts
    const collision = await Rental.findOne({
      item: itemId,
      renter: { $ne: req.user._id },
      $or: [
        {
          status: { $in: ['confirmed', 'active'] },
          paymentStatus: 'paid',
          startDate: { $lte: end },
          endDate: { $gte: start }
        },
        {
          status: 'pending',
          paymentStatus: 'pending',
          createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) }, // 15-minute lock window
          startDate: { $lte: end },
          endDate: { $gte: start }
        }
      ]
    });

    if (collision) {
      return res.status(400).json({
        success: false,
        message: 'Item is already booked for these selected dates. Please choose different dates.'
      });
    }

    const diffTime = Math.abs(end - start);
    let totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (totalDays === 0) totalDays = 1;

    const subtotal = totalDays * item.pricePerDay;
    const securityDeposit = item.securityDeposit || 0;
    const serviceFee = Math.round(subtotal * 0.05); // 5% platform fee
    const discount = Number(discountAmount) || 0;
    const totalAmount = Math.max(0, subtotal - discount) + securityDeposit + serviceFee;

    // Reuse existing pending rental if available for this user & item
    let rental = await Rental.findOne({
      item: item._id,
      renter: req.user._id,
      paymentStatus: 'pending'
    });

    const isCOD = paymentMethod === 'Cash on Delivery (COD)' || paymentMethod === 'Cash on Delivery';
    const initialStatus = isCOD ? 'confirmed' : 'pending';
    const txnId = isCOD ? 'COD_' + Math.random().toString(36).substring(2, 10).toUpperCase() : ('TXN_' + Math.random().toString(36).substring(2, 10).toUpperCase());

    if (rental) {
      rental.startDate = start;
      rental.endDate = end;
      rental.totalDays = totalDays;
      rental.dailyPrice = item.pricePerDay;
      rental.subtotal = subtotal;
      rental.securityDeposit = securityDeposit;
      rental.serviceFee = serviceFee;
      rental.discountAmount = discount;
      rental.couponApplied = couponCode || '';
      rental.totalAmount = totalAmount;
      rental.status = initialStatus;
      rental.paymentMethod = isCOD ? 'Cash on Delivery (COD)' : (paymentMethod || 'Razorpay Secure Checkout');
      rental.transactionId = txnId;
      await rental.save();
    } else {
      rental = await Rental.create({
        item: item._id,
        renter: req.user._id,
        owner: item.owner,
        startDate: start,
        endDate: end,
        totalDays,
        dailyPrice: item.pricePerDay,
        subtotal,
        securityDeposit,
        serviceFee,
        discountAmount: discount,
        couponApplied: couponCode || '',
        totalAmount,
        status: initialStatus,
        paymentStatus: 'pending',
        depositStatus: 'held',
        paymentMethod: isCOD ? 'Cash on Delivery (COD)' : (paymentMethod || 'Razorpay Secure Checkout'),
        transactionId: txnId,
        pickupChecklist: [
          { item: 'Device powers on and functions normally', checked: false },
          { item: 'All cables, chargers, and standard accessories present', checked: false },
          { item: 'Cosmetic condition documented with photos', checked: false },
          { item: 'Identity card checked upon handover', checked: false }
        ],
        returnChecklist: [
          { item: 'Returned in clean, operational condition', checked: false },
          { item: 'No visible physical or water damage', checked: false },
          { item: 'All included accessories returned', checked: false },
          { item: 'Security deposit release approved', checked: false }
        ]
      });
    }

    // If Cash on Delivery, mark item as booked immediately
    if (isCOD) {
      await Item.findByIdAndUpdate(item._id, {
        status: 'booked',
        isAvailable: false
      });
    }

    // Notify item owner
    await createNotification({
      recipient: item.owner,
      sender: req.user._id,
      title: isCOD ? 'New Cash on Delivery Booking! 💵' : 'New Rental Booking Received! 📦',
      message: isCOD
        ? `${req.user.name} booked "${item.title}" with Cash on Delivery (₹${totalAmount.toLocaleString()}). Payment to be collected upon pickup.`
        : `${req.user.name} initiated booking for "${item.title}" (${totalDays} days). Total: ₹${totalAmount.toLocaleString()}`,
      type: 'booking',
      link: '/my-rentals',
      io: req.io
    });

    const populatedRental = await Rental.findById(rental._id)
      .populate('item')
      .populate('owner', 'name avatar email phone location')
      .populate('renter', 'name avatar email phone');

    res.status(201).json({
      success: true,
      message: isCOD ? 'Booking confirmed with Cash on Delivery!' : 'Rental booking initiated successfully!',
      rental: populatedRental
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's rentals (both as renter and as lender/owner)
// @route   GET /api/rentals/my
// @access  Private
const getMyRentals = async (req, res, next) => {
  try {
    const asRenter = await Rental.find({ renter: req.user._id })
      .populate('item')
      .populate('owner', 'name avatar phone location rating')
      .sort({ createdAt: -1 });

    const asOwner = await Rental.find({ owner: req.user._id })
      .populate('item')
      .populate('renter', 'name avatar phone email location rating idVerificationStatus')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      asRenter,
      asOwner
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update rental status
// @route   PUT /api/rentals/:id/status
// @access  Private
const updateRentalStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const rental = await Rental.findById(req.params.id).populate('item');

    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental not found' });
    }

    if (
      rental.owner.toString() !== req.user._id.toString() &&
      rental.renter.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this rental' });
    }

    rental.status = status;

    // Check if late return penalty applies
    if (status === 'completed' && new Date() > new Date(rental.endDate)) {
      const msOverdue = new Date() - new Date(rental.endDate);
      const daysOverdue = Math.ceil(msOverdue / (1000 * 60 * 60 * 24));
      if (daysOverdue > 0) {
        // Late return penalty: 1.5x daily price per overdue day
        rental.lateFee = Math.round(daysOverdue * (rental.dailyPrice * 1.5));
      }
    }

    await rental.save();

    // Trigger notification to the other party
    const notifyRecipient =
      req.user._id.toString() === rental.owner.toString() ? rental.renter : rental.owner;

    await createNotification({
      recipient: notifyRecipient,
      sender: req.user._id,
      title: `Rental Status: ${status.toUpperCase()} 🔄`,
      message: `The rental for "${rental.item?.title}" is now marked as ${status}.`,
      type: 'status_change',
      link: '/my-rentals',
      io: req.io
    });

    res.status(200).json({
      success: true,
      rental
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Sign digital rental agreement
// @route   POST /api/rentals/:id/sign-agreement
// @access  Private
const signAgreement = async (req, res, next) => {
  try {
    const rental = await Rental.findById(req.params.id);
    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental not found' });
    }

    rental.agreementSigned = true;
    rental.agreementSignedAt = new Date();
    await rental.save();

    res.status(200).json({
      success: true,
      message: 'Rental agreement signed digitally',
      rental
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload condition photos (before pickup / after return)
// @route   POST /api/rentals/:id/condition-photos
// @access  Private
const uploadConditionPhotos = async (req, res, next) => {
  try {
    const { phase, photos } = req.body; // phase: 'before' or 'after', photos: [{ url, note }]
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental not found' });
    }

    if (phase === 'before') {
      rental.conditionBeforePhotos.push(...photos);
    } else {
      rental.conditionAfterPhotos.push(...photos);
    }

    await rental.save();

    res.status(200).json({
      success: true,
      message: `${phase === 'before' ? 'Pickup' : 'Return'} condition photos recorded`,
      rental
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update pickup / return checklist
// @route   PUT /api/rentals/:id/checklists
// @access  Private
const updateChecklists = async (req, res, next) => {
  try {
    const { pickupChecklist, returnChecklist } = req.body;
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental not found' });
    }

    if (pickupChecklist) rental.pickupChecklist = pickupChecklist;
    if (returnChecklist) rental.returnChecklist = returnChecklist;

    await rental.save();

    res.status(200).json({
      success: true,
      message: 'Checklist updated',
      rental
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request rental extension
// @route   POST /api/rentals/:id/request-extension
// @access  Private
const requestExtension = async (req, res, next) => {
  try {
    const { extraDays } = req.body;
    const rental = await Rental.findById(req.params.id).populate('item');

    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental not found' });
    }

    if (rental.renter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only renter can request extension' });
    }

    const days = Number(extraDays) || 1;
    const newEnd = new Date(rental.endDate);
    newEnd.setDate(newEnd.getDate() + days);

    const additionalAmount = days * rental.dailyPrice;

    rental.extensionRequests.push({
      extraDays: days,
      newEndDate: newEnd,
      additionalAmount,
      status: 'pending',
      requestedAt: new Date()
    });

    await rental.save();

    // Notify owner
    await createNotification({
      recipient: rental.owner,
      sender: req.user._id,
      title: 'Rental Extension Request ⏱️',
      message: `${req.user.name} requested a ${days}-day extension for "${rental.item?.title}" (+₹${additionalAmount}).`,
      type: 'extension',
      link: '/my-rentals',
      io: req.io
    });

    res.status(200).json({
      success: true,
      message: `Extension request for ${days} day(s) submitted to owner`,
      rental
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Respond to extension request (approve/reject)
// @route   PUT /api/rentals/:id/respond-extension
// @access  Private
const respondExtension = async (req, res, next) => {
  try {
    const { extensionId, action } = req.body; // action: 'approve' or 'reject'
    const rental = await Rental.findById(req.params.id).populate('item');

    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental not found' });
    }

    if (rental.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only owner can respond to extension request' });
    }

    const ext = rental.extensionRequests.id(extensionId);
    if (!ext) {
      return res.status(404).json({ success: false, message: 'Extension request not found' });
    }

    if (action === 'approve') {
      ext.status = 'approved';
      rental.endDate = ext.newEndDate;
      rental.totalDays += ext.extraDays;
      rental.totalAmount += ext.additionalAmount;
      rental.subtotal += ext.additionalAmount;
    } else {
      ext.status = 'rejected';
    }

    await rental.save();

    // Notify renter
    await createNotification({
      recipient: rental.renter,
      sender: req.user._id,
      title: action === 'approve' ? 'Extension Approved! 🎉' : 'Extension Declined',
      message: `Your extension request for "${rental.item?.title}" was ${action === 'approve' ? 'approved' : 'declined'} by owner.`,
      type: 'extension',
      link: '/my-rentals',
      io: req.io
    });

    res.status(200).json({
      success: true,
      message: `Extension request ${action}d successfully`,
      rental
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Owner Analytics: views, bookings, revenue, and popular items
// @route   GET /api/rentals/owner/analytics
// @access  Private
const getOwnerAnalytics = async (req, res, next) => {
  try {
    const ownerId = req.user._id;

    // Items owned by user
    const ownerItems = await Item.find({ owner: ownerId });
    const itemIds = ownerItems.map((i) => i._id);
    const totalViews = ownerItems.reduce((acc, curr) => acc + (curr.viewsCount || 0), 0);

    // Rentals on owner's items
    const rentals = await Rental.find({ owner: ownerId }).populate('item');

    const totalBookings = rentals.length;
    const activeRentals = rentals.filter((r) => ['confirmed', 'active'].includes(r.status)).length;
    const completedRentals = rentals.filter((r) => r.status === 'completed').length;

    // Total revenue earned (subtotal)
    const totalRevenue = rentals
      .filter((r) => r.paymentStatus === 'paid')
      .reduce((acc, curr) => acc + (curr.subtotal || 0), 0);

    // Security deposits currently held
    const activeDeposits = rentals
      .filter((r) => r.depositStatus === 'held')
      .reduce((acc, curr) => acc + (curr.securityDeposit || 0), 0);

    // Popular items ranking
    const itemRentalCounts = {};
    rentals.forEach((r) => {
      const id = r.item?._id?.toString();
      if (id) {
        itemRentalCounts[id] = (itemRentalCounts[id] || 0) + 1;
      }
    });

    const popularItems = ownerItems.map((item) => ({
      _id: item._id,
      title: item.title,
      images: item.images,
      pricePerDay: item.pricePerDay,
      category: item.category,
      viewsCount: item.viewsCount,
      bookingCount: itemRentalCounts[item._id.toString()] || 0,
      totalEarned: (itemRentalCounts[item._id.toString()] || 0) * item.pricePerDay * 2 // approximation
    })).sort((a, b) => b.bookingCount - a.bookingCount);

    res.status(200).json({
      success: true,
      analytics: {
        totalRevenue,
        totalBookings,
        activeRentals,
        completedRentals,
        activeDeposits,
        totalListings: ownerItems.length,
        totalViews,
        popularItems: popularItems.slice(0, 5)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Renter initiates early return of the item before end date
// @route   POST /api/rentals/:id/return-early
// @access  Private (Renter only)
const returnEarly = async (req, res, next) => {
  try {
    const rental = await Rental.findById(req.params.id).populate('item').populate('owner');
    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental not found' });
    }

    if (rental.renter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the renter can initiate early return' });
    }

    if (['completed', 'cancelled'].includes(rental.status)) {
      return res.status(400).json({ success: false, message: 'Rental is already finished or cancelled' });
    }

    rental.status = 'return_requested';
    rental.returnedEarly = true;
    rental.actualReturnDate = new Date();
    await rental.save();

    // Real-time notification to owner
    await createNotification({
      recipient: rental.owner._id,
      sender: req.user._id,
      title: 'Early Return Requested! 🔄',
      message: `${req.user.name} has initiated early return for "${rental.item?.title}". Please inspect and confirm receipt to choose whether to make it available for other renters.`,
      type: 'status_change',
      link: '/my-rentals?tab=lending',
      io: req.io
    });

    res.status(200).json({
      success: true,
      message: 'Early return initiated successfully. Waiting for owner to confirm receipt.',
      rental
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Owner confirms receipt of returned item and decides availability
// @route   POST /api/rentals/:id/confirm-return
// @access  Private (Owner only)
const confirmReturn = async (req, res, next) => {
  try {
    const { makeAvailable = true } = req.body;
    const rental = await Rental.findById(req.params.id).populate('item').populate('renter');
    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental not found' });
    }

    if (rental.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the item owner can confirm receipt' });
    }

    rental.status = 'completed';
    rental.actualReturnDate = rental.actualReturnDate || new Date();
    await rental.save();

    // Update item status based on owner's decision
    if (rental.item) {
      const newStatus = makeAvailable ? 'available' : 'inactive';
      await Item.findByIdAndUpdate(rental.item._id || rental.item, {
        status: newStatus,
        isAvailable: Boolean(makeAvailable)
      });
    }

    // Notify renter
    await createNotification({
      recipient: rental.renter._id,
      sender: req.user._id,
      title: 'Item Return Received & Confirmed! ✅',
      message: `Owner has confirmed return of "${rental.item?.title}". Rental is now completed. Thank you!`,
      type: 'status_change',
      link: '/my-rentals',
      io: req.io
    });

    res.status(200).json({
      success: true,
      message: `Return confirmed! Item has been set to ${makeAvailable ? 'Available for new rentals' : 'Hidden / Inactive'}.`,
      rental,
      itemAvailable: Boolean(makeAvailable)
    });
  } catch (error) {
    next(error);
  }
};

export {
  createRental,
  getMyRentals,
  updateRentalStatus,
  signAgreement,
  uploadConditionPhotos,
  updateChecklists,
  requestExtension,
  respondExtension,
  getOwnerAnalytics,
  returnEarly,
  confirmReturn
};

export default {
  createRental,
  getMyRentals,
  updateRentalStatus,
  signAgreement,
  uploadConditionPhotos,
  updateChecklists,
  requestExtension,
  respondExtension,
  getOwnerAnalytics,
  returnEarly,
  confirmReturn
};
