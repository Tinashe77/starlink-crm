const mongoose = require('mongoose');

const PaymentScheduleItemSchema = new mongoose.Schema(
  {
    contract: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
    weekNumber: { type: Number, required: true, min: 1 },
    dueDate: { type: Date, required: true },
    amountDue: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Late', 'Defaulted'],
      default: 'Pending',
    },
    paidAt: { type: Date },
    paymentReference: { type: String, trim: true },
    notes: { type: String, trim: true },
    lastReminderAt: { type: Date },
    lastReminderType: {
      type: String,
      enum: ['Due Soon', 'Due Today', 'Overdue'],
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

PaymentScheduleItemSchema.index({ contract: 1, weekNumber: 1 }, { unique: true });

module.exports = mongoose.model('PaymentScheduleItem', PaymentScheduleItemSchema);
