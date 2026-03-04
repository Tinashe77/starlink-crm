const Contract = require('../models/Contract');
const PaymentScheduleItem = require('../models/PaymentScheduleItem');

const roundMoney = (value) => Math.round(value * 100) / 100;

const recalculateContractStatus = async (contractId) => {
  const contract = await Contract.findById(contractId);
  if (!contract) return null;

  const scheduleItems = await PaymentScheduleItem.find({ contract: contractId }).sort({ weekNumber: 1 });

  const outstandingBalance = roundMoney(
    scheduleItems.reduce((sum, item) => sum + Math.max(item.amountDue - item.amountPaid, 0), 0)
  );

  let nextStatus = contract.status;

  if (scheduleItems.length === 0) {
    nextStatus = contract.depositPaid ? 'Active' : 'Pending Deposit';
  } else if (scheduleItems.every((item) => item.status === 'Paid')) {
    nextStatus = 'Completed';
  } else if (scheduleItems.some((item) => item.status === 'Defaulted')) {
    nextStatus = 'Default';
  } else if (scheduleItems.some((item) => item.status === 'Late')) {
    nextStatus = 'In Arrears';
  } else if (contract.depositPaid) {
    nextStatus = 'Active';
  } else {
    nextStatus = 'Pending Deposit';
  }

  contract.outstandingBalance = outstandingBalance;
  contract.paymentPlanReady = scheduleItems.length > 0;
  contract.status = nextStatus;

  if (nextStatus === 'Active' && !contract.activatedAt) {
    contract.activatedAt = new Date();
  }

  if (nextStatus === 'Completed') {
    contract.completedAt = contract.completedAt || new Date();
  } else {
    contract.completedAt = undefined;
  }

  await contract.save();
  return contract;
};

module.exports = { recalculateContractStatus };
