const crypto = require('crypto');
const User = require('../models/User');
const { sendWelcomeEmail } = require('../utils/email');

// GET /api/users  (Admin only)
const getUsers = async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users);
};

// GET /api/users/:id  (Admin only)
const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

// POST /api/users  (Admin only — creates a staff account)
const createUser = async (req, res) => {
  const { name, email, phone, role, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: 'A user with that email already exists' });
  }

  // Use provided password or auto-generate one
  const assignedPassword = password || crypto.randomBytes(6).toString('hex');

  const user = await User.create({ name, email, phone, role, password: assignedPassword });

  try {
    await sendWelcomeEmail(user, assignedPassword);
  } catch (err) {
    console.error('Welcome email failed:', err.message);
  }

  const message = password
    ? 'User created successfully.'
    : 'User created successfully. Login credentials have been emailed.';

  res.status(201).json({
    message,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
    },
  });
};

// PUT /api/users/:id  (Admin only)
const updateUser = async (req, res) => {
  const { name, email, phone, role } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (email && email !== user.email) {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });
  }

  user.name = name || user.name;
  user.email = email || user.email;
  user.phone = phone || user.phone;
  user.role = role || user.role;
  await user.save();

  res.json({ message: 'User updated', user });
};

// PATCH /api/users/:id/status  (Admin only — enable/disable)
const toggleUserStatus = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Prevent admin from disabling themselves
  if (user._id.equals(req.user._id)) {
    return res.status(400).json({ message: 'You cannot disable your own account' });
  }

  user.status = user.status === 'Active' ? 'Inactive' : 'Active';
  await user.save();

  res.json({ message: `User ${user.status === 'Active' ? 'enabled' : 'disabled'}`, user });
};

// DELETE /api/users/:id  (Admin only)
const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user._id.equals(req.user._id)) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }

  await user.deleteOne();
  res.json({ message: 'User deleted' });
};

module.exports = { getUsers, getUserById, createUser, updateUser, toggleUserStatus, deleteUser };
