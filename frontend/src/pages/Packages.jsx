import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Package2, Pencil, Plus, Trash2, Settings as SettingsIcon } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
} from '../api/packages';
import { getSettings, updateSettings } from '../api/settings';

const PACKAGE_TYPES = ['Household', 'Business', 'School'];

const emptyPackageForm = {
  name: '',
  description: '',
  totalCost: '',
  depositPercent: '',
  weeklyAmount: '',
  weeks: 8,
  type: 'Household',
  isActive: true,
};

const emptySettingsForm = {
  lateFeeAmount: '',
  gracePeriodDays: '',
  earlySettlementDiscountPercent: '',
  ecocashMerchantCode: '',
};

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      {children}
    </label>
  );
}

function inputClassName() {
  return 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
}

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingPackage, setSavingPackage] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPackageItem, setEditPackageItem] = useState(null);
  const [packageForm, setPackageForm] = useState(emptyPackageForm);
  const [settingsForm, setSettingsForm] = useState(emptySettingsForm);

  const loadData = async () => {
    try {
      const [{ data: packageData }, { data: settingsData }] = await Promise.all([
        getPackages({ includeInactive: true }),
        getSettings(),
      ]);

      setPackages(packageData);
      setSettings(settingsData);
      setSettingsForm({
        lateFeeAmount: settingsData.lateFeeAmount ?? 0,
        gracePeriodDays: settingsData.gracePeriodDays ?? 0,
        earlySettlementDiscountPercent: settingsData.earlySettlementDiscountPercent ?? 0,
        ecocashMerchantCode: settingsData.ecocashMerchantCode || '',
      });
    } catch {
      toast.error('Failed to load package configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditPackageItem(null);
    setPackageForm(emptyPackageForm);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditPackageItem(item);
    setPackageForm({
      name: item.name || '',
      description: item.description || '',
      totalCost: item.totalCost ?? '',
      depositPercent: item.depositPercent ?? '',
      weeklyAmount: item.weeklyAmount ?? '',
      weeks: item.weeks ?? 8,
      type: item.type || 'Household',
      isActive: Boolean(item.isActive),
    });
    setModalOpen(true);
  };

  const handlePackageSubmit = async (e) => {
    e.preventDefault();
    setSavingPackage(true);

    const payload = {
      ...packageForm,
      totalCost: Number(packageForm.totalCost),
      depositPercent: Number(packageForm.depositPercent),
      weeklyAmount: packageForm.weeklyAmount === '' ? undefined : Number(packageForm.weeklyAmount),
      weeks: Number(packageForm.weeks || 8),
    };

    try {
      if (editPackageItem) {
        await updatePackage(editPackageItem._id, payload);
        toast.success('Package updated');
      } else {
        await createPackage(payload);
        toast.success('Package created');
      }

      setModalOpen(false);
      setLoading(true);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save package');
    } finally {
      setSavingPackage(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;

    try {
      await deletePackage(item._id);
      toast.success('Package deleted');
      setLoading(true);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete package');
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setSavingSettings(true);

    try {
      const payload = {
        lateFeeAmount: Number(settingsForm.lateFeeAmount),
        gracePeriodDays: Number(settingsForm.gracePeriodDays),
        earlySettlementDiscountPercent: Number(settingsForm.earlySettlementDiscountPercent),
        ecocashMerchantCode: settingsForm.ecocashMerchantCode,
      };

      const { data } = await updateSettings(payload);
      setSettings(data.settings);
      toast.success('System settings updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Packages & Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Admin configuration for package pricing, penalties, and merchant settings</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Add Package
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
              <Package2 size={18} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-900">Service Packages</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Name', 'Type', 'Pricing', 'Status', 'Actions'].map((heading) => (
                    <th key={heading} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {packages.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.description || 'No description'}</div>
                    </td>
                    <td className="px-4 py-3"><Badge label={item.type} /></td>
                    <td className="px-4 py-3 text-gray-600">
                      <div>Total: USD {item.totalCost.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        Deposit: {item.depositPercent}% (USD {item.deposit.toFixed(2)}) • Weekly: USD {item.weeklyAmount.toFixed(2)} x {item.weeks}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={item.isActive ? 'Active' : 'Inactive'} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit package"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete package"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {packages.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400">No packages configured</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
              <SettingsIcon size={18} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-900">Global System Settings</h2>
            </div>
            <form onSubmit={handleSettingsSubmit} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Late Fee Amount (USD)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={settingsForm.lateFeeAmount}
                  onChange={(e) => setSettingsForm((current) => ({ ...current, lateFeeAmount: e.target.value }))}
                  className={inputClassName()}
                />
              </Field>
              <Field label="Grace Period (Days)">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={settingsForm.gracePeriodDays}
                  onChange={(e) => setSettingsForm((current) => ({ ...current, gracePeriodDays: e.target.value }))}
                  className={inputClassName()}
                />
              </Field>
              <Field label="Early Settlement Discount (%)">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={settingsForm.earlySettlementDiscountPercent}
                  onChange={(e) => setSettingsForm((current) => ({ ...current, earlySettlementDiscountPercent: e.target.value }))}
                  className={inputClassName()}
                />
              </Field>
              <Field label="EcoCash Merchant Code">
                <input
                  value={settingsForm.ecocashMerchantCode}
                  onChange={(e) => setSettingsForm((current) => ({ ...current, ecocashMerchantCode: e.target.value }))}
                  className={inputClassName()}
                />
              </Field>
              <div className="md:col-span-2 flex items-center justify-between gap-4 pt-2">
                <p className="text-xs text-gray-500">
                  Last saved: {settings?.updatedAt ? new Date(settings.updatedAt).toLocaleString() : 'Not saved yet'}
                </p>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-60"
                >
                  {savingSettings ? <Spinner size="sm" /> : null}
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editPackageItem ? 'Edit Package' : 'Add Package'}
              </h2>
            </div>
            <form onSubmit={handlePackageSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Package Name">
                <input
                  required
                  value={packageForm.name}
                  onChange={(e) => setPackageForm((current) => ({ ...current, name: e.target.value }))}
                  className={inputClassName()}
                />
              </Field>
              <Field label="Package Type">
                <select
                  value={packageForm.type}
                  onChange={(e) => setPackageForm((current) => ({ ...current, type: e.target.value }))}
                  className={`${inputClassName()} bg-white`}
                >
                  {PACKAGE_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </Field>
              <Field label="Total Cost (USD)">
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={packageForm.totalCost}
                  onChange={(e) => setPackageForm((current) => ({ ...current, totalCost: e.target.value }))}
                  className={inputClassName()}
                />
              </Field>
              <Field label="Deposit Percentage">
                <input
                  required
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={packageForm.depositPercent}
                  onChange={(e) => setPackageForm((current) => ({ ...current, depositPercent: e.target.value }))}
                  className={inputClassName()}
                />
              </Field>
              <Field label="Weekly Amount (USD)">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={packageForm.weeklyAmount}
                  onChange={(e) => setPackageForm((current) => ({ ...current, weeklyAmount: e.target.value }))}
                  className={inputClassName()}
                />
              </Field>
              <Field label="Duration (Weeks)">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={packageForm.weeks}
                  onChange={(e) => setPackageForm((current) => ({ ...current, weeks: e.target.value }))}
                  className={inputClassName()}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Description">
                  <textarea
                    rows="3"
                    value={packageForm.description}
                    onChange={(e) => setPackageForm((current) => ({ ...current, description: e.target.value }))}
                    className={inputClassName()}
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={packageForm.isActive}
                    onChange={(e) => setPackageForm((current) => ({ ...current, isActive: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Package is active</span>
                </label>
              </div>
              <div className="md:col-span-2 flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPackage}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {savingPackage ? <Spinner size="sm" /> : null}
                  {savingPackage ? 'Saving...' : editPackageItem ? 'Save Changes' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
