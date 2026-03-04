const CustomerApplication = require('../models/CustomerApplication');
const Package = require('../models/Package');
const { syncCustomerApplication } = require('../utils/syncCustomerApplication');

const formatApplicationNumber = (sequence) => `UT-APP-${String(sequence).padStart(4, '0')}`;
const roundMoney = (value) => Math.round(Number(value || 0) * 100) / 100;

const buildAccessFilter = (req) => {
  if (req.user.role === 'Customer') {
    return { createdBy: req.user._id };
  }

  return {};
};

const canAccessApplication = (req, application) => {
  if (req.user.role !== 'Customer') return true;
  return application.createdBy?.equals(req.user._id);
};

const resolveOfficeDeposit = ({ packageRecord, depositReceived, depositAmount }) => {
  const hasAmount = depositAmount !== undefined && depositAmount !== null && depositAmount !== '';
  const parsedAmount = hasAmount ? Number(depositAmount) : undefined;
  const minimumDeposit = roundMoney(packageRecord.deposit);
  const totalCost = roundMoney(packageRecord.totalCost);

  if (hasAmount && (!Number.isFinite(parsedAmount) || parsedAmount < 0)) {
    return { error: 'Deposit amount must be 0 or greater' };
  }

  if (hasAmount && parsedAmount > totalCost) {
    return { error: 'Deposit amount cannot be more than the total package cost' };
  }

  if (hasAmount && parsedAmount > 0 && parsedAmount < minimumDeposit) {
    return { error: `Deposit amount cannot be less than the minimum package deposit of USD ${minimumDeposit.toFixed(2)}` };
  }

  if (depositReceived === true && hasAmount && parsedAmount < minimumDeposit) {
    return { error: `Deposit amount cannot be less than the minimum package deposit of USD ${minimumDeposit.toFixed(2)}` };
  }

  const normalizedDepositReceived = depositReceived === undefined
    ? (hasAmount ? parsedAmount > 0 : undefined)
    : (hasAmount ? parsedAmount > 0 : Boolean(depositReceived));

  const normalizedDepositAmount = normalizedDepositReceived
    ? roundMoney(hasAmount ? parsedAmount : minimumDeposit)
    : (hasAmount ? roundMoney(parsedAmount) : undefined);

  return {
    officeDepositReceived: normalizedDepositReceived,
    officeDepositAmount: normalizedDepositAmount,
  };
};

const buildApplicationPayload = (body) => ({
  customerType: body.customerType,
  fullName: body.fullName,
  tradingName: body.tradingName,
  idNumber: body.idNumber,
  dateOfBirthOrIncorporation: body.dateOfBirthOrIncorporation || undefined,
  nationality: body.nationality,
  occupation: body.occupation,
  physicalAddress: body.physicalAddress,
  city: body.city,
  province: body.province,
  mobilePrimary: body.mobilePrimary,
  mobileAlternative: body.mobileAlternative,
  email: body.email,
  whatsappNumber: body.whatsappNumber,
  installationAddress: body.installationAddress,
  propertyType: body.propertyType,
  gpsCoordinates: body.gpsCoordinates,
  siteContactPerson: body.siteContactPerson,
  siteContactNumber: body.siteContactNumber,
  propertyOwnership: body.propertyOwnership,
  propertyOwnershipOther: body.propertyOwnershipOther,
  landlordPermission: typeof body.landlordPermission === 'boolean' ? body.landlordPermission : undefined,
  ecocashRegisteredNumber: body.ecocashRegisteredNumber,
  ecocashRegisteredName: body.ecocashRegisteredName,
  alternativePaymentNumber: body.alternativePaymentNumber,
  autoDeductionAuthorized: Boolean(body.autoDeductionAuthorized),
  packageName: body.packageName,
  sponsorFullName: body.sponsorFullName,
  sponsorRelationship: body.sponsorRelationship,
  sponsorCountry: body.sponsorCountry,
  sponsorPhone: body.sponsorPhone,
  sponsorEmail: body.sponsorEmail,
  referralSource: body.referralSource,
  referralSourceOther: body.referralSourceOther,
  referralCode: body.referralCode,
  declarationAccepted: Boolean(body.declarationAccepted),
  signatureName: body.signatureName,
  signatureDate: body.signatureDate || undefined,
  signaturePlace: body.signaturePlace,
  officeReceivedBy: body.officeReceivedBy,
  officeDateReceived: body.officeDateReceived || undefined,
  officeIdVerified: typeof body.officeIdVerified === 'boolean' ? body.officeIdVerified : undefined,
  officeEcocashVerified: typeof body.officeEcocashVerified === 'boolean' ? body.officeEcocashVerified : undefined,
  officeDepositReceived: typeof body.officeDepositReceived === 'boolean' ? body.officeDepositReceived : undefined,
  officeDepositAmount: body.officeDepositAmount ?? undefined,
  status: body.status,
});

const getCustomerApplications = async (req, res) => {
  const applications = await CustomerApplication.find(buildAccessFilter(req))
    .populate('createdBy', 'name role')
    .populate('approvedBy', 'name role')
    .sort({ createdAt: -1 });

  res.json(applications);
};

const getCustomerApplicationById = async (req, res) => {
  const application = await CustomerApplication.findById(req.params.id)
    .populate('createdBy', 'name role')
    .populate('approvedBy', 'name role');

  if (!application) {
    return res.status(404).json({ message: 'Customer application not found' });
  }

  if (!canAccessApplication(req, application)) {
    return res.status(403).json({ message: 'Not authorized to view this customer application' });
  }

  res.json(application);
};

const ensureActivePackage = async (packageName) => {
  const activePackage = await Package.findOne({ name: packageName, isActive: true });
  return activePackage;
};

const createCustomerApplication = async (req, res) => {
  const activePackage = await ensureActivePackage(req.body.packageName);
  if (!activePackage) {
    return res.status(400).json({ message: 'Selected package is inactive or no longer available' });
  }

  const normalizedDeposit = resolveOfficeDeposit({
    packageRecord: activePackage,
    depositReceived: req.body.officeDepositReceived,
    depositAmount: req.body.officeDepositAmount,
  });

  if (normalizedDeposit.error) {
    return res.status(400).json({ message: normalizedDeposit.error });
  }

  const count = await CustomerApplication.countDocuments();
  const application = await CustomerApplication.create({
    ...buildApplicationPayload(req.body),
    ...normalizedDeposit,
    applicationNumber: formatApplicationNumber(count + 1),
    createdBy: req.user._id,
    approvedBy: req.body.status === 'Approved' ? req.user._id : undefined,
  });

  await syncCustomerApplication(application, req.user);
  await application.save();

  const populated = await application.populate([
    { path: 'createdBy', select: 'name role' },
    { path: 'approvedBy', select: 'name role' },
  ]);

  res.status(201).json({
    message: 'Customer application created successfully',
    application: populated,
  });
};

const updateCustomerApplication = async (req, res) => {
  const application = await CustomerApplication.findById(req.params.id);

  if (!application) {
    return res.status(404).json({ message: 'Customer application not found' });
  }

  if (!canAccessApplication(req, application)) {
    return res.status(403).json({ message: 'Not authorized to update this customer application' });
  }

  const activePackage = await ensureActivePackage(req.body.packageName);
  const isKeepingCurrentPackage = req.body.packageName === application.packageName;
  if (!activePackage && !isKeepingCurrentPackage) {
    return res.status(400).json({ message: 'Selected package is inactive or no longer available' });
  }

  const packageForValidation = activePackage || await Package.findOne({ name: application.packageName });
  if (!packageForValidation) {
    return res.status(400).json({ message: 'The selected package is no longer available' });
  }

  const normalizedDeposit = resolveOfficeDeposit({
    packageRecord: packageForValidation,
    depositReceived: req.body.officeDepositReceived,
    depositAmount: req.body.officeDepositAmount,
  });

  if (normalizedDeposit.error) {
    return res.status(400).json({ message: normalizedDeposit.error });
  }

  Object.assign(application, buildApplicationPayload(req.body));
  Object.assign(application, normalizedDeposit);

  if (req.body.status === 'Approved') {
    application.approvedBy = req.user._id;
  } else if (req.body.status && req.body.status !== 'Approved') {
    application.approvedBy = undefined;
  }

  await syncCustomerApplication(application, req.user);
  await application.save();

  const populated = await application.populate([
    { path: 'createdBy', select: 'name role' },
    { path: 'approvedBy', select: 'name role' },
  ]);

  res.json({
    message: 'Customer application updated successfully',
    application: populated,
  });
};

module.exports = {
  getCustomerApplications,
  getCustomerApplicationById,
  createCustomerApplication,
  updateCustomerApplication,
};
