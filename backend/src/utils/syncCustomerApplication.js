const Customer = require('../models/Customer');
const Application = require('../models/Application');
const Contract = require('../models/Contract');
const Package = require('../models/Package');
const PaymentScheduleItem = require('../models/PaymentScheduleItem');

const CUSTOMER_TYPE_MAP = {
  'Individual/Household': 'Household',
  'Business/Company': 'Business',
  'School/Institution': 'School',
};

const mapStatusToApplication = (status) => {
  if (['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected'].includes(status)) {
    return status;
  }

  return 'Draft';
};

const roundMoney = (value) => Math.round(Number(value || 0) * 100) / 100;

const syncCustomerApplication = async (customerApplication, actor = null) => {
  const packageRecord = await Package.findOne({ name: customerApplication.packageName });
  if (!packageRecord) {
    throw new Error('Linked package record not found for this customer application');
  }

  const effectiveActor = actor || {
    _id: customerApplication.approvedBy || customerApplication.createdBy,
    role: 'Admin',
  };

  let customer = customerApplication.linkedCustomer
    ? await Customer.findById(customerApplication.linkedCustomer)
    : null;

  const customerPayload = {
    customerType: CUSTOMER_TYPE_MAP[customerApplication.customerType],
    fullName: customerApplication.fullName,
    tradingName: customerApplication.tradingName,
    idNumber: customerApplication.idNumber,
    dateOfBirth: customerApplication.dateOfBirthOrIncorporation || undefined,
    nationality: customerApplication.nationality,
    occupation: customerApplication.occupation,
    physicalAddress: customerApplication.physicalAddress,
    city: customerApplication.city,
    province: customerApplication.province,
    phonePrimary: customerApplication.mobilePrimary || 'N/A',
    phoneAlternative: customerApplication.mobileAlternative,
    email: customerApplication.email,
    whatsappNumber: customerApplication.whatsappNumber,
    createdBy: customerApplication.createdBy,
  };

  if (!customer) {
    customer = await Customer.create({
      ...customerPayload,
      user: effectiveActor.role === 'Customer' ? effectiveActor._id : null,
    });
  } else {
    Object.assign(customer, customerPayload);
    await customer.save();
  }

  let application = customerApplication.linkedApplication
    ? await Application.findById(customerApplication.linkedApplication)
    : await Application.findOne({ applicationNo: customerApplication.applicationNumber });

  const applicationStatus = mapStatusToApplication(customerApplication.status);
  const reviewStates = ['Under Review', 'Approved', 'Rejected'];

  const applicationPayload = {
    applicationNo: customerApplication.applicationNumber,
    customer: customer._id,
    package: packageRecord._id,
    status: applicationStatus,
    installationSite: {
      address: customerApplication.installationAddress,
      propertyType: customerApplication.propertyType,
      gpsCoordinates: customerApplication.gpsCoordinates,
      contactPerson: customerApplication.siteContactPerson,
      contactNumber: customerApplication.siteContactNumber,
      ownership: customerApplication.propertyOwnership,
      ownershipOther: customerApplication.propertyOwnershipOther,
      landlordPermission: customerApplication.landlordPermission,
    },
    ecocash: {
      number: customerApplication.ecocashRegisteredNumber,
      registeredName: customerApplication.ecocashRegisteredName,
      alternativeNumber: customerApplication.alternativePaymentNumber,
      authorizeAutoDeductions: customerApplication.autoDeductionAuthorized,
    },
    diasporaSponsor: {
      name: customerApplication.sponsorFullName,
      relationship: customerApplication.sponsorRelationship,
      country: customerApplication.sponsorCountry,
      phone: customerApplication.sponsorPhone,
      email: customerApplication.sponsorEmail,
    },
    hearAboutUs: customerApplication.referralSource || undefined,
    referralCode: customerApplication.referralCode,
    idVerified: customerApplication.officeIdVerified,
    ecocashVerified: customerApplication.officeEcocashVerified,
    depositReceived: customerApplication.officeDepositReceived,
    depositAmount: customerApplication.officeDepositAmount,
    submittedAt:
      applicationStatus !== 'Draft'
        ? (application?.submittedAt || customerApplication.createdAt || new Date())
        : undefined,
    reviewedBy:
      reviewStates.includes(applicationStatus)
        ? (customerApplication.approvedBy || effectiveActor._id)
        : undefined,
    reviewedAt:
      reviewStates.includes(applicationStatus)
        ? (application?.reviewedAt || new Date())
        : undefined,
    createdBy: customerApplication.createdBy,
  };

  if (!application) {
    application = await Application.create(applicationPayload);
  } else {
    Object.assign(application, applicationPayload);
    await application.save();
  }

  const linkedContract = await Contract.findOne({ application: application._id });
  if (linkedContract) {
    const scheduleCount = await PaymentScheduleItem.countDocuments({ contract: linkedContract._id });

    linkedContract.depositPaid = Boolean(application.depositReceived);
    linkedContract.depositAmount = linkedContract.depositPaid
      ? roundMoney(Number(application.depositAmount || packageRecord.deposit || 0))
      : 0;

    if (scheduleCount === 0) {
      const remainingBalance = roundMoney(
        Math.max(Number(packageRecord.totalCost || 0) - linkedContract.depositAmount, 0)
      );

      linkedContract.outstandingBalance = remainingBalance;
      linkedContract.weeklyInstallment = roundMoney(remainingBalance / Math.max(Number(linkedContract.durationWeeks || 1), 1));

      if (linkedContract.depositPaid && linkedContract.status === 'Pending Deposit') {
        linkedContract.status = 'Active';
        linkedContract.activatedAt = linkedContract.activatedAt || new Date();
      }

      if (!linkedContract.depositPaid && linkedContract.status !== 'Completed') {
        linkedContract.status = 'Pending Deposit';
        linkedContract.activatedAt = undefined;
      }
    }

    await linkedContract.save();
  }

  customerApplication.linkedCustomer = customer._id;
  customerApplication.linkedApplication = application._id;

  return customerApplication;
};

module.exports = { syncCustomerApplication };
