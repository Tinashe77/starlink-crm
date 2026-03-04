const Package = require('../models/Package');

const roundMoney = (value) => Math.round(value * 100) / 100;

const buildPackagePayload = (body) => {
  const totalCost = Number(body.totalCost);
  const depositPercent = Number(body.depositPercent);
  const weeks = body.weeks ? Number(body.weeks) : 8;
  const deposit = roundMoney((totalCost * depositPercent) / 100);
  const balance = totalCost - deposit;
  const weeklyAmount = body.weeklyAmount !== undefined && body.weeklyAmount !== ''
    ? Number(body.weeklyAmount)
    : roundMoney(balance / weeks);

  return {
    name: body.name,
    description: body.description,
    totalCost,
    deposit,
    depositPercent,
    weeklyAmount,
    weeks,
    type: body.type,
    isActive: body.isActive !== undefined ? body.isActive : true,
  };
};

// GET /api/packages  (any authenticated user)
const getPackages = async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true' && req.user.role === 'Admin';
  const filter = includeInactive ? {} : { isActive: true };
  const packages = await Package.find(filter).sort({ totalCost: 1 });
  res.json(packages);
};

// GET /api/packages/:id
const getPackageById = async (req, res) => {
  const item = await Package.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Package not found' });
  res.json(item);
};

// POST /api/packages  (Admin only)
const createPackage = async (req, res) => {
  const existing = await Package.findOne({ name: req.body.name?.trim() });
  if (existing) {
    return res.status(400).json({ message: 'A package with that name already exists' });
  }

  const item = await Package.create(buildPackagePayload(req.body));
  res.status(201).json({ message: 'Package created successfully', package: item });
};

// PUT /api/packages/:id  (Admin only)
const updatePackage = async (req, res) => {
  const item = await Package.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Package not found' });

  if (req.body.name && req.body.name.trim() !== item.name) {
    const existing = await Package.findOne({ name: req.body.name.trim() });
    if (existing) return res.status(400).json({ message: 'Package name already in use' });
  }

  Object.assign(item, buildPackagePayload({ ...item.toObject(), ...req.body }));
  await item.save();

  res.json({ message: 'Package updated successfully', package: item });
};

// DELETE /api/packages/:id  (Admin only)
const deletePackage = async (req, res) => {
  const item = await Package.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Package not found' });

  await item.deleteOne();
  res.json({ message: 'Package deleted successfully' });
};

module.exports = { getPackages, getPackageById, createPackage, updatePackage, deletePackage };
