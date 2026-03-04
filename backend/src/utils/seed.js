/**
 * Seed admin user and packages.
 * Usage: node src/utils/seed.js
 */
require('dotenv').config({ path: '../../.env' });
require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User');
const Package = require('../models/Package');

const PACKAGES = [
  { name: 'Diaspora Connect', totalCost: 574, deposit: 174, depositPercent: 30.31, weeklyAmount: 50, weeks: 8, type: 'Household', description: 'Ideal for individual households and families.' },
  { name: 'Business Essential', totalCost: 699, deposit: 209, depositPercent: 29.9, weeklyAmount: 61.25, weeks: 8, type: 'Business', description: 'Essential connectivity for small to medium businesses.' },
  { name: 'EduConnect (Schools)', totalCost: 624, deposit: 156, depositPercent: 25, weeklyAmount: 58.5, weeks: 8, type: 'School', description: 'Designed for schools and educational institutions.' },
  { name: 'Business Premium', totalCost: 2650, deposit: 795, depositPercent: 30, weeklyAmount: 231.88, weeks: 8, type: 'Business', description: 'High-performance package for large businesses.' },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Seed admin
  const existing = await User.findOne({ email: 'admin@starconnect.co.zw' });
  if (!existing) {
    await User.create({ name: 'System Admin', email: 'admin@starconnect.co.zw', role: 'Admin', status: 'Active', password: 'Admin@1234' });
    console.log('Admin user created → admin@starconnect.co.zw / Admin@1234');
  } else {
    console.log('Admin user already exists, skipping.');
  }

  // Seed packages
  for (const pkg of PACKAGES) {
    const exists = await Package.findOne({ name: pkg.name });
    if (!exists) {
      await Package.create(pkg);
      console.log(`Package created: ${pkg.name}`);
    } else {
      console.log(`Package already exists: ${pkg.name}`);
    }
  }

  console.log('Seed complete.');
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
