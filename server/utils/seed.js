require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const Business = require('../models/Business');
const Job = require('../models/Job');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected for seeding');
};

const seed = async () => {
  try {
    await connectDB();

    // Clear existing
    await User.deleteMany({});
    await WorkerProfile.deleteMany({});
    await Business.deleteMany({});
    await Job.deleteMany({});

    // Admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@worknear.com',
      passwordHash: 'admin123',
      role: 'ADMIN',
      phone: '9999999999',
    });

    // Worker - Rahul (demo)
    const rahul = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      passwordHash: 'password123',
      role: 'JOB_SEEKER',
      phone: '9876543210',
      location: {
        type: 'Point',
        coordinates: [77.2090, 28.6139], // Delhi approx
        address: 'Connaught Place',
        city: 'New Delhi',
        locality: 'CP',
      },
    });

    await WorkerProfile.create({
      userId: rahul._id,
      skills: ['Excel', 'Billing', 'Customer Service', 'Basic Computer'],
      education: 'B.Com',
      experience: '1 year part-time cashier experience',
      experienceYears: 1,
      expectedSalary: { min: 8000, max: 12000 },
      jobPreference: 'PART_TIME',
      preferredRadius: 5,
      languages: ['Hindi', 'English'],
      bio: 'Reliable student looking for evening part-time work.',
      isStudent: true,
      availableToday: true,
      availability: [
        { day: 'Monday', available: true, from: '16:00', to: '21:00' },
        { day: 'Tuesday', available: true, from: '16:00', to: '21:00' },
        { day: 'Wednesday', available: true, from: '16:00', to: '21:00' },
        { day: 'Thursday', available: true, from: '16:00', to: '21:00' },
        { day: 'Friday', available: true, from: '16:00', to: '21:00' },
        { day: 'Saturday', available: true, from: '10:00', to: '18:00' },
        { day: 'Sunday', available: true, from: '10:00', to: '18:00' },
      ],
    });

    // Business - ABC Café
    const cafeOwner = await User.create({
      name: 'Amit Patel',
      email: 'abc@cafe.com',
      passwordHash: 'password123',
      role: 'BUSINESS',
      phone: '9123456780',
      location: {
        type: 'Point',
        coordinates: [77.2167, 28.6328],
        address: 'Near Connaught Place',
        city: 'New Delhi',
        locality: 'CP',
      },
    });

    const cafe = await Business.create({
      userId: cafeOwner._id,
      businessName: 'ABC Café',
      category: 'Cafe',
      description: 'Popular local café looking for reliable part-time staff.',
      location: {
        type: 'Point',
        coordinates: [77.2167, 28.6328],
        address: 'Near Connaught Place',
        city: 'New Delhi',
        locality: 'CP',
      },
      phone: '9123456780',
      verified: true,
    });

    // Job - Part-Time Cashier
    await Job.create({
      businessId: cafe._id,
      title: 'Part-Time Cashier',
      description:
        'We need a friendly cashier who can handle billing, customer service and basic computer operations. Ideal for students. Evening shifts preferred.',
      category: 'Cafe',
      skills: ['Billing', 'Customer Service', 'Basic Computer', 'Excel'],
      salaryMin: 9000,
      salaryMax: 11000,
      jobType: 'PART_TIME',
      experienceRequired: 0,
      workingHours: {
        from: '16:00',
        to: '21:00',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      },
      location: cafe.location,
      urgent: true,
      status: 'ACTIVE',
    });

    // Extra sample jobs
    await Job.create({
      businessId: cafe._id,
      title: 'Waiter (Evening)',
      description: 'Looking for waiters for evening service. Good communication skills required.',
      category: 'Cafe',
      skills: ['Customer Service', 'Serving'],
      salaryMin: 7000,
      salaryMax: 9000,
      jobType: 'PART_TIME',
      experienceRequired: 0,
      workingHours: { from: '17:00', to: '22:00', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
      location: cafe.location,
      urgent: false,
      status: 'ACTIVE',
    });

    console.log('✅ Seed data created successfully!');
    console.log('--- Demo Accounts ---');
    console.log('Admin:   admin@worknear.com / admin123');
    console.log('Seeker:  rahul@example.com / password123');
    console.log('Business: abc@cafe.com / password123');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
