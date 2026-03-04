import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FileText, Pencil, Plus } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import { getPackages } from '../api/packages';
import {
  getCustomerApplications,
  createCustomerApplication,
  updateCustomerApplication,
} from '../api/customerApplications';

const CUSTOMER_TYPES = ['Individual/Household', 'Business/Company', 'School/Institution'];
const PROPERTY_OWNERSHIP = ['Owner', 'Tenant', 'Other'];
const APPLICATION_STATUSES = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected'];
const REFERRAL_SOURCES = ['Facebook/Social Media', 'Radio', 'Referral', 'Website', 'Other'];

const emptyForm = {
  customerType: 'Individual/Household',
  fullName: '',
  tradingName: '',
  idNumber: '',
  dateOfBirthOrIncorporation: '',
  nationality: '',
  occupation: '',
  physicalAddress: '',
  city: '',
  province: '',
  mobilePrimary: '',
  mobileAlternative: '',
  email: '',
  whatsappNumber: '',
  installationAddress: '',
  propertyType: '',
  gpsCoordinates: '',
  siteContactPerson: '',
  siteContactNumber: '',
  propertyOwnership: 'Owner',
  propertyOwnershipOther: '',
  landlordPermission: false,
  ecocashRegisteredNumber: '',
  ecocashRegisteredName: '',
  alternativePaymentNumber: '',
  autoDeductionAuthorized: true,
  packageName: 'Diaspora Connect',
  sponsorFullName: '',
  sponsorRelationship: '',
  sponsorCountry: '',
  sponsorPhone: '',
  sponsorEmail: '',
  referralSource: 'Facebook/Social Media',
  referralSourceOther: '',
  referralCode: '',
  declarationAccepted: true,
  signatureName: '',
  signatureDate: '',
  signaturePlace: '',
  officeReceivedBy: '',
  officeDateReceived: '',
  officeIdVerified: false,
  officeEcocashVerified: false,
  officeDepositReceived: false,
  officeDepositAmount: '',
  status: 'Submitted',
};

function TextInput({ label, value, onChange, required = false, type = 'text', placeholder = '' }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}{required ? ' *' : ''}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </label>
  );
}

function SelectInput({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      <select
        value={value}
        onChange={onChange}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function CheckboxInput({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <span>{label}</span>
    </label>
  );
}

function Section({ title, children }) {
  return (
    <section className="border border-gray-200 rounded-xl p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </section>
  );
}

export default function CustomerApplications() {
  const { user } = useAuth();
  const isStaff = ['Admin', 'Agent'].includes(user?.role);
  const isCustomer = user?.role === 'Customer';
  const canEdit = isStaff || isCustomer;
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editApplication, setEditApplication] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [packages, setPackages] = useState([]);

  const fetchData = async () => {
    try {
      const [{ data: applicationData }, { data: packageData }] = await Promise.all([
        getCustomerApplications(),
        getPackages(),
      ]);
      setApplications(applicationData);
      setPackages(packageData);
    } catch {
      toast.error('Failed to load customer applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const openCreate = () => {
    const defaultPackageName = packages[0]?.name || '';
    setEditApplication(null);
    setForm({
      ...emptyForm,
      packageName: defaultPackageName,
      signatureName: user?.name || '',
      email: isCustomer ? (user?.email || '') : '',
      officeReceivedBy: isStaff ? (user?.name || '') : '',
      status: isCustomer ? 'Submitted' : 'Submitted',
    });
    setDrawerOpen(true);
  };

  const openEdit = (application) => {
    setEditApplication(application);
    setForm({
      customerType: application.customerType || emptyForm.customerType,
      fullName: application.fullName || '',
      tradingName: application.tradingName || '',
      idNumber: application.idNumber || '',
      dateOfBirthOrIncorporation: application.dateOfBirthOrIncorporation?.slice(0, 10) || '',
      nationality: application.nationality || '',
      occupation: application.occupation || '',
      physicalAddress: application.physicalAddress || '',
      city: application.city || '',
      province: application.province || '',
      mobilePrimary: application.mobilePrimary || '',
      mobileAlternative: application.mobileAlternative || '',
      email: application.email || '',
      whatsappNumber: application.whatsappNumber || '',
      installationAddress: application.installationAddress || '',
      propertyType: application.propertyType || '',
      gpsCoordinates: application.gpsCoordinates || '',
      siteContactPerson: application.siteContactPerson || '',
      siteContactNumber: application.siteContactNumber || '',
      propertyOwnership: application.propertyOwnership || emptyForm.propertyOwnership,
      propertyOwnershipOther: application.propertyOwnershipOther || '',
      landlordPermission: Boolean(application.landlordPermission),
      ecocashRegisteredNumber: application.ecocashRegisteredNumber || '',
      ecocashRegisteredName: application.ecocashRegisteredName || '',
      alternativePaymentNumber: application.alternativePaymentNumber || '',
      autoDeductionAuthorized: Boolean(application.autoDeductionAuthorized),
      packageName: application.packageName || emptyForm.packageName,
      sponsorFullName: application.sponsorFullName || '',
      sponsorRelationship: application.sponsorRelationship || '',
      sponsorCountry: application.sponsorCountry || '',
      sponsorPhone: application.sponsorPhone || '',
      sponsorEmail: application.sponsorEmail || '',
      referralSource: application.referralSource || emptyForm.referralSource,
      referralSourceOther: application.referralSourceOther || '',
      referralCode: application.referralCode || '',
      declarationAccepted: Boolean(application.declarationAccepted),
      signatureName: application.signatureName || '',
      signatureDate: application.signatureDate?.slice(0, 10) || '',
      signaturePlace: application.signaturePlace || '',
      officeReceivedBy: application.officeReceivedBy || '',
      officeDateReceived: application.officeDateReceived?.slice(0, 10) || '',
      officeIdVerified: Boolean(application.officeIdVerified),
      officeEcocashVerified: Boolean(application.officeEcocashVerified),
      officeDepositReceived: Boolean(application.officeDepositReceived),
      officeDepositAmount: application.officeDepositAmount ?? '',
      status: application.status || emptyForm.status,
    });
    setDrawerOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      officeDepositAmount: form.officeDepositAmount === '' ? undefined : Number(form.officeDepositAmount),
      // Customers always submit — they cannot set status themselves
      status: isCustomer ? 'Submitted' : form.status,
    };

    try {
      if (editApplication) {
        await updateCustomerApplication(editApplication._id, payload);
        toast.success('Customer application updated');
      } else {
        await createCustomerApplication(payload);
        toast.success('Customer application created');
      }

      setDrawerOpen(false);
      setEditApplication(null);
      setForm(emptyForm);
      setLoading(true);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save customer application');
    } finally {
      setSaving(false);
    }
  };

  const packageOptions = packages.map((item) => item.name);
  const visiblePackageOptions = form.packageName && !packageOptions.includes(form.packageName)
    ? [form.packageName, ...packageOptions]
    : packageOptions;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isCustomer ? 'My Applications' : 'Customer Applications'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isCustomer ? 'Submit and track your Starlink service applications' : 'Capture onboarding data from the customer application form'}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openCreate}
            disabled={packages.length === 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
          >
            <Plus size={16} /> New Application
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <>
          {packages.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-4 text-sm">
              No active packages are available. Activate a package before creating new applications.
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Application', 'Applicant', 'Package', 'Status', 'Received By', 'Actions'].map((heading) => (
                    <th key={heading} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map((application) => (
                  <tr key={application._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{application.applicationNumber}</div>
                      <div className="text-xs text-gray-500">{application.customerType}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{application.fullName}</div>
                      <div className="text-xs text-gray-500">{application.mobilePrimary || application.email || 'No contact yet'}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{application.packageName}</td>
                    <td className="px-4 py-3"><Badge label={application.status} /></td>
                    <td className="px-4 py-3 text-gray-600">{application.officeReceivedBy || application.createdBy?.name || 'Unassigned'}</td>
                    <td className="px-4 py-3">
                      {canEdit ? (
                        <button
                          onClick={() => openEdit(application)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit application"
                        >
                          <Pencil size={15} />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">View only</span>
                      )}
                    </td>
                  </tr>
                ))}
                {applications.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <FileText size={22} />
                        <span>No customer applications yet</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {drawerOpen && canEdit && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
          <div className="w-full max-w-4xl h-full bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editApplication ? `Edit ${editApplication.applicationNumber}` : 'New Customer Application'}
                </h2>
                <p className="text-sm text-gray-500">Customer onboarding data aligned to the signed application form</p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <Section title="Section A: Customer Type">
                <SelectInput
                  label="Customer Type"
                  value={form.customerType}
                  onChange={(e) => updateForm('customerType', e.target.value)}
                  options={CUSTOMER_TYPES}
                />
                {isStaff && (
                  <SelectInput
                    label="Application Status"
                    value={form.status}
                    onChange={(e) => updateForm('status', e.target.value)}
                    options={APPLICATION_STATUSES}
                  />
                )}
              </Section>

              <Section title="Section B: Applicant Information">
                <TextInput label="Full Name / Company Name" required value={form.fullName} onChange={(e) => updateForm('fullName', e.target.value)} />
                <TextInput label="Trading Name" value={form.tradingName} onChange={(e) => updateForm('tradingName', e.target.value)} />
                <TextInput label="ID Number / Reg. Number" value={form.idNumber} onChange={(e) => updateForm('idNumber', e.target.value)} />
                <TextInput
                  label="Date of Birth / Incorporation"
                  type="date"
                  value={form.dateOfBirthOrIncorporation}
                  onChange={(e) => updateForm('dateOfBirthOrIncorporation', e.target.value)}
                />
                <TextInput label="Nationality / Country of Reg." value={form.nationality} onChange={(e) => updateForm('nationality', e.target.value)} />
                <TextInput label="Occupation / Business Type" value={form.occupation} onChange={(e) => updateForm('occupation', e.target.value)} />
              </Section>

              <Section title="Section C: Contact Details">
                <TextInput label="Physical Address" value={form.physicalAddress} onChange={(e) => updateForm('physicalAddress', e.target.value)} />
                <TextInput label="City / Town" value={form.city} onChange={(e) => updateForm('city', e.target.value)} />
                <TextInput label="Province" value={form.province} onChange={(e) => updateForm('province', e.target.value)} />
                <TextInput label="Mobile Number (Primary)" value={form.mobilePrimary} onChange={(e) => updateForm('mobilePrimary', e.target.value)} />
                <TextInput label="Mobile Number (Alternative)" value={form.mobileAlternative} onChange={(e) => updateForm('mobileAlternative', e.target.value)} />
                <TextInput label="Email Address" type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} />
                <TextInput label="WhatsApp Number" value={form.whatsappNumber} onChange={(e) => updateForm('whatsappNumber', e.target.value)} />
              </Section>

              <Section title="Section D: Installation Site Details">
                <TextInput label="Installation Address" value={form.installationAddress} onChange={(e) => updateForm('installationAddress', e.target.value)} />
                <TextInput label="Property Type" value={form.propertyType} onChange={(e) => updateForm('propertyType', e.target.value)} />
                <TextInput label="GPS Coordinates" value={form.gpsCoordinates} onChange={(e) => updateForm('gpsCoordinates', e.target.value)} />
                <TextInput label="Contact Person at Site" value={form.siteContactPerson} onChange={(e) => updateForm('siteContactPerson', e.target.value)} />
                <TextInput label="Contact Number at Site" value={form.siteContactNumber} onChange={(e) => updateForm('siteContactNumber', e.target.value)} />
                <SelectInput
                  label="Property Ownership"
                  value={form.propertyOwnership}
                  onChange={(e) => updateForm('propertyOwnership', e.target.value)}
                  options={PROPERTY_OWNERSHIP}
                />
                {form.propertyOwnership === 'Other' && (
                  <TextInput label="Property Ownership (Other)" value={form.propertyOwnershipOther} onChange={(e) => updateForm('propertyOwnershipOther', e.target.value)} />
                )}
                <div className="md:col-span-2">
                  <CheckboxInput
                    label="Landlord permission confirmed (if tenant)"
                    checked={form.landlordPermission}
                    onChange={(e) => updateForm('landlordPermission', e.target.checked)}
                  />
                </div>
              </Section>

              <Section title="Section E: EcoCash Payment Details">
                <TextInput label="EcoCash Registered Number" value={form.ecocashRegisteredNumber} onChange={(e) => updateForm('ecocashRegisteredNumber', e.target.value)} />
                <TextInput label="EcoCash Registered Name" value={form.ecocashRegisteredName} onChange={(e) => updateForm('ecocashRegisteredName', e.target.value)} />
                <TextInput label="Alternative Payment Number" value={form.alternativePaymentNumber} onChange={(e) => updateForm('alternativePaymentNumber', e.target.value)} />
                <div className="md:col-span-2">
                  <CheckboxInput
                    label="Customer authorizes automatic weekly deductions"
                    checked={form.autoDeductionAuthorized}
                    onChange={(e) => updateForm('autoDeductionAuthorized', e.target.checked)}
                  />
                </div>
              </Section>

              <Section title="Section F: Service Package Selection">
                <SelectInput
                  label="Preferred Package"
                  value={form.packageName}
                  onChange={(e) => updateForm('packageName', e.target.value)}
                  options={visiblePackageOptions}
                />
              </Section>

              <Section title="Section G: Diaspora Sponsor Details">
                <TextInput label="Sponsor Full Name" value={form.sponsorFullName} onChange={(e) => updateForm('sponsorFullName', e.target.value)} />
                <TextInput label="Relationship to Applicant" value={form.sponsorRelationship} onChange={(e) => updateForm('sponsorRelationship', e.target.value)} />
                <TextInput label="Country of Residence" value={form.sponsorCountry} onChange={(e) => updateForm('sponsorCountry', e.target.value)} />
                <TextInput label="Phone Number" value={form.sponsorPhone} onChange={(e) => updateForm('sponsorPhone', e.target.value)} />
                <TextInput label="Email Address" type="email" value={form.sponsorEmail} onChange={(e) => updateForm('sponsorEmail', e.target.value)} />
              </Section>

              <Section title="Section H: Referral Details">
                <SelectInput
                  label="How Did You Hear About Us?"
                  value={form.referralSource}
                  onChange={(e) => updateForm('referralSource', e.target.value)}
                  options={REFERRAL_SOURCES}
                />
                {form.referralSource === 'Other' && (
                  <TextInput label="Referral Source (Other)" value={form.referralSourceOther} onChange={(e) => updateForm('referralSourceOther', e.target.value)} />
                )}
                <TextInput label="Referral Code" value={form.referralCode} onChange={(e) => updateForm('referralCode', e.target.value)} />
              </Section>

              <Section title="Section I: Declaration And Consent">
                <div className="md:col-span-2 space-y-3">
                  <CheckboxInput
                    label="Applicant has accepted the declaration and consent statements"
                    checked={form.declarationAccepted}
                    onChange={(e) => updateForm('declarationAccepted', e.target.checked)}
                  />
                </div>
                <TextInput label="Signature Name" value={form.signatureName} onChange={(e) => updateForm('signatureName', e.target.value)} />
                <TextInput label="Signature Date" type="date" value={form.signatureDate} onChange={(e) => updateForm('signatureDate', e.target.value)} />
                <TextInput label="Signature Place" value={form.signaturePlace} onChange={(e) => updateForm('signaturePlace', e.target.value)} />
              </Section>

              {isStaff && (
                <Section title="Office Use Only">
                  <TextInput label="Application Received By" value={form.officeReceivedBy} onChange={(e) => updateForm('officeReceivedBy', e.target.value)} />
                  <TextInput label="Date Received" type="date" value={form.officeDateReceived} onChange={(e) => updateForm('officeDateReceived', e.target.value)} />
                  <TextInput
                    label="Deposit Amount (USD)"
                    type="number"
                    value={form.officeDepositAmount}
                    onChange={(e) => updateForm('officeDepositAmount', e.target.value)}
                  />
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <CheckboxInput
                      label="ID Verified"
                      checked={form.officeIdVerified}
                      onChange={(e) => updateForm('officeIdVerified', e.target.checked)}
                    />
                    <CheckboxInput
                      label="EcoCash Verified"
                      checked={form.officeEcocashVerified}
                      onChange={(e) => updateForm('officeEcocashVerified', e.target.checked)}
                    />
                    <CheckboxInput
                      label="Deposit Received"
                      checked={form.officeDepositReceived}
                      onChange={(e) => updateForm('officeDepositReceived', e.target.checked)}
                    />
                  </div>
                </Section>
              )}

              <div className="flex gap-3 pb-6">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? <Spinner size="sm" /> : null}
                  {saving ? 'Saving...' : editApplication ? 'Save Changes' : isCustomer ? 'Submit Application' : 'Create Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
