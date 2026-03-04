const PaymentScheduleItem = require('../models/PaymentScheduleItem');

const getNextPaymentDue = async (contractId) => {
  const nextDue = await PaymentScheduleItem.findOne({
    contract: contractId,
    status: { $ne: 'Paid' },
  }).sort({ dueDate: 1, weekNumber: 1 });

  return nextDue;
};

module.exports = { getNextPaymentDue };
