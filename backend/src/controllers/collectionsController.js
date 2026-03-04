const Contract = require('../models/Contract');
const Payment = require('../models/Payment');
const PaymentScheduleItem = require('../models/PaymentScheduleItem');
const {
  MS_PER_DAY,
  startOfDay,
  endOfDay,
  getCollectionsSettings,
  getOverdueDays,
  getExpectedScheduleStatus,
  processCollectionStatuses,
} = require('../utils/collectionsAutomation');
const { recalculateContractStatus } = require('../utils/recalculateContractStatus');

const roundMoney = (value) => Math.round(value * 100) / 100;

const buildRiskItem = (item, gracePeriodDays, today) => {
  const remaining = roundMoney(Math.max(item.amountDue - item.amountPaid, 0));
  const overdueDays = item.dueDate < startOfDay(today) ? getOverdueDays(item.dueDate, today) : 0;
  const daysUntilDue = item.dueDate >= startOfDay(today)
    ? Math.ceil((startOfDay(item.dueDate) - startOfDay(today)) / MS_PER_DAY)
    : 0;

  return {
    _id: item._id,
    weekNumber: item.weekNumber,
    dueDate: item.dueDate,
    amountDue: item.amountDue,
    amountPaid: item.amountPaid,
    remaining,
    status: item.status,
    overdueDays,
    daysUntilDue,
    contract: item.contract,
    graceExceeded: overdueDays > gracePeriodDays,
  };
};

// GET /api/collections/overview
const getCollectionsOverview = async (req, res) => {
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const settings = await getCollectionsSettings();

  const [activeContracts, dueTodayItems, overdueItems, pendingItems, paymentsThisMonth, recentPayments] = await Promise.all([
    Contract.countDocuments({ status: 'Active' }),
    PaymentScheduleItem.find({
      dueDate: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ['Pending', 'Late', 'Defaulted'] },
    }).populate({
      path: 'contract',
      populate: { path: 'customer', select: 'fullName phonePrimary email' },
    }),
    PaymentScheduleItem.find({
      dueDate: { $lt: todayStart },
      status: { $in: ['Pending', 'Late', 'Defaulted'] },
    }).populate({
      path: 'contract',
      populate: { path: 'customer', select: 'fullName phonePrimary email' },
    }),
    PaymentScheduleItem.find({
      status: { $in: ['Pending', 'Late'] },
    }).populate({
      path: 'contract',
      populate: { path: 'customer', select: 'fullName phonePrimary email' },
    }),
    Payment.aggregate([
      {
        $match: {
          status: { $ne: 'Voided' },
          paymentDate: { $gte: monthStart },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
    Payment.find({ status: { $ne: 'Voided' } })
      .populate({
        path: 'contract',
        populate: { path: 'customer', select: 'fullName' },
      })
      .sort({ paymentDate: -1, createdAt: -1 })
      .limit(8),
  ]);

  const dueToday = dueTodayItems.reduce((sum, item) => sum + Math.max(item.amountDue - item.amountPaid, 0), 0);
  const overdueAmount = overdueItems.reduce((sum, item) => sum + Math.max(item.amountDue - item.amountPaid, 0), 0);
  const defaultRiskItems = overdueItems.filter((item) => getOverdueDays(item.dueDate, today) > settings.gracePeriodDays);
  const upcomingItems = pendingItems
    .filter((item) => item.dueDate >= todayStart && item.dueDate <= endOfDay(new Date(today.getTime() + (3 * MS_PER_DAY))))
    .sort((a, b) => a.dueDate - b.dueDate)
    .slice(0, 10);

  const collectionsQueue = [...overdueItems, ...upcomingItems]
    .filter((item, index, list) => list.findIndex((candidate) => String(candidate._id) === String(item._id)) === index)
    .sort((a, b) => a.dueDate - b.dueDate)
    .slice(0, 12)
    .map((item) => ({
      ...buildRiskItem(item, settings.gracePeriodDays, today),
      projectedLateFee: getOverdueDays(item.dueDate, today) > 0 ? settings.lateFeeAmount : 0,
    }));

  const monthSummary = paymentsThisMonth[0] || { totalAmount: 0, count: 0 };

  res.json({
    metrics: {
      activeContracts,
      paymentsThisMonth: roundMoney(monthSummary.totalAmount || 0),
      paymentsThisMonthCount: monthSummary.count || 0,
      dueTodayCount: dueTodayItems.length,
      dueTodayAmount: roundMoney(dueToday),
      overdueCount: overdueItems.length,
      overdueAmount: roundMoney(overdueAmount),
      defaultRiskCount: defaultRiskItems.length,
      projectedLateFees: roundMoney(defaultRiskItems.length * settings.lateFeeAmount),
    },
    settings: {
      lateFeeAmount: settings.lateFeeAmount,
      gracePeriodDays: settings.gracePeriodDays,
    },
    collectionsQueue,
    recentPayments,
  });
};

// POST /api/collections/process-overdue
const processOverdueCollections = async (req, res) => {
  const result = await processCollectionStatuses(req.user._id);

  res.json({
    message: 'Collections status processed successfully',
    ...result,
  });
};

// GET /api/collections/receipt/:receiptNumber
const getReceiptByNumber = async (req, res) => {
  const payment = await Payment.findOne({ receiptNumber: req.params.receiptNumber })
    .populate({
      path: 'contract',
      populate: [
        { path: 'customer', select: 'fullName phonePrimary email' },
        { path: 'package', select: 'name' },
      ],
    })
    .populate('scheduleItem', 'weekNumber dueDate amountDue amountPaid status')
    .populate('receivedBy', 'name role')
    .populate('voidedBy', 'name role');

  if (!payment) {
    return res.status(404).json({ message: 'Receipt not found' });
  }

  res.json(payment);
};

// POST /api/collections/payments/:id/void
const voidPayment = async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    return res.status(404).json({ message: 'Payment not found' });
  }

  if (payment.status === 'Voided') {
    return res.status(400).json({ message: 'This payment has already been voided' });
  }

  const settings = await getCollectionsSettings();
  const scheduleItem = await PaymentScheduleItem.findById(payment.scheduleItem);

  if (!scheduleItem) {
    return res.status(404).json({ message: 'Linked installment not found' });
  }

  payment.status = 'Voided';
  payment.voidReason = req.body.reason || 'Voided by admin';
  payment.voidedAt = new Date();
  payment.voidedBy = req.user._id;
  await payment.save();

  scheduleItem.amountPaid = roundMoney(Math.max(scheduleItem.amountPaid - payment.amount, 0));
  scheduleItem.updatedBy = req.user._id;

  const remainingPayments = await Payment.find({
    scheduleItem: scheduleItem._id,
    status: { $ne: 'Voided' },
  }).sort({ paymentDate: 1, createdAt: 1 });

  const latestPayment = remainingPayments[remainingPayments.length - 1];
  scheduleItem.paidAt = latestPayment ? latestPayment.paymentDate : undefined;
  scheduleItem.paymentReference = latestPayment ? latestPayment.receiptNumber : undefined;
  scheduleItem.status = getExpectedScheduleStatus(scheduleItem, settings.gracePeriodDays, new Date());
  await scheduleItem.save();

  await recalculateContractStatus(scheduleItem.contract);

  const updatedPayment = await Payment.findById(payment._id)
    .populate({
      path: 'contract',
      populate: { path: 'customer', select: 'fullName' },
    })
    .populate('scheduleItem', 'weekNumber')
    .populate('voidedBy', 'name role');

  res.json({
    message: 'Payment voided successfully',
    payment: updatedPayment,
  });
};

module.exports = {
  getCollectionsOverview,
  processOverdueCollections,
  getReceiptByNumber,
  voidPayment,
};
