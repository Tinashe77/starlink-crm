const Contract = require('../models/Contract');
const Customer = require('../models/Customer');
const InstallationJob = require('../models/InstallationJob');
const User = require('../models/User');

const installationPopulate = [
  {
    path: 'contract',
    populate: [
      { path: 'customer', select: 'fullName phonePrimary email customerType' },
      { path: 'package', select: 'name type' },
    ],
  },
  { path: 'assignedTechnician', select: 'name email phone role status' },
  { path: 'createdBy', select: 'name role' },
  { path: 'updatedBy', select: 'name role' },
];

const statusTransitions = {
  Pending: ['Pending', 'Scheduled', 'In Progress', 'Failed'],
  Scheduled: ['Scheduled', 'In Progress', 'Revisit Required', 'Failed', 'Installed'],
  'In Progress': ['In Progress', 'Installed', 'Revisit Required', 'Failed'],
  'Revisit Required': ['Revisit Required', 'Scheduled', 'In Progress', 'Installed', 'Failed'],
  Failed: ['Failed', 'Scheduled', 'In Progress'],
  Installed: ['Installed'],
};

const canManageInstallations = (role) => ['Admin', 'Agent'].includes(role);
const canWorkInstallations = (role) => ['Admin', 'Agent', 'Technician'].includes(role);

const getRoleFilter = async (req) => {
  if (req.user.role === 'Customer') {
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer) return { contract: { $in: [] } };

    const contracts = await Contract.find({ customer: customer._id }).select('_id');
    return { contract: { $in: contracts.map((item) => item._id) } };
  }

  if (req.user.role === 'Technician') {
    return { assignedTechnician: req.user._id };
  }

  return {};
};

const canAccessInstallation = async (req, installation) => {
  if (req.user.role === 'Customer') {
    const customer = await Customer.findOne({ user: req.user._id });
    return Boolean(customer && installation.contract?.customer?._id?.equals(customer._id));
  }

  if (req.user.role === 'Technician') {
    return Boolean(installation.assignedTechnician?._id?.equals(req.user._id));
  }

  return true;
};

const getInstallations = async (req, res) => {
  const filter = await getRoleFilter(req);
  const jobs = await InstallationJob.find(filter)
    .populate(installationPopulate)
    .sort({ scheduledFor: 1, createdAt: -1 });

  res.json(jobs);
};

const getInstallationById = async (req, res) => {
  const job = await InstallationJob.findById(req.params.id).populate(installationPopulate);

  if (!job) {
    return res.status(404).json({ message: 'Installation job not found' });
  }

  if (!(await canAccessInstallation(req, job))) {
    return res.status(403).json({ message: 'Not authorized to view this installation job' });
  }

  res.json(job);
};

const getInstallationOptions = async (req, res) => {
  const technicians = await User.find({
    role: 'Technician',
    status: 'Active',
  }).select('name email phone role');

  const usedContractIds = await InstallationJob.find().distinct('contract');
  const contracts = await Contract.find({
    _id: { $nin: usedContractIds },
    depositPaid: true,
    status: { $ne: 'Default' },
  })
    .populate('customer', 'fullName phonePrimary email customerType')
    .populate('package', 'name type')
    .sort({ createdAt: -1 });

  res.json({
    technicians,
    contracts,
  });
};

const createInstallation = async (req, res) => {
  const contract = await Contract.findById(req.body.contract)
    .populate('customer', 'fullName phonePrimary email customerType')
    .populate('package', 'name type');

  if (!contract) {
    return res.status(404).json({ message: 'Contract not found' });
  }

  if (!contract.depositPaid) {
    return res.status(400).json({ message: 'Deposit must be paid before creating an installation job' });
  }

  const existing = await InstallationJob.findOne({ contract: contract._id });
  if (existing) {
    return res.status(400).json({ message: 'An installation job already exists for this contract' });
  }

  let assignedTechnician = undefined;
  if (req.body.assignedTechnician) {
    assignedTechnician = await User.findOne({
      _id: req.body.assignedTechnician,
      role: 'Technician',
      status: 'Active',
    });

    if (!assignedTechnician) {
      return res.status(400).json({ message: 'Assigned technician is invalid or inactive' });
    }
  }

  const initialStatus = req.body.status || (req.body.scheduledFor ? 'Scheduled' : 'Pending');

  const job = await InstallationJob.create({
    contract: contract._id,
    assignedTechnician: assignedTechnician?._id,
    status: initialStatus,
    scheduledFor: req.body.scheduledFor || undefined,
    installationNotes: req.body.installationNotes,
    closureNotes: req.body.closureNotes,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  const populated = await InstallationJob.findById(job._id).populate(installationPopulate);
  res.status(201).json({ message: 'Installation job created successfully', job: populated });
};

const updateInstallation = async (req, res) => {
  const job = await InstallationJob.findById(req.params.id).populate(installationPopulate);

  if (!job) {
    return res.status(404).json({ message: 'Installation job not found' });
  }

  if (req.user.role === 'Technician' && !job.assignedTechnician?._id?.equals(req.user._id)) {
    return res.status(403).json({ message: 'Technicians can only update jobs assigned to them' });
  }

  const previousStatus = job.status;

  if (req.body.assignedTechnician !== undefined && canManageInstallations(req.user.role)) {
    if (!req.body.assignedTechnician) {
      job.assignedTechnician = undefined;
    } else {
      const technician = await User.findOne({
        _id: req.body.assignedTechnician,
        role: 'Technician',
        status: 'Active',
      });

      if (!technician) {
        return res.status(400).json({ message: 'Assigned technician is invalid or inactive' });
      }

      job.assignedTechnician = technician._id;
    }
  }

  if (req.body.status) {
    const allowedNextStatuses = statusTransitions[job.status] || [job.status];
    if (!allowedNextStatuses.includes(req.body.status) && !canManageInstallations(req.user.role)) {
      return res.status(400).json({ message: `Technicians cannot move this job from ${job.status} to ${req.body.status}` });
    }

    job.status = req.body.status;
  }

  if (req.body.scheduledFor !== undefined && canManageInstallations(req.user.role)) {
    job.scheduledFor = req.body.scheduledFor || undefined;
    if (req.body.scheduledFor && job.status === 'Pending') {
      job.status = 'Scheduled';
    }
  }

  const editableFields = [
    'revisitReason',
    'failureReason',
    'dishInstalled',
    'routerInstalled',
    'signalOptimized',
    'connectivityTestPassed',
    'customerTrainingCompleted',
    'installationNotes',
    'proofOfInstallationUrl',
    'customerHandoverConfirmed',
    'closureNotes',
  ];

  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      job[field] = req.body[field];
    }
  });

  if (job.customerHandoverConfirmed) {
    job.customerHandoverAt = job.customerHandoverAt || new Date();
  } else if (req.body.customerHandoverConfirmed === false) {
    job.customerHandoverAt = undefined;
  }

  if (job.status === 'In Progress' && !job.startedAt) {
    job.startedAt = new Date();
  }

  if (job.status === 'Installed') {
    job.completedAt = job.completedAt || new Date();
    job.failureReason = undefined;
    job.revisitReason = undefined;
  } else if (job.status === 'Failed') {
    job.completedAt = undefined;
  }

  if (job.status === 'Revisit Required' && previousStatus !== 'Revisit Required') {
    job.revisitCount += 1;
  }

  if (req.body.certificateIssued !== undefined) {
    if (!canManageInstallations(req.user.role)) {
      return res.status(403).json({ message: 'Only Admin and Agent can issue certificates' });
    }

    if (req.body.certificateIssued) {
      const contract = await Contract.findById(job.contract._id || job.contract);
      if (job.status !== 'Installed') {
        return res.status(400).json({ message: 'Installation must be marked as Installed before issuing a certificate' });
      }
      if (!contract || contract.status !== 'Completed') {
        return res.status(400).json({ message: 'The contract must be fully completed before issuing a certificate' });
      }
      job.certificateIssued = true;
      job.certificateIssuedAt = new Date();
    } else {
      job.certificateIssued = false;
      job.certificateIssuedAt = undefined;
    }
  }

  job.updatedBy = req.user._id;
  await job.save();

  const populated = await InstallationJob.findById(job._id).populate(installationPopulate);
  res.json({ message: 'Installation job updated successfully', job: populated });
};

module.exports = {
  getInstallations,
  getInstallationById,
  getInstallationOptions,
  createInstallation,
  updateInstallation,
};
