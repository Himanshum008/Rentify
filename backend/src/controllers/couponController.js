import Coupon from '../models/Coupon.js';

// @desc    Validate and Apply Coupon Code
// @route   POST /api/coupons/apply
// @access  Private
const applyCoupon = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Please enter a coupon code' });
    }

    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon code' });
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }

    const orderSubtotal = Number(subtotal) || 0;
    if (orderSubtotal < coupon.minRentalAmount) {
      return res.status(400).json({
        success: false,
        message: `This coupon requires a minimum rental subtotal of ₹${coupon.minRentalAmount}`
      });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (orderSubtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = Math.min(orderSubtotal, coupon.discountValue);
    }

    discount = Math.round(discount);

    res.status(200).json({
      success: true,
      message: `Coupon "${coupon.code}" applied! You saved ₹${discount}`,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: discount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Active Public Coupons
// @route   GET /api/coupons
// @access  Public
const getActiveCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find({
      isActive: true,
      expiresAt: { $gt: new Date() }
    })
      .select('code description discountType discountValue minRentalAmount maxDiscount expiresAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      coupons
    });
  } catch (error) {
    next(error);
  }
};

export {
  applyCoupon,
  getActiveCoupons
};

export default {
  applyCoupon,
  getActiveCoupons
};
