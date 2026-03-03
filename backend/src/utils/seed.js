/**
 * Run once to create the first Admin user.
 * Usage: node src/utils/seed.js
 */
require('dotenv').config({ path: '../../.env' });
require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ email: 'admin@starconnect.co.zw' });
  if (existing) {
    console.log('Admin user already exists, skipping seed.');
    process.exit(0);
  }

  await User.create({
    name: 'System Admin',
    email: 'admin@starconnect.co.zw',
    role: 'Admin',
    status: 'Active',
    password: 'Admin@1234',
  });

  console.log('Admin user created.');
  console.log('Email: admin@starconnect.co.zw');
  console.log('Password: Admin@1234');
  console.log('IMPORTANT: Change this password after first login!');
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
