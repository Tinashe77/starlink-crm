const Customer = require('../models/Customer');

const STAFF_ROLES = ['Admin', 'Agent'];

// GET /api/customers
const getCustomers = async (req, res) => {
  const customers = await Customer.find()
    .populate('user', 'name email status')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });
  res.json(customers);
};

// GET /api/customers/:id
const getCustomerById = async (req, res) => {
  const customer = await Customer.findById(req.params.id)
    .populate('user', 'name email status')
    .populate('createdBy', 'name');
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  res.json(customer);
};

// POST /api/customers  (staff creates customer, or customer creates their own profile)
const createCustomer = async (req, res) => {
  const isStaff = STAFF_ROLES.includes(req.user.role);

  const data = { ...req.body, createdBy: req.user._id };

  // If customer self-creating, link their user account
  if (!isStaff) {
    const existing = await Customer.findOne({ user: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You already have a customer profile' });
    }
    data.user = req.user._id;
    // Use their account email/name as fallback
    if (!data.fullName) data.fullName = req.user.name;
    if (!data.email) data.email = req.user.email;
    if (!data.phonePrimary) data.phonePrimary = req.user.phone || '';
  }

  const customer = await Customer.create(data);
  res.status(201).json({ message: 'Customer profile created', customer });
};

// PUT /api/customers/:id
const updateCustomer = async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return res.status(404).json({ message: 'Customer not found' });

  // Customers can only edit their own profile
  if (req.user.role === 'Customer' && !customer.user?.equals(req.user._id)) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  Object.assign(customer, req.body);
  await customer.save();
  res.json({ message: 'Customer updated', customer });
};

// GET /api/customers/me  (customer gets their own profile)
const getMyProfile = async (req, res) => {
  const customer = await Customer.findOne({ user: req.user._id });
  if (!customer) return res.status(404).json({ message: 'No customer profile found' });
  res.json(customer);
};

module.exports = { getCustomers, getCustomerById, createCustomer, updateCustomer, getMyProfile };
