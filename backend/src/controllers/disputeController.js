import Dispute from '../models/Dispute.js';
import Rental from '../models/Rental.js';
import User from '../models/User.js';
import { createNotification } from './notificationController.js';

// @desc    File a new dispute
// @route   POST /api/disputes
// @access  Private
const fileDispute = async (req, res, next) => {
  try {
    const { rentalId, reason, description, claimAmount, evidencePhotos = [] } = req.body;

    const rental = await Rental.findById(rentalId).populate('item');
    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental not found' });
    }

    const isRenter = rental.renter.toString() === req.user._id.toString();
    const isOwner = rental.owner.toString() === req.user._id.toString();

    if (!isRenter && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to file dispute on this rental' });
    }

    const respondentId = isRenter ? rental.owner : rental.renter;

    const dispute = await Dispute.create({
      rental: rental._id,
      item: rental.item._id,
      claimant: req.user._id,
      respondent: respondentId,
      reason,
      description,
      claimAmount: Number(claimAmount) || 0,
      evidencePhotos,
      status: 'open'
    });

    rental.depositStatus = 'disputed';
    await rental.save();

    // Notify Respondent
    await createNotification({
      recipient: respondentId,
      sender: req.user._id,
      title: 'Dispute Filed for Rental ⚠️',
      message: `${req.user.name} filed a dispute regarding "${rental.item?.title}" for: ${reason}. Claim amount: ₹${claimAmount}.`,
      type: 'dispute',
      link: '/my-rentals',
      io: req.io
    });

    res.status(201).json({
      success: true,
      message: 'Dispute filed successfully and submitted to Rentify Trust & Safety',
      dispute
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's disputes (as claimant or respondent)
// @route   GET /api/disputes/my-disputes
// @access  Private
const getMyDisputes = async (req, res, next) => {
  try {
    const disputes = await Dispute.find({
      $or: [{ claimant: req.user._id }, { respondent: req.user._id }]
    })
      .populate('claimant', 'name email avatar phone')
      .populate('respondent', 'name email avatar phone')
      .populate('item', 'title images pricePerDay category')
      .populate('rental')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: disputes.length,
      disputes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dispute details by ID
// @route   GET /api/disputes/:id
// @access  Private
const getDisputeById = async (req, res, next) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate('claimant', 'name email avatar phone')
      .populate('respondent', 'name email avatar phone')
      .populate('item')
      .populate('rental');

    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute not found' });
    }

    const isParty =
      dispute.claimant._id.toString() === req.user._id.toString() ||
      dispute.respondent._id.toString() === req.user._id.toString();

    if (!isParty && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this dispute' });
    }

    res.status(200).json({
      success: true,
      dispute
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resolve dispute (admin or claimant/respondent agreement)
// @route   PUT /api/disputes/:id/resolve
// @access  Private
const resolveDispute = async (req, res, next) => {
  try {
    const { resolutionType, deductedAmount = 0, refundedAmount = 0, notes = '' } = req.body;

    const dispute = await Dispute.findById(req.params.id).populate('rental').populate('item');
    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute not found' });
    }

    if (req.user.role !== 'admin' && dispute.claimant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only admin or claimant can resolve dispute' });
    }

    dispute.status = 'resolved';
    dispute.resolution = {
      resolvedBy: req.user._id,
      resolvedAt: new Date(),
      resolutionType,
      deductedAmount: Number(deductedAmount),
      refundedAmount: Number(refundedAmount),
      notes
    };
    await dispute.save();

    // Update rental deposit status
    if (dispute.rental) {
      const rental = await Rental.findById(dispute.rental._id);
      if (rental) {
        if (Number(deductedAmount) > 0) {
          rental.depositStatus = 'deducted';
          rental.deductionAmount = Number(deductedAmount);
          rental.refundAmount = Math.max(0, rental.securityDeposit - Number(deductedAmount));
        } else {
          rental.depositStatus = 'refunded';
          rental.refundAmount = rental.securityDeposit;
        }
        await rental.save();
      }
    }

    // Notify both parties
    await createNotification({
      recipient: dispute.claimant,
      sender: req.user._id,
      title: 'Dispute Resolved ✅',
      message: `Dispute on "${dispute.item?.title}" resolved: ${notes || resolutionType}`,
      type: 'dispute',
      link: '/my-rentals',
      io: req.io
    });

    await createNotification({
      recipient: dispute.respondent,
      sender: req.user._id,
      title: 'Dispute Resolved ✅',
      message: `Dispute on "${dispute.item?.title}" resolved: ${notes || resolutionType}`,
      type: 'dispute',
      link: '/my-rentals',
      io: req.io
    });

    res.status(200).json({
      success: true,
      message: 'Dispute resolved successfully',
      dispute
    });
  } catch (error) {
    next(error);
  }
};

export {
  fileDispute,
  getMyDisputes,
  getDisputeById,
  resolveDispute
};

export default {
  fileDispute,
  getMyDisputes,
  getDisputeById,
  resolveDispute
};
