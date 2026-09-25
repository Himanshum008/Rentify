import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

import User from '../models/User.js';
import Item from '../models/Item.js';
import Review from '../models/Review.js';
import Rental from '../models/Rental.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Coupon from '../models/Coupon.js';

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rentify';
    await mongoose.connect(mongoUri);
    console.log('🌱 Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Item.deleteMany({});
    await Review.deleteMany({});
    await Rental.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});

    console.log('🧹 Cleared existing database collections');

    // Create demo users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const rahul = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      password: hashedPassword,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      phone: '+91 98765 43210',
      location: 'Mumbai, Maharashtra',
      rating: 4.9,
      rentalsCount: 24,
      bio: 'Photographer and gadget enthusiast in Mumbai. Love sharing gear with creative community!',
      isVerified: true
    });

    const priya = await User.create({
      name: 'Priya Patel',
      email: 'priya@example.com',
      password: hashedPassword,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      phone: '+91 98123 45678',
      location: 'Pune, Maharashtra',
      rating: 4.8,
      rentalsCount: 18,
      bio: 'Outdoor adventurer, camper, and weekend traveler.',
      isVerified: true
    });

    const ananya = await User.create({
      name: 'Ananya Verma',
      email: 'ananya@example.com',
      password: hashedPassword,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      phone: '+91 91234 56789',
      location: 'Thane, Maharashtra',
      rating: 4.7,
      rentalsCount: 12,
      bio: 'Tech reviewer & gamer. Renting out high-spec electronics when not in use.',
      isVerified: true
    });

    const admin = await User.create({
      name: 'Rentify Admin',
      email: 'admin@rentify.com',
      password: hashedPassword,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      role: 'admin',
      location: 'Mumbai, Maharashtra',
      phone: '+91 99999 88888',
      isVerified: true,
      idVerificationStatus: 'verified'
    });

    console.log('✅ Created 3 demo users + 1 admin user (admin@rentify.com / password123)');

    await Coupon.deleteMany({});
    await Coupon.create([
      {
        code: 'WELCOME50',
        description: '50% off on your first rental (up to ₹500)',
        discountType: 'percentage',
        discountValue: 50,
        maxDiscount: 500,
        minRentalAmount: 400
      },
      {
        code: 'WEEKEND20',
        description: '20% off weekend adventures',
        discountType: 'percentage',
        discountValue: 20,
        maxDiscount: 1000,
        minRentalAmount: 600
      },
      {
        code: 'RENTIFY10',
        description: 'Flat 10% discount on all rentals',
        discountType: 'percentage',
        discountValue: 10,
        maxDiscount: 2000,
        minRentalAmount: 200
      }
    ]);
    console.log('✅ Created demo coupons: WELCOME50, WEEKEND20, RENTIFY10');

    // Demo Items matching screenshots
    const itemsData = [
      {
        title: 'Sony Alpha DSLR Camera',
        category: 'Cameras',
        description:
          'High-quality Sony Alpha DSLR camera with 24.2 MP sensor, perfect for photography enthusiasts and creators. Comes with 18-55mm lens, battery, charger, strap, and 64GB high-speed memory card.',
        pricePerDay: 800,
        securityDeposit: 4000,
        images: [
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'
        ],
        location: 'Mumbai',
        address: 'Bandra West, Mumbai',
        distance: '2.1 km',
        condition: 'Like New',
        minRentalDays: 1,
        features: ['24.2 MP', 'Full HD Video', 'WiFi / Bluetooth', 'Battery Life: 600 shots'],
        owner: rahul._id,
        rating: 4.8,
        numReviews: 32,
        isAvailable: true
      },
      {
        title: 'PS5 Console with DualSense',
        category: 'Gaming',
        description:
          'Sony PlayStation 5 Console Disc Edition with 2 DualSense Wireless Controllers and 5 popular games (Spider-Man 2, FIFA 24, God of War Ragnarok, Horizon, Gran Turismo 7).',
        pricePerDay: 500,
        securityDeposit: 5000,
        images: [
          'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80'
        ],
        location: 'Thane',
        address: 'Ghodbunder Road, Thane',
        distance: '3.4 km',
        condition: 'Like New',
        minRentalDays: 1,
        features: ['4K HDR 120fps', '2 DualSense Controllers', 'Ultra-fast 825GB SSD', '5 Top Games Pre-loaded'],
        owner: ananya._id,
        rating: 4.8,
        numReviews: 48,
        isAvailable: true
      },
      {
        title: 'Mountain Bike (21 Speed)',
        category: 'Vehicles',
        description:
          'Premium lightweight alloy frame Mountain Bike with 21-speed Shimano gearing, front suspension, and dual mechanical disc brakes. Ideal for city commutes and weekend trail rides.',
        pricePerDay: 700,
        securityDeposit: 2000,
        images: [
          'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=800&q=80'
        ],
        location: 'Mumbai',
        address: 'Andheri West, Mumbai',
        distance: '4.2 km',
        condition: 'Excellent',
        minRentalDays: 1,
        features: ['21 Shimano Gears', 'Dual Disc Brakes', 'Helmet & Lock Included', 'Lightweight Alloy'],
        owner: rahul._id,
        rating: 4.7,
        numReviews: 21,
        isAvailable: true
      },
      {
        title: '4K Home Cinema Projector',
        category: 'Electronics',
        description:
          'Ultra-bright 3800 ANSI Lumens 4K Home Cinema Projector with HDMI, screen mirroring from iPhone/Android, and high-fidelity built-in speakers. Great for outdoor movie nights and presentations.',
        pricePerDay: 600,
        securityDeposit: 3000,
        images: [
          'https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80'
        ],
        location: 'Pune',
        address: 'Koregaon Park, Pune',
        distance: '2.8 km',
        condition: 'Like New',
        minRentalDays: 1,
        features: ['4K UHD Support', '3800 ANSI Lumens', 'Wireless Screen Mirror', 'HDMI Cable Included'],
        owner: priya._id,
        rating: 4.6,
        numReviews: 18,
        isAvailable: true
      },
      {
        title: 'Apple MacBook Pro M2 (16GB)',
        category: 'Electronics',
        description:
          'Apple MacBook Pro 14-inch with M2 Pro Chip, 16GB Unified Memory, and 512GB SSD. Perfect for video editing, software development, design sprints, and presentations.',
        pricePerDay: 1200,
        securityDeposit: 15000,
        images: [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80'
        ],
        location: 'Mumbai',
        address: 'Powai, Mumbai',
        distance: '1.3 km',
        condition: 'Brand New',
        minRentalDays: 2,
        features: ['Apple M2 Pro Chip', '16GB Unified RAM', 'Liquid Retina XDR', 'MagSafe Charger'],
        owner: rahul._id,
        rating: 4.9,
        numReviews: 16,
        isAvailable: true
      },
      {
        title: 'Professional Camera Tripod & Monopod',
        category: 'Cameras',
        description:
          'Sturdy carbon fiber heavy-duty photography and videography tripod with fluid video head, 360-degree panoramic rotation, and quick conversion to monopod.',
        pricePerDay: 200,
        securityDeposit: 800,
        images: [
          'https://images.unsplash.com/photo-1520390138845-fd2d229dd553?auto=format&fit=crop&w=800&q=80'
        ],
        location: 'Mumbai',
        address: 'Dadar, Mumbai',
        distance: '2.8 km',
        condition: 'Excellent',
        minRentalDays: 1,
        features: ['Carbon Fiber', 'Fluid Video Head', 'Max Height 180cm', 'Quick Release Plate'],
        owner: rahul._id,
        rating: 4.8,
        numReviews: 12,
        isAvailable: true
      },
      {
        title: '4-Person Waterproof Camping Tent',
        category: 'Camping',
        description:
          'Spacious waterproof dual-layer camping tent that easily fits 4 adults. Quick 5-minute setup with aluminum poles, rainfly, ground sheet, and storage bag.',
        pricePerDay: 400,
        securityDeposit: 1500,
        images: [
          'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=800&q=80'
        ],
        location: 'Pune',
        address: 'Baner, Pune',
        distance: '5.2 km',
        condition: 'Like New',
        minRentalDays: 1,
        features: ['4 Person Capacity', 'Waterproof 3000mm', 'UV Sun Protection', 'Easy 5-Min Setup'],
        owner: priya._id,
        rating: 4.7,
        numReviews: 19,
        isAvailable: true
      },
      {
        title: 'GoPro HERO 11 Black Action Cam',
        category: 'Cameras',
        description:
          'GoPro HERO11 Black with 5.3K60 Ultra HD video, HyperSmooth 5.0 stabilization, 2 Enduro batteries, dual charger, chest mount, selfie stick, and 128GB SanDisk Extreme micro SD card.',
        pricePerDay: 500,
        securityDeposit: 3500,
        images: [
          'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'
        ],
        location: 'Mumbai',
        address: 'Colaba, Mumbai',
        distance: '3.1 km',
        condition: 'Like New',
        minRentalDays: 1,
        features: ['5.3K60 Video', 'HyperSmooth 5.0', 'Waterproof 33ft (10m)', '2x Enduro Batteries'],
        owner: rahul._id,
        rating: 4.8,
        numReviews: 23,
        isAvailable: true
      },
      {
        title: 'Ergonomic Gaming & Work Chair',
        category: 'Furniture',
        description:
          'High back ergonomic chair with memory foam cushion, adjustable 4D armrests, 180-degree reclining mechanism, and breathable PU leather.',
        pricePerDay: 450,
        securityDeposit: 1800,
        images: [
          'https://images.unsplash.com/photo-1580481077195-c3f2d22f689f?auto=format&fit=crop&w=800&q=80'
        ],
        location: 'Mumbai',
        address: 'Kurla, Mumbai',
        distance: '2.6 km',
        condition: 'Excellent',
        minRentalDays: 3,
        features: ['Lumbar & Neck Pillow', '180 Degree Recline', '4D Adjustable Armrests', 'Heavy Duty Base'],
        owner: ananya._id,
        rating: 4.8,
        numReviews: 14,
        isAvailable: true
      },
      {
        title: 'Bosch Cordless Power Drill Set',
        category: 'Tools',
        description:
          'Bosch 18V Cordless Impact Drill with 2 lithium-ion batteries, quick charger, and complete 42-piece drill & screw bit kit in heavy-duty carry case.',
        pricePerDay: 350,
        securityDeposit: 1200,
        images: [
          'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80'
        ],
        location: 'Mumbai',
        address: 'Malad, Mumbai',
        distance: '1.8 km',
        condition: 'Like New',
        minRentalDays: 1,
        features: ['18V Lithium Power', '2 Batteries Included', '42-Piece Bit Set', 'High Torque Impact'],
        owner: rahul._id,
        rating: 4.9,
        numReviews: 11,
        isAvailable: true
      }
    ];

    const createdItems = await Item.insertMany(itemsData);
    console.log(`✅ Created ${createdItems.length} demo listings`);

    // Add some sample reviews for Sony Alpha Camera
    const cameraItem = createdItems[0];
    await Review.create([
      {
        item: cameraItem._id,
        user: priya._id,
        rating: 5,
        comment: 'Camera was in pristine condition! Rahul provided extra batteries and was super helpful explaining the setup. 10/10 experience!'
      },
      {
        item: cameraItem._id,
        user: ananya._id,
        rating: 5,
        comment: 'Rented this for a 3-day wedding shoot. Pictures turned out breathtaking. Smooth pickup and dropoff!'
      }
    ]);

    // Create a demo conversation between Priya and Rahul
    const demoConv = await Conversation.create({
      participants: [priya._id, rahul._id],
      item: cameraItem._id,
      lastMessage: 'Hi Rahul! Is the Sony Alpha available for this coming weekend?',
      lastMessageSender: priya._id,
      lastMessageAt: new Date()
    });

    await Message.create({
      conversationId: demoConv._id,
      sender: priya._id,
      receiver: rahul._id,
      text: 'Hi Rahul! Is the Sony Alpha camera available for this coming weekend? I need it for a photoshoot in Bandra.'
    });

    await Message.create({
      conversationId: demoConv._id,
      sender: rahul._id,
      receiver: priya._id,
      text: 'Hey Priya! Yes, it is fully available and charged with an extra 64GB card. You can pick it up anytime Friday evening!'
    });

    console.log('✅ Demo conversations & reviews created');
    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
