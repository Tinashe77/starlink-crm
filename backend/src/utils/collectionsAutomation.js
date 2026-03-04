const PaymentScheduleItem = require('../models/PaymentScheduleItem');
const Setting = require('../models/Setting');
const mongoose = require('mongoose');
const { recalculateContractStatus } = require('./recalculateContractStatus');
const { sendPaymentReminderEmail } = require('./email');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const getCollectionsSettings = async () => {
  let settings = await Setting.findOne();

  if (!settings) {
    settings = await Setting.create({});
  }

  return settings;
};

const getOverdueDays = (dueDate, today) =>
  Math.max(0, Math.floor((startOfDay(today) - startOfDay(dueDate)) / MS_PER_DAY));

const getExpectedScheduleStatus = (item, gracePeriodDays, today) => {
  if (item.amountPaid >= item.amountDue) return 'Paid';

  const due = startOfDay(item.dueDate);
  const current = startOfDay(today);

  if (due >= current) return 'Pending';

  const overdueDays = getOverdueDays(item.dueDate, today);
  return overdueDays > gracePeriodDays ? 'Defaulted' : 'Late';
};

const processCollectionStatuses = async (actorUserId) => {
  const today = new Date();
  const settings = await getCollectionsSettings();
  const items = await PaymentScheduleItem.find({
    status: { $in: ['Pending', 'Late', 'Defaulted'] },
  });

  const changedContractIds = new Set();
  let updatedCount = 0;
  let lateCount = 0;
  let defaultedCount = 0;
  let restoredPendingCount = 0;
  let completedCount = 0;

  for (const item of items) {
    const nextStatus = getExpectedScheduleStatus(item, settings.gracePeriodDays, today);

    if (item.status !== nextStatus) {
      item.status = nextStatus;
      if (actorUserId) {
        item.updatedBy = actorUserId;
      }
      await item.save();
      updatedCount += 1;
      changedContractIds.add(String(item.contract));

      if (nextStatus === 'Late') lateCount += 1;
      if (nextStatus === 'Defaulted') defaultedCount += 1;
      if (nextStatus === 'Pending') restoredPendingCount += 1;
      if (nextStatus === 'Paid') completedCount += 1;
    }
  }

  await Promise.all([...changedContractIds].map((contractId) => recalculateContractStatus(contractId)));

  return {
    updatedCount,
    lateCount,
    defaultedCount,
    restoredPendingCount,
    completedCount,
  };
};

const getReminderType = (dueDate, now) => {
  const due = startOfDay(dueDate);
  const today = startOfDay(now);

  if (due < today) return 'Overdue';
  if (due.getTime() === today.getTime()) return 'Due Today';
  return 'Due Soon';
};

const hasReminderAlreadySentToday = (item, reminderType, now) => {
  if (!item.lastReminderAt || item.lastReminderType !== reminderType) return false;
  return startOfDay(item.lastReminderAt).getTime() === startOfDay(now).getTime();
};

const sendAutomatedPaymentReminders = async () => {
  const now = new Date();
  const tomorrowEnd = endOfDay(new Date(now.getTime() + MS_PER_DAY));
  const items = await PaymentScheduleItem.find({
    dueDate: { $lte: tomorrowEnd },
    status: { $in: ['Pending', 'Late', 'Defaulted'] },
  }).populate({
    path: 'contract',
    populate: { path: 'customer', select: 'fullName email' },
  });

  let remindersSent = 0;
  let reminderFailures = 0;

  for (const item of items) {
    if (item.amountPaid >= item.amountDue) continue;

    const reminderType = getReminderType(item.dueDate, now);
    if (hasReminderAlreadySentToday(item, reminderType, now)) continue;

    const customer = item.contract?.customer;
    if (!customer?.email) continue;

    try {
      await sendPaymentReminderEmail({
        customerName: customer.fullName || 'Customer',
        email: customer.email,
        contractRef: item.contract.contractRef,
        dueDate: item.dueDate,
        amount: Math.max(item.amountDue - item.amountPaid, 0),
        reminderType,
      });

      item.lastReminderAt = now;
      item.lastReminderType = reminderType;
      await item.save();
      remindersSent += 1;
    } catch (error) {
      reminderFailures += 1;
      console.error(
        `[collections] reminder failed for ${item.contract?.contractRef || 'unknown contract'}: ${error.message}`
      );
    }
  }

  return { remindersSent, reminderFailures };
};

let lastRunKey = null;

const startCollectionsAutomation = () => {
  if (process.env.COLLECTIONS_AUTOMATION_ENABLED === 'false') {
    return;
  }

  const intervalMs = Number(process.env.COLLECTIONS_AUTOMATION_INTERVAL_MS || 60 * 60 * 1000);

  const runIfDue = async () => {
    if (mongoose.connection.readyState !== 1) {
      console.warn('[collections] skipped automated run because MongoDB is not connected');
      return;
    }

    const runKey = new Date().toISOString().slice(0, 10);
    if (lastRunKey === runKey) return;

    try {
      const statusResult = await processCollectionStatuses();
      const reminderResult = await sendAutomatedPaymentReminders();
      lastRunKey = runKey;

      console.log(
        `[collections] automated run complete: ${statusResult.updatedCount} status updates, ${reminderResult.remindersSent} reminders, ${reminderResult.reminderFailures} failures`
      );
    } catch (error) {
      console.error('[collections] automated run failed:', error.message);
    }
  };

  runIfDue();

  const timer = setInterval(runIfDue, intervalMs);
  if (typeof timer.unref === 'function') {
    timer.unref();
  }
};

module.exports = {
  MS_PER_DAY,
  startOfDay,
  endOfDay,
  getCollectionsSettings,
  getOverdueDays,
  getExpectedScheduleStatus,
  processCollectionStatuses,
  sendAutomatedPaymentReminders,
  startCollectionsAutomation,
};
