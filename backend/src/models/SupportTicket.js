const mongoose = require('mongoose');

const SupportTicketMessageSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String, trim: true },
    authorRole: { type: String, trim: true },
    message: { type: String, required: true, trim: true },
  },
  { _id: true, timestamps: true }
);

const SupportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, unique: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    contract: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
    installation: { type: mongoose.Schema.Types.ObjectId, ref: 'InstallationJob', required: true },
    category: {
      type: String,
      enum: ['Query', 'Complaint', 'Technical Support', 'Billing'],
      default: 'Query',
    },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    priority: {
      type: String,
      enum: ['Normal', 'Urgent'],
      default: 'Normal',
    },
    status: {
      type: String,
      enum: ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open',
    },
    assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedAt: { type: Date },
    resolutionNotes: { type: String, trim: true },
    messages: { type: [SupportTicketMessageSchema], default: [] },
    resolvedAt: { type: Date },
    closedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

SupportTicketSchema.pre('save', async function () {
  if (this.ticketNumber) return;
  const count = await mongoose.model('SupportTicket').countDocuments();
  this.ticketNumber = `UT-TKT-${String(count + 1).padStart(4, '0')}`;
});

module.exports = mongoose.model('SupportTicket', SupportTicketSchema);
