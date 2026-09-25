import User from '../models/User.js';
import Item from '../models/Item.js';
import Rental from '../models/Rental.js';
import Dispute from '../models/Dispute.js';
import Payment from '../models/Payment.js';
import { createNotification } from './notificationController.js';

// @desc    Get Admin Dashboard Stats & Metrics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ idVerificationStatus: 'verified' });
    const pendingVerification = await User.countDocuments({ idVerificationStatus: 'pending' });

    const totalItems = await Item.countDocuments();
    const activeItems = await Item.countDocuments({ isAvailable: true });

    const totalRentals = await Rental.countDocuments();
    const activeRentals = await Rental.countDocuments({ status: { $in: ['confirmed', 'active'] } });
    const completedRentals = await Rental.countDocuments({ status: 'completed' });

    const openDisputes = await Dispute.countDocuments({ status: { $in: ['open', 'under_review'] } });

    // Financial totals
    const rentals = await Rental.find({ paymentStatus: 'paid' }).select('totalAmount securityDeposit subtotal');
    const grossVolume = rentals.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
    const platformFee = rentals.reduce((acc, curr) => acc + (curr.serviceFee || Math.round(curr.subtotal * 0.05)), 0);

    // Recent 5 disputes
    const recentDisputes = await Dispute.find()
      .populate('claimant', 'name email avatar')
      .populate('respondent', 'name email avatar')
      .populate('item', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        verifiedUsers,
        pendingVerification,
        totalItems,
        activeItems,
        totalRentals,
        activeRentals,
        completedRentals,
        openDisputes,
        grossVolume,
        platformFee
      },
      recentDisputes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users with filter
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAdminUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or Reject User ID Verification
// @route   PUT /api/admin/users/:id/verify-id
// @access  Private (Admin only)
const verifyUserId = async (req, res, next) => {
  try {
    const { status } = req.body; // 'verified' or 'rejected'

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid verification status' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.idVerificationStatus = status;
    user.idVerified = status === 'verified';
    await user.save();

    // Send notification to user
    await createNotification({
      recipient: user._id,
      sender: req.user._id,
      title: status === 'verified' ? 'Identity Verified! 🛡️' : 'Identity Verification Update',
      message:
        status === 'verified'
          ? 'Congratulations! Your government ID has been verified by the Rentify Trust & Safety team. You now hold a Verified badge!'
          : 'Your submitted ID document could not be verified. Please re-upload a clear photo in your profile.',
      type: 'verification',
      link: '/profile',
      io: req.io
    });

    res.status(200).json({
      success: true,
      message: `User identity ${status}`,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all rentals for admin
// @route   GET /api/admin/rentals
// @access  Private (Admin only)
const getAdminRentals = async (req, res, next) => {
  try {
    const rentals = await Rental.find()
      .populate('renter', 'name email avatar phone')
      .populate('owner', 'name email avatar phone')
      .populate('item', 'title images pricePerDay category')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: rentals.length,
      rentals
    });
  } catch (error) {
    next(error);
  }
};

export {
  getAdminStats,
  getAdminUsers,
  verifyUserId,
  getAdminRentals
};

export default {
  getAdminStats,
  getAdminUsers,
  verifyUserId,
  getAdminRentals
};
