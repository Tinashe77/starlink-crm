const Contract = require('../models/Contract');
const Customer = require('../models/Customer');
const PaymentScheduleItem = require('../models/PaymentScheduleItem');
const { recalculateContractStatus } = require('../utils/recalculateContractStatus');

const roundMoney = (value) => Math.round(value * 100) / 100;

const schedulePopulate = [
  {
    path: 'contract',
    populate: [
      { path: 'customer', select: 'fullName phonePrimary email' },
      { path: 'package', select: 'name weeklyAmount weeks' },
    ],
  },
  { path: 'updatedBy', select: 'name role' },
];

const getScheduleFilter = async (req) => {
  if (req.user.role !== 'Customer') return {};

  const customer = await Customer.findOne({ user: req.user._id });
  if (!customer) return { contract: { $in: [] } };

  const contracts = await Contract.find({ customer: customer._id }).select('_id');
  return { contract: { $in: contracts.map((item) => item._id) } };
};

// GET /api/payment-plans
const getPaymentSchedule = async (req, res) => {
  const roleFilter = await getScheduleFilter(req);
  const filter = { ...roleFilter };

  if (req.query.contract) {
    if (req.user.role === 'Customer') {
      const allowedContractIds = (roleFilter.contract?.$in || []).map((item) => String(item));
      if (!allowedContractIds.includes(String(req.query.contract))) {
        return res.json([]);
      }
    }
    filter.contract = req.query.contract;
  }

  const items = await PaymentScheduleItem.find(filter)
    .populate(schedulePopulate)
    .sort({ dueDate: 1, weekNumber: 1 });

  res.json(items);
};

// POST /api/payment-plans/generate
const generatePaymentSchedule = async (req, res) => {
  const contract = await Contract.findById(req.body.contract);
  if (!contract) {
    return res.status(404).json({ message: 'Contract not found' });
  }

  if (!contract.depositPaid) {
    return res.status(400).json({ message: 'Deposit must be marked as paid before generating a payment plan' });
  }

  const existingItems = await PaymentScheduleItem.countDocuments({ contract: contract._id });
  if (existingItems > 0) {
    return res.status(400).json({ message: 'A payment plan already exists for this contract' });
  }

  const startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
  const items = [];

  for (let week = 1; week <= contract.durationWeeks; week += 1) {
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + (week - 1) * 7);

    items.push({
      contract: contract._id,
      weekNumber: week,
      dueDate,
      amountDue: roundMoney(contract.weeklyInstallment),
      amountPaid: 0,
      status: 'Pending',
      updatedBy: req.user._id,
    });
  }

  await PaymentScheduleItem.insertMany(items);
  await recalculateContractStatus(contract._id);

  const schedule = await PaymentScheduleItem.find({ contract: contract._id })
    .populate(schedulePopulate)
    .sort({ weekNumber: 1 });

  res.status(201).json({ message: 'Payment plan generated successfully', schedule });
};

// PUT /api/payment-plans/:id
const updatePaymentScheduleItem = async (req, res) => {
  const item = await PaymentScheduleItem.findById(req.params.id);
  if (!item) {
    return res.status(404).json({ message: 'Payment schedule item not found' });
  }

  if (req.body.dueDate) item.dueDate = req.body.dueDate;
  if (req.body.amountDue !== undefined) item.amountDue = roundMoney(Number(req.body.amountDue));

  if (req.body.amountPaid !== undefined) {
    item.amountPaid = roundMoney(Math.min(Number(req.body.amountPaid), item.amountDue));
    item.paidAt = item.amountPaid > 0 ? (req.body.paidAt || new Date()) : undefined;
  }

  if (req.body.paymentReference !== undefined) item.paymentReference = req.body.paymentReference;
  if (req.body.notes !== undefined) item.notes = req.body.notes;

  if (req.body.status) {
    item.status = req.body.status;
  } else if (item.amountPaid >= item.amountDue) {
    item.status = 'Paid';
  } else if (item.amountPaid > 0) {
    item.status = 'Pending';
  }

  item.updatedBy = req.user._id;
  await item.save();

  await recalculateContractStatus(item.contract);

  const populated = await PaymentScheduleItem.findById(item._id).populate(schedulePopulate);
  res.json({ message: 'Payment schedule item updated successfully', item: populated });
};

module.exports = {
  getPaymentSchedule,
  generatePaymentSchedule,
  updatePaymentScheduleItem,
};
