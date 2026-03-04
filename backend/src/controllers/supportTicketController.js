const SupportTicket = require('../models/SupportTicket');
const Contract = require('../models/Contract');
const Customer = require('../models/Customer');
const InstallationJob = require('../models/InstallationJob');
const User = require('../models/User');
const { sendSupportTicketUpdateEmail } = require('../utils/email');

const ticketPopulate = [
  { path: 'customer', select: 'fullName phonePrimary email' },
  {
    path: 'contract',
    populate: [
      { path: 'customer', select: 'fullName phonePrimary email' },
      { path: 'package', select: 'name type' },
    ],
  },
  { path: 'installation', select: 'jobNumber status scheduledFor completedAt' },
  { path: 'assignedTechnician', select: 'name email phone role status' },
  { path: 'createdBy', select: 'name role' },
  { path: 'updatedBy', select: 'name role' },
  { path: 'messages.author', select: 'name role email' },
];

const technicianStatuses = ['Assigned', 'In Progress', 'Resolved'];

const getRoleFilter = async (req) => {
  if (req.user.role === 'Customer') {
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer) return { customer: { $in: [] } };
    return { customer: customer._id };
  }

  if (req.user.role === 'Technician') {
    return { assignedTechnician: req.user._id };
  }

  return {};
};

const canAccessTicket = async (req, ticket) => {
  if (req.user.role === 'Customer') {
    const customer = await Customer.findOne({ user: req.user._id });
    return Boolean(customer && ticket.customer?._id?.equals(customer._id));
  }

  if (req.user.role === 'Technician') {
    return Boolean(ticket.assignedTechnician?._id?.equals(req.user._id));
  }

  return true;
};

const addTicketMessage = (ticket, req, message) => {
  if (!message || !String(message).trim()) return;

  ticket.messages.push({
    author: req.user._id,
    authorName: req.user.name,
    authorRole: req.user.role,
    message: String(message).trim(),
  });
};

const notifyCustomerOfUpdate = async (ticket, req, explicitMessage = '') => {
  if (req.user.role === 'Customer') return;
  if (!ticket.customer?.email) return;

  const latestThreadMessage = explicitMessage || ticket.messages[ticket.messages.length - 1]?.message || ticket.resolutionNotes;

  try {
    await sendSupportTicketUpdateEmail({
      customerName: ticket.customer.fullName || 'Customer',
      email: ticket.customer.email,
      ticketNumber: ticket.ticketNumber,
      subjectLine: ticket.subject,
      status: ticket.status,
      updatedBy: req.user.name || req.user.role,
      latestMessage: latestThreadMessage,
    });
  } catch (error) {
    console.error(`Failed to send support ticket update email for ${ticket.ticketNumber}:`, error.message);
  }
};

const getSupportTickets = async (req, res) => {
  const filter = await getRoleFilter(req);
  const tickets = await SupportTicket.find(filter)
    .populate(ticketPopulate)
    .sort({ updatedAt: -1, createdAt: -1 });

  res.json(tickets);
};

const getSupportTicketOptions = async (req, res) => {
  let contractFilter = {};

  if (req.user.role === 'Customer') {
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer) {
      return res.json({ contracts: [], technicians: [] });
    }
    contractFilter.customer = customer._id;
  }

  const contractsWithInstallations = await InstallationJob.find().distinct('contract');
  const contracts = await Contract.find({
    ...contractFilter,
    _id: { $in: contractsWithInstallations },
  })
    .populate('customer', 'fullName phonePrimary email')
    .populate('package', 'name type')
    .sort({ createdAt: -1 });

  const technicians = ['Admin', 'Agent'].includes(req.user.role)
    ? await User.find({ role: 'Technician', status: 'Active' }).select('name email phone role status')
    : [];

  res.json({ contracts, technicians });
};

const createSupportTicket = async (req, res) => {
  const contract = await Contract.findById(req.body.contract)
    .populate('customer', 'user fullName phonePrimary email')
    .populate('package', 'name type');

  if (!contract) {
    return res.status(404).json({ message: 'Contract not found' });
  }

  if (req.user.role === 'Customer') {
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer || !contract.customer?._id.equals(customer._id)) {
      return res.status(403).json({ message: 'Not authorized to create a ticket for this contract' });
    }
  }

  const installation = await InstallationJob.findOne({ contract: contract._id });
  if (!installation) {
    return res.status(400).json({ message: 'A support ticket can only be created after an installation job exists' });
  }

  let assignedTechnician = undefined;
  if (req.body.assignedTechnician) {
    if (!['Admin', 'Agent'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only Admin and Agent can assign a technician when creating a ticket' });
    }

    assignedTechnician = await User.findOne({
      _id: req.body.assignedTechnician,
      role: 'Technician',
      status: 'Active',
    });

    if (!assignedTechnician) {
      return res.status(400).json({ message: 'Assigned technician is invalid or inactive' });
    }
  }

  const ticket = await SupportTicket.create({
    customer: contract.customer._id,
    contract: contract._id,
    installation: installation._id,
    category: req.body.category,
    subject: req.body.subject,
    description: req.body.description,
    priority: req.body.priority || 'Normal',
    status: assignedTechnician ? 'Assigned' : 'Open',
    assignedTechnician: assignedTechnician?._id,
    assignedAt: assignedTechnician ? new Date() : undefined,
    messages: [
      {
        author: req.user._id,
        authorName: req.user.name,
        authorRole: req.user.role,
        message: req.body.description,
      },
    ],
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  const populated = await SupportTicket.findById(ticket._id).populate(ticketPopulate);
  res.status(201).json({ message: 'Support ticket submitted successfully', ticket: populated });
};

const updateSupportTicket = async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id).populate(ticketPopulate);

  if (!ticket) {
    return res.status(404).json({ message: 'Support ticket not found' });
  }

  if (!(await canAccessTicket(req, ticket))) {
    return res.status(403).json({ message: 'Not authorized to update this support ticket' });
  }

  const isManager = ['Admin', 'Agent'].includes(req.user.role);
  const isTechnician = req.user.role === 'Technician';
  const isCustomer = req.user.role === 'Customer';
  let updateSummary = '';

  if (isCustomer && ticket.status === 'Closed') {
    return res.status(400).json({ message: 'Closed tickets cannot be updated by the customer' });
  }

  if (isCustomer && req.body.message === undefined) {
    return res.status(400).json({ message: 'Please add a response message to update this ticket' });
  }

  if (req.body.assignedTechnician !== undefined) {
    if (!isManager) {
      return res.status(403).json({ message: 'Only Admin and Agent can reassign tickets' });
    }

    if (!req.body.assignedTechnician) {
      ticket.assignedTechnician = undefined;
      ticket.assignedAt = undefined;
      if (ticket.status !== 'Closed' && ticket.status !== 'Resolved') {
        ticket.status = 'Open';
      }
      updateSummary = 'The assigned technician was cleared.';
    } else {
      const technician = await User.findOne({
        _id: req.body.assignedTechnician,
        role: 'Technician',
        status: 'Active',
      });

      if (!technician) {
        return res.status(400).json({ message: 'Assigned technician is invalid or inactive' });
      }

      ticket.assignedTechnician = technician._id;
      ticket.assignedAt = ticket.assignedAt || new Date();
      if (ticket.status === 'Open') {
        ticket.status = 'Assigned';
      }
      updateSummary = `The ticket was assigned to ${technician.name}.`;
    }
  }

  if (req.body.priority !== undefined) {
    if (!isManager) {
      return res.status(403).json({ message: 'Only Admin and Agent can change ticket priority' });
    }
    ticket.priority = req.body.priority;
    updateSummary = `Priority was updated to ${req.body.priority}.`;
  }

  if (req.body.status) {
    if (isCustomer) {
      return res.status(403).json({ message: 'Customers cannot change ticket status' });
    }

    if (isTechnician && !technicianStatuses.includes(req.body.status)) {
      return res.status(400).json({ message: `Technicians cannot move a ticket to ${req.body.status}` });
    }

    if (isTechnician && !ticket.assignedTechnician?._id?.equals(req.user._id)) {
      return res.status(403).json({ message: 'Technicians can only update tickets assigned to them' });
    }

    ticket.status = req.body.status;
    updateSummary = `Status changed to ${req.body.status}.`;
  }

  if (req.body.resolutionNotes !== undefined) {
    if (!isManager && !isTechnician) {
      return res.status(403).json({ message: 'Only staff can update resolution notes' });
    }
    ticket.resolutionNotes = req.body.resolutionNotes;
    if (req.body.resolutionNotes) {
      updateSummary = req.body.resolutionNotes;
    }
  }

  if (req.body.message !== undefined) {
    if (!String(req.body.message).trim()) {
      return res.status(400).json({ message: 'Ticket response cannot be empty' });
    }

    addTicketMessage(ticket, req, req.body.message);
    updateSummary = String(req.body.message).trim();
  }

  if (ticket.status === 'Resolved') {
    ticket.resolvedAt = ticket.resolvedAt || new Date();
    ticket.closedAt = undefined;
  } else if (ticket.status === 'Closed') {
    ticket.resolvedAt = ticket.resolvedAt || new Date();
    ticket.closedAt = ticket.closedAt || new Date();
  } else {
    if (req.body.status && req.body.status !== 'Resolved') {
      ticket.closedAt = undefined;
    }
  }

  ticket.updatedBy = req.user._id;
  await ticket.save();

  const populated = await SupportTicket.findById(ticket._id).populate(ticketPopulate);
  await notifyCustomerOfUpdate(populated, req, updateSummary);
  res.json({ message: 'Support ticket updated successfully', ticket: populated });
};

module.exports = {
  getSupportTickets,
  getSupportTicketOptions,
  createSupportTicket,
  updateSupportTicket,
};
