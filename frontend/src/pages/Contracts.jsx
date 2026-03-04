import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ExternalLink, FileSignature, Pencil, Plus } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { getContracts, createContract, updateContract } from '../api/contracts';
import { getApplications } from '../api/applications';
import { useAuth } from '../context/AuthContext';

const CONTRACT_STATUSES = ['Pending Deposit', 'Active', 'In Arrears', 'Default', 'Completed'];

const emptyCreateForm = {
  application: '',
  depositPaid: false,
  paymentPlanReady: false,
  notes: '',
};

const emptyEditForm = {
  status: 'Pending Deposit',
  depositPaid: false,
  paymentPlanReady: false,
  outstandingBalance: '',
  notes: '',
};

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputClassName =
  'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function Contracts() {
  const { user } = useAuth();
  const canCreate = ['Admin', 'Agent'].includes(user?.role);
  const canEdit = ['Admin', 'Agent', 'Collections Officer'].includes(user?.role);
  const [contracts, setContracts] = useState([]);
  const [approvedApplications, setApprovedApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [selectedContract, setSelectedContract] = useState(null);

  const loadData = async () => {
    try {
      const requests = [getContracts()];
      if (canCreate) {
        requests.push(getApplications());
      }

      const [contractResponse, applicationResponse] = await Promise.all(requests);
      const contractData = contractResponse.data;
      const applicationData = applicationResponse?.data || [];

      const usedApplicationIds = new Set(contractData.map((contract) => contract.application?._id));
      const availableApplications = applicationData.filter(
        (application) => application.status === 'Approved' && !usedApplicationIds.has(application._id)
      );

      setContracts(contractData);
      setApprovedApplications(availableApplications);
    } catch {
      toast.error('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setCreateForm(emptyCreateForm);
    setCreateOpen(true);
  };

  const openEdit = (contract) => {
    setSelectedContract(contract);
    setEditForm({
      status: contract.status,
      depositPaid: Boolean(contract.depositPaid),
      paymentPlanReady: Boolean(contract.paymentPlanReady),
      outstandingBalance: contract.outstandingBalance,
      notes: contract.notes || '',
    });
    setEditOpen(true);
  };

  const selectedApplication = approvedApplications.find(
    (application) => application._id === createForm.application
  );
  const selectedDeposit = selectedApplication
    ? (
      selectedApplication.depositReceived
        ? Number(selectedApplication.depositAmount || selectedApplication.package?.deposit || 0)
        : 0
    )
    : 0;
  const selectedRemainingBalance = selectedApplication
    ? Math.max(Number(selectedApplication.package?.totalCost || 0) - selectedDeposit, 0)
    : 0;
  const selectedWeeklyInstallment = selectedApplication
    ? (Number(selectedApplication.package?.weeks || 0) > 0
      ? selectedRemainingBalance / Number(selectedApplication.package?.weeks || 1)
      : 0)
    : 0;

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await createContract({
        ...createForm,
      });

      toast.success('Contract generated');
      setCreateOpen(false);
      setLoading(true);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create contract');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateContract(selectedContract._id, {
        ...editForm,
        outstandingBalance: Number(editForm.outstandingBalance),
      });

      toast.success('Contract updated');
      setEditOpen(false);
      setSelectedContract(null);
      setLoading(true);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update contract');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contracts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Generate service agreements from approved applications and track contract status</p>
        </div>
        {canCreate ? (
          <button
            onClick={openCreate}
            disabled={approvedApplications.length === 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
          >
            <Plus size={16} /> New Contract
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <>
          {canCreate && approvedApplications.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-4 text-sm">
              No approved applications are currently waiting for contract generation.
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Contract', 'Customer', 'Package', 'Financials', 'Status', 'Actions'].map((heading) => (
                    <th key={heading} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contracts.map((contract) => (
                  <tr key={contract._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{contract.contractRef}</div>
                      <div className="text-xs text-gray-500">{contract.application?.applicationNo || 'No application'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{contract.customer?.fullName}</div>
                      <div className="text-xs text-gray-500">{contract.customer?.phonePrimary || contract.customer?.email || 'No contact'}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{contract.package?.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <div>Total: USD {contract.totalContractValue.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        Deposit: USD {contract.depositAmount.toFixed(2)} • Weekly: USD {contract.weeklyInstallment.toFixed(2)} x {contract.durationWeeks}
                      </div>
                      <div className="text-xs text-gray-500">Outstanding: USD {contract.outstandingBalance.toFixed(2)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <Badge label={contract.status} />
                        <div className="text-xs text-gray-500">
                          {contract.depositPaid ? 'Deposit paid' : 'Deposit pending'}
                          {contract.paymentPlanReady ? ' • Payment plan ready' : ''}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/contracts/${contract._id}/document`}
                          className="p-1.5 text-gray-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                          title="Open contract"
                        >
                          <ExternalLink size={15} />
                        </Link>
                        {canEdit && (
                          <button
                            onClick={() => openEdit(contract)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit contract"
                          >
                            <Pencil size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {contracts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <FileSignature size={22} />
                        <span>No contracts have been generated yet</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {createOpen && canCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Generate Contract</h2>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <Field label="Approved Application">
                <select
                  required
                  value={createForm.application}
                  onChange={(e) => {
                    const nextApplication = approvedApplications.find((application) => application._id === e.target.value);
                    setCreateForm((current) => ({
                      ...current,
                      application: e.target.value,
                      depositPaid: Boolean(nextApplication?.depositReceived),
                    }));
                  }}
                  className={`${inputClassName} bg-white`}
                >
                  <option value="">Select an application</option>
                  {approvedApplications.map((application) => (
                    <option key={application._id} value={application._id}>
                      {application.applicationNo} - {application.customer?.fullName} - {application.package?.name}
                    </option>
                  ))}
                </select>
              </Field>

              {selectedApplication && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 space-y-1">
                  <div>Customer: {selectedApplication.customer?.fullName}</div>
                  <div>Package: {selectedApplication.package?.name}</div>
                  <div>Total Contract Value: USD {selectedApplication.package?.totalCost?.toFixed(2)}</div>
                  <div>Minimum Deposit: USD {selectedApplication.package?.deposit?.toFixed(2)} ({selectedApplication.package?.depositPercent}%)</div>
                  <div>Recorded Deposit: USD {selectedDeposit.toFixed(2)}</div>
                  <div>Remaining Balance: USD {selectedRemainingBalance.toFixed(2)}</div>
                  <div>Weekly Installment: USD {selectedWeeklyInstallment.toFixed(2)} x {selectedApplication.package?.weeks}</div>
                </div>
              )}

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={createForm.depositPaid}
                  onChange={(e) => setCreateForm((current) => ({ ...current, depositPaid: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Deposit already received</span>
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={createForm.paymentPlanReady}
                  onChange={(e) => setCreateForm((current) => ({ ...current, paymentPlanReady: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Payment plan has been prepared</span>
              </label>

              <Field label="Notes">
                <textarea
                  rows="3"
                  value={createForm.notes}
                  onChange={(e) => setCreateForm((current) => ({ ...current, notes: e.target.value }))}
                  className={inputClassName}
                />
              </Field>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? <Spinner size="sm" /> : null}
                  {saving ? 'Generating...' : 'Generate Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editOpen && selectedContract && canEdit && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Update {selectedContract.contractRef}</h2>
            </div>
            <form onSubmit={handleUpdate} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Contract Status">
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((current) => ({ ...current, status: e.target.value }))}
                  className={`${inputClassName} bg-white`}
                >
                  {CONTRACT_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </Field>

              <Field label="Outstanding Balance (USD)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.outstandingBalance}
                  onChange={(e) => setEditForm((current) => ({ ...current, outstandingBalance: e.target.value }))}
                  className={inputClassName}
                />
              </Field>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={editForm.depositPaid}
                    onChange={(e) => setEditForm((current) => ({ ...current, depositPaid: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Deposit paid</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={editForm.paymentPlanReady}
                    onChange={(e) => setEditForm((current) => ({ ...current, paymentPlanReady: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Payment plan ready</span>
                </label>
              </div>

              <div className="md:col-span-2">
                <Field label="Notes">
                  <textarea
                    rows="4"
                    value={editForm.notes}
                    onChange={(e) => setEditForm((current) => ({ ...current, notes: e.target.value }))}
                    className={inputClassName}
                  />
                </Field>
              </div>

              <div className="md:col-span-2 flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? <Spinner size="sm" /> : null}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
