import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an item title'],
      trim: true,
      maxlength: 120
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: [
        'Cameras',
        'Camera',
        'Electronics',
        'Laptop',
        'Vehicles',
        'Vehicle',
        'Tools',
        'Gaming',
        'Furniture',
        'Fashion',
        'Books',
        'Camping',
        'Other'
      ],
      default: 'Electronics'
    },
    description: {
      type: String,
      required: [true, 'Please provide a detailed description']
    },
    pricePerDay: {
      type: Number,
      required: [true, 'Please enter rental price per day'],
      min: [1, 'Price per day must be at least ₹1']
    },
    securityDeposit: {
      type: Number,
      default: 0
    },
    images: {
      type: [String],
      required: [true, 'Please provide at least one photo'],
      validate: [arrayLimit, '{PATH} exceeds limit of 10 photos']
    },
    location: {
      type: String,
      required: [true, 'Please provide item location'],
      default: 'Mumbai'
    },
    distance: {
      type: String,
      default: '1.5 km'
    },
    address: {
      type: String,
      default: 'Bandra West, Mumbai'
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    condition: {
      type: String,
      enum: ['Brand New', 'Like New', 'Excellent', 'Good', 'Fair'],
      default: 'Like New'
    },
    minRentalDays: {
      type: Number,
      default: 1
    },
    features: {
      type: [String],
      default: []
    },
    specs: {
      type: Map,
      of: String,
      default: {}
    },
    rating: {
      type: Number,
      default: 0
    },
    numReviews: {
      type: Number,
      default: 0
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['available', 'booked', 'rented', 'maintenance', 'inactive', 'hidden'],
      default: 'available'
    },
    viewsCount: {
      type: Number,
      default: 0
    },
    coordinates: {
      lat: {
        type: Number,
        default: 19.0760
      },
      lng: {
        type: Number,
        default: 72.8777
      }
    },
    tags: {
      type: [String],
      default: []
    },
    instantBooking: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

function arrayLimit(val) {
  return val.length <= 10;
}

// Full text search index
itemSchema.index({ title: 'text', description: 'text', location: 'text', category: 'text' });

export default mongoose.model('Item', itemSchema);
