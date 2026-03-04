const Contract = require('../models/Contract');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const PaymentScheduleItem = require('../models/PaymentScheduleItem');
const Setting = require('../models/Setting');
const { recalculateContractStatus } = require('../utils/recalculateContractStatus');
const { getNextPaymentDue } = require('../utils/getNextPaymentDue');
const { sendPaymentReceiptEmail, sendPaymentReminderEmail } = require('../utils/email');

const roundMoney = (value) => Math.round(value * 100) / 100;

const paymentPopulate = [
  {
    path: 'contract',
    populate: [
      { path: 'customer', select: 'fullName phonePrimary email whatsappNumber' },
      { path: 'package', select: 'name weeklyAmount weeks' },
    ],
  },
  { path: 'scheduleItem', select: 'weekNumber dueDate amountDue amountPaid status paidAt paymentReference' },
  { path: 'receivedBy', select: 'name role' },
];

const getPaymentFilter = async (req) => {
  if (req.user.role !== 'Customer') return {};

  const customer = await Customer.findOne({ user: req.user._id });
  if (!customer) return { contract: { $in: [] } };

  const contracts = await Contract.find({ customer: customer._id }).select('_id');
  return { contract: { $in: contracts.map((item) => item._id) } };
};

const computeScheduleStatus = (item) => {
  if (item.amountPaid >= item.amountDue) return 'Paid';
  if (item.status === 'Late' || item.status === 'Defaulted') return item.status;
  return 'Pending';
};

const getSettings = async () => {
  let settings = await Setting.findOne();

  if (!settings) {
    settings = await Setting.create({});
  }

  return settings;
};

// GET /api/payments
const getPayments = async (req, res) => {
  const filter = await getPaymentFilter(req);
  if (req.query.includeVoided !== 'true') {
    filter.status = { $ne: 'Voided' };
  }
  if (req.query.contract) {
    if (req.user.role === 'Customer') {
      const allowedContractIds = (filter.contract?.$in || []).map((item) => String(item));
      if (!allowedContractIds.includes(String(req.query.contract))) {
        return res.json([]);
      }
    }
    filter.contract = req.query.contract;
  }

  const payments = await Payment.find(filter)
    .populate(paymentPopulate)
    .sort({ paymentDate: -1, createdAt: -1 });

  res.json(payments);
};

// POST /api/payments
const createPayment = async (req, res) => {
  const scheduleItem = await PaymentScheduleItem.findById(req.body.scheduleItem).populate({
    path: 'contract',
    populate: { path: 'customer', select: 'fullName email' },
  });

  if (!scheduleItem) {
    return res.status(404).json({ message: 'Payment schedule item not found' });
  }

  const amount = roundMoney(Number(req.body.amount));
  const remaining = roundMoney(scheduleItem.amountDue - scheduleItem.amountPaid);

  if (amount <= 0) {
    return res.status(400).json({ message: 'Payment amount must be greater than 0' });
  }

  if (amount > remaining) {
    return res.status(400).json({ message: 'Payment amount cannot exceed the remaining installment balance' });
  }

  const payment = await Payment.create({
    contract: scheduleItem.contract._id,
    scheduleItem: scheduleItem._id,
    amount,
    paymentDate: req.body.paymentDate || new Date(),
    paymentMethod: req.body.paymentMethod || 'EcoCash',
    ecocashReference: req.body.ecocashReference,
    notes: req.body.notes,
    receivedBy: req.user._id,
  });

  scheduleItem.amountPaid = roundMoney(scheduleItem.amountPaid + amount);
  scheduleItem.paidAt = req.body.paymentDate || new Date();
  scheduleItem.paymentReference = payment.receiptNumber;
  scheduleItem.notes = req.body.notes || scheduleItem.notes;
  scheduleItem.status = computeScheduleStatus(scheduleItem);
  scheduleItem.updatedBy = req.user._id;
  await scheduleItem.save();

  const updatedContract = await recalculateContractStatus(scheduleItem.contract._id);
  const nextDue = await getNextPaymentDue(scheduleItem.contract._id);

  try {
    await sendPaymentReceiptEmail({
      customerName: scheduleItem.contract.customer?.fullName || 'Customer',
      email: scheduleItem.contract.customer?.email,
      receiptNumber: payment.receiptNumber,
      amount: payment.amount,
      contractRef: updatedContract.contractRef,
      nextDueDate: nextDue?.dueDate,
      nextDueAmount: nextDue ? Math.max(nextDue.amountDue - nextDue.amountPaid, 0) : undefined,
    });
  } catch (error) {
    console.error('Payment receipt email failed:', error.message);
  }

  const populated = await Payment.findById(payment._id).populate(paymentPopulate);
  res.status(201).json({ message: 'Payment captured successfully', payment: populated });
};

// POST /api/payments/settle/:contractId
const settleContractBalance = async (req, res) => {
  const contract = await Contract.findById(req.params.contractId).populate(
    'customer',
    'fullName email'
  );

  if (!contract) {
    return res.status(404).json({ message: 'Contract not found' });
  }

  const scheduleItems = await PaymentScheduleItem.find({ contract: contract._id }).sort({ weekNumber: 1 });
  if (scheduleItems.length === 0) {
    return res.status(400).json({ message: 'Generate a payment plan before settling the balance' });
  }

  const unsettledItems = scheduleItems.filter(
    (item) => roundMoney(Math.max(item.amountDue - item.amountPaid, 0)) > 0
  );

  if (unsettledItems.length === 0) {
    return res.status(400).json({ message: 'This contract has no remaining balance' });
  }

  const settings = await getSettings();
  const discountPercent = Math.max(
    0,
    Number(req.body.applyDiscount === false ? 0 : settings.earlySettlementDiscountPercent || 0)
  );
  const paymentDate = req.body.paymentDate || new Date();
  const paymentMethod = req.body.paymentMethod || 'EcoCash';
  const ecocashReference = req.body.ecocashReference;
  const settlementNote = req.body.notes || 'Early settlement processed';

  const totalRemaining = roundMoney(
    unsettledItems.reduce((sum, item) => sum + Math.max(item.amountDue - item.amountPaid, 0), 0)
  );
  let remainingDiscount = roundMoney((totalRemaining * discountPercent) / 100);

  for (let index = unsettledItems.length - 1; index >= 0; index -= 1) {
    const item = unsettledItems[index];
    const itemRemaining = roundMoney(Math.max(item.amountDue - item.amountPaid, 0));
    if (remainingDiscount <= 0 || itemRemaining <= 0) continue;

    const appliedDiscount = Math.min(itemRemaining, remainingDiscount);
    item.amountDue = roundMoney(item.amountDue - appliedDiscount);
    remainingDiscount = roundMoney(remainingDiscount - appliedDiscount);
  }

  const createdPaymentIds = [];
  let totalCollected = 0;

  for (const item of unsettledItems) {
    const remainingAfterDiscount = roundMoney(Math.max(item.amountDue - item.amountPaid, 0));

    if (remainingAfterDiscount > 0) {
      const payment = await Payment.create({
        contract: contract._id,
        scheduleItem: item._id,
        amount: remainingAfterDiscount,
        paymentDate,
        paymentMethod,
        ecocashReference,
        notes: `${settlementNote}${discountPercent > 0 ? ` (discount ${discountPercent.toFixed(2)}%)` : ''}`,
        receivedBy: req.user._id,
      });

      createdPaymentIds.push(payment._id);
      totalCollected = roundMoney(totalCollected + payment.amount);
      item.amountPaid = roundMoney(item.amountPaid + payment.amount);
      item.paymentReference = payment.receiptNumber;
      item.paidAt = paymentDate;
    } else {
      item.paidAt = paymentDate;
    }

    item.notes = settlementNote;
    item.status = 'Paid';
    item.updatedBy = req.user._id;
    await item.save();
  }

  const updatedContract = await recalculateContractStatus(contract._id);
  const createdPayments = await Payment.find({ _id: { $in: createdPaymentIds } })
    .populate(paymentPopulate)
    .sort({ paymentDate: 1, createdAt: 1 });

  const discountApplied = roundMoney(totalRemaining - totalCollected);

  try {
    const finalReceipt = createdPayments[createdPayments.length - 1];
    if (finalReceipt) {
      await sendPaymentReceiptEmail({
        customerName: contract.customer?.fullName || 'Customer',
        email: contract.customer?.email,
        receiptNumber: finalReceipt.receiptNumber,
        amount: totalCollected,
        contractRef: updatedContract.contractRef,
      });
    }
  } catch (error) {
    console.error('Settlement receipt email failed:', error.message);
  }

  res.status(201).json({
    message: 'Contract balance settled successfully',
    contract: updatedContract,
    payments: createdPayments,
    settlement: {
      totalRemaining,
      totalCollected,
      discountApplied,
      discountPercent,
      itemsSettled: unsettledItems.length,
    },
  });
};

// GET /api/payments/statement/:contractId
const getPaymentStatement = async (req, res) => {
  const contract = await Contract.findById(req.params.contractId)
    .populate('customer', 'fullName phonePrimary email whatsappNumber')
    .populate('package', 'name weeklyAmount');

  if (!contract) {
    return res.status(404).json({ message: 'Contract not found' });
  }

  if (req.user.role === 'Customer') {
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer || !contract.customer?._id.equals(customer._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
  }

  const schedule = await PaymentScheduleItem.find({ contract: contract._id }).sort({ weekNumber: 1 });
  const payments = await Payment.find({ contract: contract._id, status: { $ne: 'Voided' } })
    .populate('receivedBy', 'name')
    .sort({ paymentDate: 1, createdAt: 1 });
  const nextDue = await getNextPaymentDue(contract._id);

  res.json({
    contract,
    schedule,
    payments,
    nextDue,
    paymentComplete: schedule.length > 0 && schedule.every((item) => item.status === 'Paid'),
  });
};

// POST /api/payments/remind/:contractId
const sendPaymentReminder = async (req, res) => {
  const contract = await Contract.findById(req.params.contractId)
    .populate('customer', 'fullName email');

  if (!contract) {
    return res.status(404).json({ message: 'Contract not found' });
  }

  const nextDue = await getNextPaymentDue(contract._id);
  if (!nextDue) {
    return res.status(400).json({ message: 'This contract has no pending installments' });
  }

  try {
    await sendPaymentReminderEmail({
      customerName: contract.customer?.fullName || 'Customer',
      email: contract.customer?.email,
      contractRef: contract.contractRef,
      dueDate: nextDue.dueDate,
      amount: Math.max(nextDue.amountDue - nextDue.amountPaid, 0),
    });
  } catch (error) {
    console.error('Payment reminder email failed:', error.message);
    return res.status(500).json({ message: 'Failed to send payment reminder' });
  }

  res.json({
    message: 'Payment reminder sent successfully',
    nextDue,
  });
};

module.exports = {
  getPayments,
  createPayment,
  settleContractBalance,
  getPaymentStatement,
  sendPaymentReminder,
};
