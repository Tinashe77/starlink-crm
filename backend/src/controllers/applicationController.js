const Application = require('../models/Application');
const Customer = require('../models/Customer');
const CustomerApplication = require('../models/CustomerApplication');
const Package = require('../models/Package');
const { syncCustomerApplication } = require('../utils/syncCustomerApplication');

const STAFF_ROLES = ['Admin', 'Agent'];
const roundMoney = (value) => Math.round(Number(value || 0) * 100) / 100;

const resolveDepositUpdate = ({ packageRecord, depositReceived, depositAmount }) => {
  const hasAmount = depositAmount !== undefined && depositAmount !== null && depositAmount !== '';
  const parsedAmount = hasAmount ? Number(depositAmount) : undefined;
  const minimumDeposit = roundMoney(packageRecord.deposit);
  const totalCost = roundMoney(packageRecord.totalCost);

  if (hasAmount && (!Number.isFinite(parsedAmount) || parsedAmount < 0)) {
    return { error: 'Deposit amount must be 0 or greater' };
  }

  if (hasAmount && parsedAmount > totalCost) {
    return { error: 'Deposit amount cannot be more than the total package cost' };
  }

  if (hasAmount && parsedAmount > 0 && parsedAmount < minimumDeposit) {
    return { error: `Deposit amount cannot be less than the minimum package deposit of USD ${minimumDeposit.toFixed(2)}` };
  }

  if (depositReceived === true && hasAmount && parsedAmount < minimumDeposit) {
    return { error: `Deposit amount cannot be less than the minimum package deposit of USD ${minimumDeposit.toFixed(2)}` };
  }

  const normalizedDepositReceived = depositReceived === undefined
    ? (hasAmount ? parsedAmount > 0 : undefined)
    : (hasAmount ? parsedAmount > 0 : Boolean(depositReceived));

  const normalizedDepositAmount = normalizedDepositReceived
    ? roundMoney(hasAmount ? parsedAmount : minimumDeposit)
    : (hasAmount ? roundMoney(parsedAmount) : undefined);

  return {
    depositReceived: normalizedDepositReceived,
    depositAmount: normalizedDepositAmount,
  };
};

// GET /api/applications
const getApplications = async (req, res) => {
  let filter = {};

  const unsyncedCustomerApplications = await CustomerApplication.find({
    $or: [{ linkedApplication: { $exists: false } }, { linkedApplication: null }],
  });

  for (const customerApplication of unsyncedCustomerApplications) {
    try {
      await syncCustomerApplication(customerApplication);
      await customerApplication.save();
    } catch (error) {
      console.error(`Failed to sync customer application ${customerApplication._id}:`, error.message);
    }
  }

  // Customers only see applications for their own customer profile
  if (req.user.role === 'Customer') {
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer) return res.json([]);
    filter.customer = customer._id;
  }

  const applications = await Application.find(filter)
    .populate('customer', 'fullName phonePrimary email customerType')
    .populate('package', 'name totalCost deposit depositPercent weeklyAmount weeks')
    .populate('reviewedBy', 'name')
    .sort({ createdAt: -1 });

  res.json(applications);
};

// GET /api/applications/:id
const getApplicationById = async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('customer')
    .populate('package')
    .populate('reviewedBy', 'name')
    .populate('createdBy', 'name');

  if (!application) return res.status(404).json({ message: 'Application not found' });

  // Customers can only view their own
  if (req.user.role === 'Customer') {
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer || !application.customer._id.equals(customer._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
  }

  res.json(application);
};

// POST /api/applications
const createApplication = async (req, res) => {
  let customerId = req.body.customer;

  const selectedPackage = await Package.findOne({ _id: req.body.package, isActive: true });
  if (!selectedPackage) {
    return res.status(400).json({ message: 'Selected package is inactive or no longer available' });
  }

  // If customer self-submitting, resolve their customer profile
  if (req.user.role === 'Customer') {
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer) return res.status(400).json({ message: 'Please complete your customer profile first' });
    customerId = customer._id;
  }

  const application = await Application.create({
    ...req.body,
    package: selectedPackage._id,
    customer: customerId,
    createdBy: req.user._id,
    submittedAt: req.body.status === 'Submitted' ? new Date() : undefined,
  });

  const populated = await application.populate([
    { path: 'customer', select: 'fullName phonePrimary email customerType' },
    { path: 'package', select: 'name totalCost deposit depositPercent weeklyAmount weeks' },
  ]);

  res.status(201).json({ message: 'Application created', application: populated });
};

// PATCH /api/applications/:id/status  (staff only)
const updateApplicationStatus = async (req, res) => {
  const { status, notes, rejectionReason, idVerified, ecocashVerified, depositReceived, depositAmount } = req.body;

  const application = await Application.findById(req.params.id);
  if (!application) return res.status(404).json({ message: 'Application not found' });

  const packageRecord = await Package.findById(application.package);
  if (!packageRecord) {
    return res.status(400).json({ message: 'The package linked to this application no longer exists' });
  }

  const normalizedDeposit = resolveDepositUpdate({
    packageRecord,
    depositReceived,
    depositAmount,
  });

  if (normalizedDeposit.error) {
    return res.status(400).json({ message: normalizedDeposit.error });
  }

  if (status) application.status = status;
  if (notes !== undefined) application.notes = notes;
  if (rejectionReason !== undefined) application.rejectionReason = rejectionReason;
  if (idVerified !== undefined) application.idVerified = idVerified;
  if (ecocashVerified !== undefined) application.ecocashVerified = ecocashVerified;
  if (normalizedDeposit.depositReceived !== undefined) application.depositReceived = normalizedDeposit.depositReceived;
  if (normalizedDeposit.depositAmount !== undefined) application.depositAmount = normalizedDeposit.depositAmount;

  if (status && status !== 'Draft') {
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
  }
  if (status === 'Submitted') {
    application.submittedAt = new Date();
  }

  await application.save();

  const populated = await application.populate([
    { path: 'customer', select: 'fullName phonePrimary email customerType' },
    { path: 'package', select: 'name totalCost deposit depositPercent weeklyAmount weeks' },
    { path: 'reviewedBy', select: 'name' },
  ]);

  res.json({ message: 'Application updated', application: populated });
};

// DELETE /api/applications/:id  (Admin or draft owner)
const deleteApplication = async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) return res.status(404).json({ message: 'Application not found' });

  if (application.status !== 'Draft') {
    return res.status(400).json({ message: 'Only Draft applications can be deleted' });
  }

  await application.deleteOne();
  res.json({ message: 'Application deleted' });
};

module.exports = { getApplications, getApplicationById, createApplication, updateApplicationStatus, deleteApplication };
