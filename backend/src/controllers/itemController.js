import Item from '../models/Item.js';
import Review from '../models/Review.js';
import User from '../models/User.js';
import Rental from '../models/Rental.js';

// @desc    Get all items with advanced search & filter
// @route   GET /api/items
// @access  Public
const getItems = async (req, res, next) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      location,
      availability,
      sort,
      limit = 50,
      page = 1
    } = req.query;

    const filter = {};

    // Search query filter
    if (search && search.trim() !== '') {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } },
        { location: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    // Category filter (support comma-separated or single)
    if (category && category !== 'All' && category !== '') {
      const categories = category.split(',').map((c) => c.trim());
      // Handle matching e.g. "Cameras" vs "Camera"
      const categoryRegexes = categories.map((c) => new RegExp(`^${c}`, 'i'));
      filter.category = { $in: categoryRegexes };
    }

    // Location filter
    if (location && location !== 'All' && location !== '') {
      filter.location = { $regex: location.trim(), $options: 'i' };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.pricePerDay = {};
      if (minPrice) filter.pricePerDay.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerDay.$lte = Number(maxPrice);
    }

    // Availability filter
    if (availability === 'available' || availability === 'Today' || availability === 'This Weekend') {
      filter.isAvailable = true;
    }

    // Sort order
    let sortOptions = { createdAt: -1 }; // Default: Most recent
    if (sort === 'price_asc') {
      sortOptions = { pricePerDay: 1 };
    } else if (sort === 'price_desc') {
      sortOptions = { pricePerDay: -1 };
    } else if (sort === 'rating') {
      sortOptions = { rating: -1, numReviews: -1 };
    } else if (sort === 'popular') {
      sortOptions = { viewsCount: -1, rating: -1 };
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 50;
    const skip = (pageNum - 1) * limitNum;

    const total = await Item.countDocuments(filter);
    const items = await Item.find(filter)
      .populate('owner', 'name avatar rating rentalsCount location')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: items.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      items
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single item by ID
// @route   GET /api/items/:id
// @access  Public
const getItemById = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('owner', 'name avatar email phone rating rentalsCount bio location createdAt');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Increment view count
    item.viewsCount += 1;
    await item.save({ validateBeforeSave: false });

    // Fetch reviews
    const reviews = await Review.find({ item: item._id })
      .populate('user', 'name avatar location')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      item,
      reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new item listing
// @route   POST /api/items
// @access  Private
const createItem = async (req, res, next) => {
  try {
    const {
      title,
      category,
      description,
      pricePerDay,
      securityDeposit,
      images,
      location,
      address,
      distance,
      condition,
      minRentalDays,
      features,
      specs
    } = req.body;

    if (!title || !category || !description || !pricePerDay || !images || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields (title, category, description, price, and at least 1 photo)'
      });
    }

    const item = await Item.create({
      title,
      category,
      description,
      pricePerDay: Number(pricePerDay),
      securityDeposit: Number(securityDeposit) || 0,
      images,
      location: location || req.user.location || 'Mumbai',
      address: address || 'Bandra West, Mumbai',
      distance: distance || '1.2 km',
      condition: condition || 'Like New',
      minRentalDays: Number(minRentalDays) || 1,
      features: features || [],
      specs: specs || {},
      owner: req.user._id,
      rating: 0,
      numReviews: 0,
      isAvailable: true
    });

    // Update user rental listing count
    await User.findByIdAndUpdate(req.user._id, { $inc: { rentalsCount: 1 } });

    const populatedItem = await Item.findById(item._id).populate(
      'owner',
      'name avatar rating rentalsCount'
    );

    res.status(201).json({
      success: true,
      message: 'Item listed successfully!',
      item: populatedItem
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's listed items
// @route   GET /api/items/my/listings
// @access  Private
const getMyListings = async (req, res, next) => {
  try {
    const items = await Item.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: items.length,
      items
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update item listing
// @route   PUT /api/items/:id
// @access  Private
const updateItem = async (req, res, next) => {
  try {
    let item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Check ownership
    if (item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this listing' });
    }

    item = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      item
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete item listing
// @route   DELETE /api/items/:id
// @access  Private
const deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Enforce ownership check
    if (item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this listing' });
    }

    const ownerId = item.owner;

    // 1. Delete associated reviews
    await Review.deleteMany({ item: item._id });

    // 2. Clean up user wishlists
    await User.updateMany({}, { $pull: { wishlist: item._id } });

    // 3. Decrement owner's rentalsCount
    await User.findByIdAndUpdate(ownerId, { $inc: { rentalsCount: -1 } });

    // 4. Delete the item
    await item.deleteOne();

    // 5. Recalculate owner's dynamic rating across remaining items
    const remainingOwnerItems = await Item.find({ owner: ownerId });
    const remainingItemIds = remainingOwnerItems.map((i) => i._id);
    const remainingReviews = await Review.find({ item: { $in: remainingItemIds } });

    let newOwnerRating = 0;
    if (remainingReviews.length > 0) {
      const avg = remainingReviews.reduce((acc, r) => acc + r.rating, 0) / remainingReviews.length;
      newOwnerRating = Number(avg.toFixed(1));
    }
    await User.findByIdAndUpdate(ownerId, { rating: newOwnerRating });

    res.status(200).json({
      success: true,
      message: 'Item listing deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add review for an item
// @route   POST /api/items/:id/reviews
// @access  Private
const addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const review = await Review.create({
      item: item._id,
      user: req.user._id,
      rating: Number(rating),
      comment
    });

    // Recalculate real item average rating
    const allItemReviews = await Review.find({ item: item._id });
    const avgRating =
      allItemReviews.reduce((acc, r) => r.rating + acc, 0) / allItemReviews.length;

    item.rating = Number(avgRating.toFixed(1));
    item.numReviews = allItemReviews.length;
    await item.save();

    // Recalculate real owner average rating
    const ownerItems = await Item.find({ owner: item.owner });
    const ownerItemIds = ownerItems.map((i) => i._id);
    const allOwnerReviews = await Review.find({ item: { $in: ownerItemIds } });

    if (allOwnerReviews.length > 0) {
      const ownerAvg =
        allOwnerReviews.reduce((acc, r) => r.rating + acc, 0) / allOwnerReviews.length;
      await User.findByIdAndUpdate(item.owner, { rating: Number(ownerAvg.toFixed(1)) });
    }

    const populatedReview = await Review.findById(review._id).populate(
      'user',
      'name avatar location'
    );

    res.status(201).json({
      success: true,
      review: populatedReview,
      itemRating: item.rating,
      numReviews: item.numReviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get booked date intervals for availability calendar
// @route   GET /api/items/:id/availability
// @access  Public
const getItemAvailability = async (req, res, next) => {
  try {
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const rentals = await Rental.find({
      item: req.params.id,
      endDate: { $gte: new Date() },
      $or: [
        { status: { $in: ['confirmed', 'active'] }, paymentStatus: 'paid' },
        { status: 'pending', createdAt: { $gte: fifteenMinsAgo } }
      ]
    }).select('startDate endDate status');

    const bookedIntervals = rentals.map((r) => ({
      startDate: r.startDate,
      endDate: r.endDate,
      status: r.status
    }));

    res.status(200).json({
      success: true,
      bookedIntervals
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get similar items by category
// @route   GET /api/items/:id/similar
// @access  Public
const getSimilarItems = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const similar = await Item.find({
      _id: { $ne: item._id },
      category: item.category,
      isAvailable: true
    })
      .populate('owner', 'name avatar rating location')
      .limit(4);

    res.status(200).json({
      success: true,
      items: similar
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get personalized recommendations
// @route   GET /api/items/recommendations/personalized
// @access  Public (optional auth)
const getPersonalizedRecommendations = async (req, res, next) => {
  try {
    let filter = { isAvailable: true };

    if (req.user && req.user.wishlist && req.user.wishlist.length > 0) {
      const wishlisted = await Item.find({ _id: { $in: req.user.wishlist } }).select('category');
      const cats = [...new Set(wishlisted.map((w) => w.category))];
      if (cats.length > 0) {
        filter.category = { $in: cats };
      }
    }

    let items = await Item.find(filter)
      .populate('owner', 'name avatar rating location')
      .sort({ rating: -1, viewsCount: -1 })
      .limit(6);

    if (items.length < 4) {
      items = await Item.find({ isAvailable: true })
        .populate('owner', 'name avatar rating location')
        .sort({ viewsCount: -1, rating: -1 })
        .limit(6);
    }

    res.status(200).json({
      success: true,
      items
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Owner toggles listing availability (available vs inactive/hidden)
// @route   PATCH /api/items/:id/toggle-availability
// @access  Private (Owner only)
const toggleItemAvailability = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (item.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to change availability for this listing' });
    }

    if (item.status === 'booked' || item.status === 'rented') {
      return res.status(400).json({
        success: false,
        message: 'This item is currently booked/rented. Once the rental is returned and confirmed, you can update its availability.'
      });
    }

    const willBeAvailable = !item.isAvailable;
    item.isAvailable = willBeAvailable;
    item.status = willBeAvailable ? 'available' : 'inactive';
    await item.save();

    res.status(200).json({
      success: true,
      message: `Item is now ${willBeAvailable ? 'Available for Renting' : 'Paused / Hidden'}`,
      isAvailable: willBeAvailable,
      item
    });
  } catch (error) {
    next(error);
  }
};

export {
  getItems,
  getItemById,
  createItem,
  getMyListings,
  updateItem,
  deleteItem,
  addReview,
  getItemAvailability,
  getSimilarItems,
  getPersonalizedRecommendations,
  toggleItemAvailability
};

export default {
  getItems,
  getItemById,
  createItem,
  getMyListings,
  updateItem,
  deleteItem,
  addReview,
  getItemAvailability,
  getSimilarItems,
  getPersonalizedRecommendations,
  toggleItemAvailability
};

