import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Item from '../models/Item.js';
import Review from '../models/Review.js';
import { sendVerificationEmail, sendOtpEmail } from '../config/email.js';

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'rentify_super_secret_jwt_key_2026_modern_marketplace_app',
    {
      expiresIn: process.env.JWT_EXPIRE || '30d'
    }
  );
};

// @desc    Register a new user directly (no email verification required)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, location, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your full name, email address, and password'
      });
    }

    const normalizedEmail = (email || '').toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please log in.'
      });
    }

    user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      location: location || 'Mumbai, Maharashtra',
      phone: (phone || '').trim(),
      isVerified: true
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to Rentify.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        location: user.location,
        phone: user.phone,
        rating: user.rating || 0,
        rentalsCount: user.rentalsCount || 0,
        bio: user.bio,
        isVerified: true,
        wishlist: user.wishlist || []
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email address via token link
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing verification token'
      });
    }

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Verification link is invalid or has already been used'
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    const authToken = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! Welcome to Rentify.',
      token: authToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        location: user.location,
        phone: user.phone,
        rating: user.rating,
        rentalsCount: user.rentalsCount,
        bio: user.bio,
        isVerified: true,
        wishlist: user.wishlist
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend Verification Email
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    if (user.isEmailVerified && user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'This email is already verified. You can log in.'
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    await user.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const verificationUrl = `${clientUrl}/verify-email?token=${verificationToken}`;

    await sendVerificationEmail(user.email, verificationUrl, user.name);

    res.status(200).json({
      success: true,
      message: `A new verification email has been sent to ${user.email}.`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user._id);

    // Compute real dynamic rating from Review collection
    const userItems = await Item.find({ owner: user._id }).select('_id');
    const userItemIds = userItems.map((i) => i._id);
    const userReviews = await Review.find({ item: { $in: userItemIds } });

    let realRating = 0;
    if (userReviews.length > 0) {
      const avg = userReviews.reduce((acc, r) => acc + r.rating, 0) / userReviews.length;
      realRating = Number(avg.toFixed(1));
    }
    user.rating = realRating;
    user.rentalsCount = userItems.length;
    await user.save();

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        location: user.location,
        phone: user.phone,
        rating: realRating,
        rentalsCount: userItems.length,
        bio: user.bio,
        isVerified: user.isVerified,
        wishlist: user.wishlist
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Compute real dynamic rating from Review collection
    const userItems = await Item.find({ owner: user._id }).select('_id');
    const userItemIds = userItems.map((i) => i._id);
    const userReviews = await Review.find({ item: { $in: userItemIds } });

    let realRating = 0;
    if (userReviews.length > 0) {
      const avg = userReviews.reduce((acc, r) => acc + r.rating, 0) / userReviews.length;
      realRating = Number(avg.toFixed(1));
    }
    user.rating = realRating;
    user.rentalsCount = userItems.length;

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, location, bio, avatar } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (location) user.location = location;
    if (bio !== undefined) user.bio = bio;
    if (avatar) user.avatar = avatar;

    await user.save();

    // Compute real dynamic rating from Review collection
    const userItems = await Item.find({ owner: user._id }).select('_id');
    const userItemIds = userItems.map((i) => i._id);
    const userReviews = await Review.find({ item: { $in: userItemIds } });

    let realRating = 0;
    if (userReviews.length > 0) {
      const avg = userReviews.reduce((acc, r) => acc + r.rating, 0) / userReviews.length;
      realRating = Number(avg.toFixed(1));
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        location: user.location,
        phone: user.phone,
        rating: realRating,
        rentalsCount: userItems.length,
        bio: user.bio,
        isVerified: user.isVerified,
        wishlist: user.wishlist,
        role: user.role || 'user',
        idVerificationStatus: user.idVerificationStatus || 'unverified',
        idVerified: user.idVerificationStatus === 'verified',
        idDocumentUrl: user.idDocumentUrl || '',
        referralCode: user.referralCode || '',
        walletBalance: user.walletBalance || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle wishlist item
// @route   POST /api/auth/wishlist/:itemId
// @access  Private
const toggleWishlist = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const user = await User.findById(req.user._id);

    const index = user.wishlist.indexOf(itemId);
    if (index > -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(itemId);
    }

    await user.save();

    res.status(200).json({
      success: true,
      wishlist: user.wishlist
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password Request - sends 6-digit OTP to user's email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered email'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email address'
      });
    }

    // Generate 6-digit OTP code (valid for 10 minutes)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save();

    // Send OTP to user's email
    await sendOtpEmail(user.email, otp, user.name);

    res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${user.email}. Please check your email inbox.`,
      email: user.email
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password using OTP code sent to email
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { email, otpCode, newPassword } = req.body;

    if (!email || !otpCode || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, 6-digit OTP code, and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({
      email: normalizedEmail,
      resetPasswordOtp: otpCode.trim(),
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP verification code. Please request a new code.'
      });
    }

    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully! You can now log in.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews received on user's items and reviews written by user
// @route   GET /api/auth/reviews
// @access  Private
const getUserReviews = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Find all items owned by this user
    const userItems = await Item.find({ owner: userId }).select('_id title images pricePerDay category');
    const userItemIds = userItems.map((item) => item._id);

    // 2. Reviews received on user's items
    const receivedReviews = await Review.find({ item: { $in: userItemIds } })
      .populate('user', 'name avatar location email phone rating')
      .populate('item', 'title images pricePerDay category')
      .sort({ createdAt: -1 });

    // 3. Reviews given by this user to other items
    const givenReviews = await Review.find({ user: userId })
      .populate('item', 'title images pricePerDay category owner')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      receivedReviews,
      givenReviews,
      totalReceived: receivedReviews.length,
      totalGiven: givenReviews.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's populated wishlist
// @route   GET /api/auth/wishlist
// @access  Private
const getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      populate: { path: 'owner', select: 'name avatar rating location' }
    });

    res.status(200).json({
      success: true,
      wishlist: user.wishlist || []
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit identity verification document
// @route   POST /api/auth/verify-id
// @access  Private
const submitIdVerification = async (req, res, next) => {
  try {
    const { documentUrl } = req.body;
    if (!documentUrl) {
      return res.status(400).json({ success: false, message: 'Please provide document URL' });
    }

    const user = await User.findById(req.user._id);
    user.idDocumentUrl = documentUrl;
    user.idVerificationStatus = 'pending';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'ID document submitted for verification. Admin review is pending.',
      idVerificationStatus: 'pending'
    });
  } catch (error) {
    next(error);
  }
};

export {
  register,
  verifyEmail,
  resendVerificationEmail,
  login,
  getMe,
  updateProfile,
  toggleWishlist,
  getWishlist,
  submitIdVerification,
  forgotPassword,
  resetPassword,
  getUserReviews
};

export default {
  register,
  verifyEmail,
  resendVerificationEmail,
  login,
  getMe,
  updateProfile,
  toggleWishlist,
  getWishlist,
  submitIdVerification,
  forgotPassword,
  resetPassword,
  getUserReviews
};


