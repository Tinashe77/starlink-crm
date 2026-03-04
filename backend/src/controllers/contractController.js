const Application = require('../models/Application');
const Contract = require('../models/Contract');
const Customer = require('../models/Customer');
const PaymentScheduleItem = require('../models/PaymentScheduleItem');
const { recalculateContractStatus } = require('../utils/recalculateContractStatus');

const roundMoney = (value) => Math.round(value * 100) / 100;

const ensurePackageFinancials = async (packageRecord) => {
  let changed = false;

  if ((packageRecord.depositPercent === undefined || packageRecord.depositPercent === null) && packageRecord.totalCost > 0) {
    packageRecord.depositPercent = roundMoney((packageRecord.deposit / packageRecord.totalCost) * 100);
    changed = true;
  }

  if ((packageRecord.deposit === undefined || packageRecord.deposit === null) && packageRecord.depositPercent !== undefined) {
    packageRecord.deposit = roundMoney((packageRecord.totalCost * packageRecord.depositPercent) / 100);
    changed = true;
  }

  if (changed) {
    await packageRecord.save();
  }

  return packageRecord;
};

const contractPopulate = [
  { path: 'customer', select: 'fullName phonePrimary email customerType' },
  { path: 'application', select: 'applicationNo status depositReceived depositAmount' },
  { path: 'package', select: 'name totalCost deposit depositPercent weeklyAmount weeks type' },
  { path: 'createdBy', select: 'name role' },
  { path: 'updatedBy', select: 'name role' },
];

// GET /api/contracts
const getContracts = async (req, res) => {
  let filter = {};

  if (req.user.role === 'Customer') {
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer) return res.json([]);
    filter.customer = customer._id;
  }

  const contracts = await Contract.find(filter)
    .populate(contractPopulate)
    .sort({ createdAt: -1 });

  res.json(contracts);
};

// GET /api/contracts/:id
const getContractById = async (req, res) => {
  const contract = await Contract.findById(req.params.id).populate(contractPopulate);

  if (!contract) {
    return res.status(404).json({ message: 'Contract not found' });
  }

  if (req.user.role === 'Customer') {
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer || !contract.customer?._id.equals(customer._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
  }

  res.json(contract);
};

// POST /api/contracts
const createContract = async (req, res) => {
  const application = await Application.findById(req.body.application)
    .populate('customer')
    .populate('package');

  if (!application) {
    return res.status(404).json({ message: 'Application not found' });
  }

  if (application.status !== 'Approved') {
    return res.status(400).json({ message: 'Only approved applications can generate contracts' });
  }

  const existing = await Contract.findOne({ application: application._id });
  if (existing) {
    return res.status(400).json({ message: 'A contract already exists for this application' });
  }

  const packageData = await ensurePackageFinancials(application.package);
  const depositAmount = roundMoney(packageData.deposit);
  const totalContractValue = roundMoney(packageData.totalCost);
  const depositPaid = req.body.depositPaid ?? Boolean(application.depositReceived);
  const outstandingBalance = req.body.outstandingBalance !== undefined
    ? Number(req.body.outstandingBalance)
    : roundMoney(totalContractValue - (depositPaid ? depositAmount : 0));

  const status = req.body.status || (depositPaid ? 'Active' : 'Pending Deposit');
  const activatedAt = status === 'Active' ? new Date() : undefined;
  const completedAt = status === 'Completed' ? new Date() : undefined;

  const contract = await Contract.create({
    customer: application.customer._id,
    application: application._id,
    package: packageData._id,
    totalContractValue,
    depositAmount,
    depositPercent: packageData.depositPercent,
    weeklyInstallment: roundMoney(packageData.weeklyAmount),
    durationWeeks: packageData.weeks,
    depositPaid,
    outstandingBalance,
    status,
    paymentPlanReady: Boolean(req.body.paymentPlanReady),
    activatedAt,
    completedAt,
    agreementDate: req.body.agreementDate || new Date(),
    notes: req.body.notes,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  const populated = await contract.populate(contractPopulate);

  res.status(201).json({ message: 'Contract created successfully', contract: populated });
};

// PUT /api/contracts/:id
const updateContract = async (req, res) => {
  const contract = await Contract.findById(req.params.id);

  if (!contract) {
    return res.status(404).json({ message: 'Contract not found' });
  }

  const editableFields = [
    'status',
    'depositPaid',
    'outstandingBalance',
    'paymentPlanReady',
    'notes',
  ];

  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      contract[field] = req.body[field];
    }
  });

  if (req.body.status === 'Active' && !contract.activatedAt) {
    contract.activatedAt = new Date();
  }

  if (req.body.status === 'Completed') {
    contract.completedAt = new Date();
    contract.outstandingBalance = 0;
  } else if (req.body.status && req.body.status !== 'Completed') {
    contract.completedAt = undefined;
  }

  contract.updatedBy = req.user._id;
  await contract.save();

  const scheduleCount = await PaymentScheduleItem.countDocuments({ contract: contract._id });
  if (scheduleCount > 0) {
    await recalculateContractStatus(contract._id);
  }

  const populated = await contract.populate(contractPopulate);

  res.json({ message: 'Contract updated successfully', contract: populated });
};

// PATCH /api/contracts/:id/sign
const signContract = async (req, res) => {
  const contract = await Contract.findById(req.params.id).populate('customer', 'user fullName idNumber');

  if (!contract) {
    return res.status(404).json({ message: 'Contract not found' });
  }

  const customer = await Customer.findOne({ user: req.user._id });
  if (!customer || !contract.customer?._id.equals(customer._id)) {
    return res.status(403).json({ message: 'Not authorized to sign this contract' });
  }

  contract.customerSigned = true;
  contract.customerSignatureDataUrl = req.body.signatureDataUrl;
  contract.customerSignatureName = req.body.signatureName || contract.customer.fullName;
  contract.customerSignedAt = req.body.signedAt || new Date();
  contract.witnessName = req.body.witnessName || '';
  contract.witnessIdNumber = req.body.witnessIdNumber || '';
  contract.witnessSignedAt = req.body.witnessName ? (req.body.signedAt || new Date()) : undefined;
  contract.updatedBy = req.user._id;

  await contract.save();

  const populated = await Contract.findById(contract._id).populate(contractPopulate);

  res.json({ message: 'Contract signed successfully', contract: populated });
};

module.exports = {
  getContracts,
  getContractById,
  createContract,
  updateContract,
  signContract,
};
