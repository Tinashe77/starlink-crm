import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarRange, Pencil, Plus } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import { getContracts } from '../api/contracts';
import { getPaymentPlans, generatePaymentPlan, updatePaymentPlanItem } from '../api/paymentPlans';
import { createPayment, getPayments, sendPaymentReminder, settleContractBalance } from '../api/payments';

const INSTALLMENT_STATUSES = ['Pending', 'Paid', 'Late', 'Defaulted'];
const PAYMENT_METHODS = ['EcoCash', 'Cash', 'Bank Transfer', 'Card', 'Other'];

const emptyGenerateForm = {
  contract: '',
  startDate: '',
};

const emptyEditForm = {
  dueDate: '',
  amountDue: '',
  amountPaid: '',
  status: 'Pending',
  paymentReference: '',
  notes: '',
};

const emptyCaptureForm = {
  amount: '',
  paymentDate: '',
  paymentMethod: 'EcoCash',
  ecocashReference: '',
  notes: '',
};

const emptySettleForm = {
  paymentDate: '',
  paymentMethod: 'EcoCash',
  ecocashReference: '',
  notes: '',
  applyDiscount: true,
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

export default function PaymentPlans() {
  const { user } = useAuth();
  const canManage = ['Admin', 'Agent', 'Collections Officer'].includes(user?.role);

  const [contracts, setContracts] = useState([]);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [generateForm, setGenerateForm] = useState(emptyGenerateForm);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [captureForm, setCaptureForm] = useState(emptyCaptureForm);
  const [settleForm, setSettleForm] = useState(emptySettleForm);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedPaymentItem, setSelectedPaymentItem] = useState(null);
  const [selectedSettlementContract, setSelectedSettlementContract] = useState(null);

  const loadData = async () => {
    try {
      const [{ data: contractData }, { data: scheduleData }, { data: paymentData }] = await Promise.all([
        getContracts(),
        getPaymentPlans(),
        getPayments(),
      ]);

      setContracts(contractData);
      setScheduleItems(scheduleData);
      setPayments(paymentData);
    } catch {
      toast.error('Failed to load payment plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const eligibleContracts = useMemo(
    () =>
      contracts.filter(
        (contract) =>
          contract.depositPaid &&
          !contract.paymentPlanReady &&
          contract.status !== 'Completed'
      ),
    [contracts]
  );

  const paymentsByItem = useMemo(() => {
    const grouped = new Map();

    payments.forEach((payment) => {
      const scheduleItemId =
        typeof payment.scheduleItem === 'string'
          ? payment.scheduleItem
          : payment.scheduleItem?._id;

      if (!scheduleItemId) return;

      const existing = grouped.get(scheduleItemId) || [];
      existing.push(payment);
      grouped.set(scheduleItemId, existing);
    });

    return grouped;
  }, [payments]);

  const contractSummaries = useMemo(() => {
    const summary = new Map();

    contracts.forEach((contract) => {
      const items = scheduleItems
        .filter((item) => item.contract?._id === contract._id)
        .sort((a, b) => a.weekNumber - b.weekNumber);
      const nextDue = items.find((item) => item.status !== 'Paid') || null;

      summary.set(contract._id, {
        count: items.length,
        paidCount: items.filter((item) => item.status === 'Paid').length,
        nextDue,
      });
    });

    return summary;
  }, [contracts, scheduleItems]);

  const openGenerate = () => {
    setGenerateForm({
      contract: eligibleContracts[0]?._id || '',
      startDate: new Date().toISOString().slice(0, 10),
    });
    setGenerateOpen(true);
  };

  const openGenerateForContract = (contractId) => {
    setGenerateForm({
      contract: contractId,
      startDate: new Date().toISOString().slice(0, 10),
    });
    setGenerateOpen(true);
  };

  const openEdit = (item) => {
    setSelectedItem(item);
    setEditForm({
      dueDate: item.dueDate?.slice(0, 10) || '',
      amountDue: item.amountDue,
      amountPaid: item.amountPaid,
      status: item.status,
      paymentReference: item.paymentReference || '',
      notes: item.notes || '',
    });
    setEditOpen(true);
  };

  const openCapture = (item) => {
    const remaining = Math.max(item.amountDue - item.amountPaid, 0);
    setSelectedPaymentItem(item);
    setCaptureForm({
      amount: remaining ? remaining.toFixed(2) : '',
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'EcoCash',
      ecocashReference: '',
      notes: '',
    });
    setCaptureOpen(true);
  };

  const openSettle = (contract) => {
    setSelectedSettlementContract(contract);
    setSettleForm({
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'EcoCash',
      ecocashReference: '',
      notes: '',
      applyDiscount: true,
    });
    setSettleOpen(true);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await generatePaymentPlan(generateForm);
      toast.success('Payment plan generated');
      setGenerateOpen(false);
      setLoading(true);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate payment plan');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updatePaymentPlanItem(selectedItem._id, {
        ...editForm,
        amountDue: Number(editForm.amountDue),
        amountPaid: Number(editForm.amountPaid),
      });
      toast.success('Installment updated');
      setEditOpen(false);
      setSelectedItem(null);
      setLoading(true);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update installment');
    } finally {
      setSaving(false);
    }
  };

  const handleCapture = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createPayment({
        scheduleItem: selectedPaymentItem._id,
        amount: Number(captureForm.amount),
        paymentDate: captureForm.paymentDate,
        paymentMethod: captureForm.paymentMethod,
        ecocashReference: captureForm.ecocashReference,
        notes: captureForm.notes,
      });
      toast.success('Payment recorded');
      setCaptureOpen(false);
      setSelectedPaymentItem(null);
      setCaptureForm(emptyCaptureForm);
      setLoading(true);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const handleSendReminder = async (contractId) => {
    try {
      await sendPaymentReminder(contractId);
      toast.success('Payment reminder sent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reminder');
    }
  };

  const handleSettleBalance = async (e) => {
    e.preventDefault();
    if (!selectedSettlementContract) return;

    setSaving(true);
    try {
      const { data } = await settleContractBalance(selectedSettlementContract._id, {
        paymentDate: settleForm.paymentDate,
        paymentMethod: settleForm.paymentMethod,
        ecocashReference: settleForm.ecocashReference,
        notes: settleForm.notes,
        applyDiscount: settleForm.applyDiscount,
      });
      toast.success(
        `Balance settled (${data.settlement.discountApplied > 0 ? `discounted by USD ${data.settlement.discountApplied.toFixed(2)}` : 'no discount applied'})`
      );
      setSettleOpen(false);
      setSelectedSettlementContract(null);
      setSettleForm(emptySettleForm);
      setLoading(true);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to settle balance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Plans</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track the 8-week schedule linked to each contract and auto-complete contracts when fully paid</p>
        </div>
        {canManage ? (
          <button
            onClick={openGenerate}
            disabled={eligibleContracts.length === 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
          >
            <Plus size={16} /> Generate Plan
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <>
          {canManage && eligibleContracts.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-4 text-sm">
              No deposit-paid contracts are waiting for payment plan generation.
            </div>
          ) : null}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
              <CalendarRange size={18} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-900">Contract Plan Overview</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Contract', 'Customer', 'Status', 'Schedule', 'Next Due', 'Outstanding', 'Actions'].map((heading) => (
                    <th key={heading} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contracts.map((contract) => {
                  const summary = contractSummaries.get(contract._id) || { count: 0, paidCount: 0, nextDue: null };
                  const canSettle = canManage && summary.count > 0 && summary.nextDue;
                  return (
                    <tr key={contract._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{contract.contractRef}</div>
                        <div className="text-xs text-gray-500">{contract.package?.name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{contract.customer?.fullName}</div>
                        <div className="text-xs text-gray-500">{contract.customer?.phonePrimary || contract.customer?.email || 'No contact'}</div>
                      </td>
                      <td className="px-4 py-3"><Badge label={contract.status} /></td>
                      <td className="px-4 py-3 text-gray-600">
                        {summary.count === 0 ? 'Not generated' : `${summary.paidCount}/${summary.count} installments paid`}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {summary.nextDue ? (
                          <>
                            <div>{new Date(summary.nextDue.dueDate).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-500">
                              USD {(summary.nextDue.amountDue - summary.nextDue.amountPaid).toFixed(2)}
                            </div>
                          </>
                        ) : (
                          'No balance due'
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">USD {contract.outstandingBalance.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {canManage && summary.nextDue ? (
                            <button
                              type="button"
                              onClick={() => openCapture(summary.nextDue)}
                              className="inline-flex items-center rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                            >
                              Record Payment
                            </button>
                          ) : null}
                          {canSettle ? (
                            <button
                              type="button"
                              onClick={() => openSettle(contract)}
                              className="inline-flex items-center rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                            >
                              Settle Balance
                            </button>
                          ) : null}
                          {canManage && !summary.nextDue && summary.count === 0 && contract.depositPaid && !contract.paymentPlanReady ? (
                            <button
                              type="button"
                              onClick={() => openGenerateForContract(contract._id)}
                              className="inline-flex items-center rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                            >
                              Generate Plan
                            </button>
                          ) : null}
                          <Link
                            to={`/payment-plans/${contract._id}/statement`}
                            className="text-xs font-medium text-blue-700 hover:text-blue-900"
                          >
                            View Statement
                          </Link>
                          {canManage && summary.nextDue ? (
                            <button
                              type="button"
                              onClick={() => handleSendReminder(contract._id)}
                              className="text-xs font-medium text-amber-700 hover:text-amber-900"
                            >
                              Send Reminder
                            </button>
                          ) : null}
                          {canManage && summary.count === 0 && !contract.depositPaid ? (
                            <span className="text-xs text-amber-700">
                              Mark deposit paid in Contracts first
                            </span>
                          ) : null}
                          {canManage && summary.count === 0 && contract.status === 'Completed' ? (
                            <span className="text-xs text-gray-500">
                              Contract already completed
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {contracts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">No contracts available</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Installment Schedule</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Contract', 'Week', 'Due Date', 'Amount Due', 'Paid', 'Transactions', 'Status', 'Actions'].map((heading) => (
                    <th key={heading} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scheduleItems.map((item) => {
                  const itemPayments = paymentsByItem.get(item._id) || [];
                  const latestPayment = itemPayments[itemPayments.length - 1];

                  return (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{item.contract?.contractRef}</div>
                        <div className="text-xs text-gray-500">{item.contract?.customer?.fullName}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">Week {item.weekNumber}</td>
                      <td className="px-4 py-3 text-gray-600">{new Date(item.dueDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-gray-600">USD {item.amountDue.toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-600">USD {item.amountPaid.toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {itemPayments.length > 0 ? (
                          <>
                            <div>{itemPayments.length} payment{itemPayments.length === 1 ? '' : 's'}</div>
                            <div className="text-xs text-gray-500">{latestPayment?.receiptNumber}</div>
                          </>
                        ) : (
                          'No payments'
                        )}
                      </td>
                      <td className="px-4 py-3"><Badge label={item.status} /></td>
                      <td className="px-4 py-3">
                        {canManage ? (
                          <div className="flex items-center gap-2">
                            {item.status !== 'Paid' ? (
                              <button
                                type="button"
                                onClick={() => openCapture(item)}
                                className="text-xs font-medium text-emerald-700 hover:text-emerald-900"
                              >
                                Record Payment
                              </button>
                            ) : null}
                            <button
                              onClick={() => openEdit(item)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Update installment"
                              type="button"
                            >
                              <Pencil size={15} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">View only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {scheduleItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400">No payment schedule generated yet</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Recent Payment Activity</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Receipt', 'Contract', 'Week', 'Amount', 'Date', 'Method', 'Received By'].map((heading) => (
                    <th key={heading} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{payment.receiptNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{payment.contract?.contractRef}</div>
                      <div className="text-xs text-gray-500">{payment.contract?.customer?.fullName}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {payment.scheduleItem?.weekNumber ? `Week ${payment.scheduleItem.weekNumber}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">USD {payment.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-600">{payment.paymentMethod}</td>
                    <td className="px-4 py-3 text-gray-600">{payment.receivedBy?.name || 'System'}</td>
                  </tr>
                ))}
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">No payments recorded yet</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      )}

      {generateOpen && canManage ? (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Generate Payment Plan</h2>
            </div>
            <form onSubmit={handleGenerate} className="p-6 space-y-4">
              <Field label="Contract">
                <select
                  required
                  value={generateForm.contract}
                  onChange={(e) => setGenerateForm((current) => ({ ...current, contract: e.target.value }))}
                  className={`${inputClassName} bg-white`}
                >
                  <option value="">Select contract</option>
                  {eligibleContracts.map((contract) => (
                    <option key={contract._id} value={contract._id}>
                      {contract.contractRef} - {contract.customer?.fullName}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="First Due Date">
                <input
                  type="date"
                  value={generateForm.startDate}
                  onChange={(e) => setGenerateForm((current) => ({ ...current, startDate: e.target.value }))}
                  className={inputClassName}
                />
              </Field>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setGenerateOpen(false)}
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
                  {saving ? 'Generating...' : 'Generate Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editOpen && selectedItem && canManage ? (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Update Installment</h2>
            </div>
            <form onSubmit={handleUpdate} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Due Date">
                <input
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm((current) => ({ ...current, dueDate: e.target.value }))}
                  className={inputClassName}
                />
              </Field>
              <Field label="Status">
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((current) => ({ ...current, status: e.target.value }))}
                  className={`${inputClassName} bg-white`}
                >
                  {INSTALLMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </Field>
              <Field label="Amount Due (USD)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.amountDue}
                  onChange={(e) => setEditForm((current) => ({ ...current, amountDue: e.target.value }))}
                  className={inputClassName}
                />
              </Field>
              <Field label="Amount Paid (USD)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.amountPaid}
                  onChange={(e) => setEditForm((current) => ({ ...current, amountPaid: e.target.value }))}
                  className={inputClassName}
                />
              </Field>
              <Field label="Payment Reference">
                <input
                  value={editForm.paymentReference}
                  onChange={(e) => setEditForm((current) => ({ ...current, paymentReference: e.target.value }))}
                  className={inputClassName}
                />
              </Field>
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
      ) : null}

      {captureOpen && selectedPaymentItem && canManage ? (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Record Installment Payment</h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedPaymentItem.contract?.contractRef} - Week {selectedPaymentItem.weekNumber}
              </p>
            </div>
            <form onSubmit={handleCapture} className="p-6 space-y-4">
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm text-gray-700 space-y-1">
                <p><strong>Amount Due:</strong> USD {selectedPaymentItem.amountDue.toFixed(2)}</p>
                <p><strong>Already Paid:</strong> USD {selectedPaymentItem.amountPaid.toFixed(2)}</p>
                <p><strong>Remaining:</strong> USD {(selectedPaymentItem.amountDue - selectedPaymentItem.amountPaid).toFixed(2)}</p>
              </div>
              <Field label="Payment Amount (USD)">
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={(selectedPaymentItem.amountDue - selectedPaymentItem.amountPaid).toFixed(2)}
                  value={captureForm.amount}
                  onChange={(e) => setCaptureForm((current) => ({ ...current, amount: e.target.value }))}
                  className={inputClassName}
                />
              </Field>
              <Field label="Payment Date">
                <input
                  required
                  type="date"
                  value={captureForm.paymentDate}
                  onChange={(e) => setCaptureForm((current) => ({ ...current, paymentDate: e.target.value }))}
                  className={inputClassName}
                />
              </Field>
              <Field label="Payment Method">
                <select
                  value={captureForm.paymentMethod}
                  onChange={(e) => setCaptureForm((current) => ({ ...current, paymentMethod: e.target.value }))}
                  className={`${inputClassName} bg-white`}
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </Field>
              <Field label="EcoCash Reference">
                <input
                  value={captureForm.ecocashReference}
                  onChange={(e) => setCaptureForm((current) => ({ ...current, ecocashReference: e.target.value }))}
                  className={inputClassName}
                  placeholder="Optional transaction reference"
                />
              </Field>
              <Field label="Notes">
                <textarea
                  rows="3"
                  value={captureForm.notes}
                  onChange={(e) => setCaptureForm((current) => ({ ...current, notes: e.target.value }))}
                  className={inputClassName}
                />
              </Field>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCaptureOpen(false);
                    setSelectedPaymentItem(null);
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? <Spinner size="sm" /> : null}
                  {saving ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {settleOpen && selectedSettlementContract && canManage ? (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Settle Remaining Balance</h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedSettlementContract.contractRef} - {selectedSettlementContract.customer?.fullName}
              </p>
            </div>
            <form onSubmit={handleSettleBalance} className="p-6 space-y-4">
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm text-gray-700 space-y-1">
                <p><strong>Outstanding Balance:</strong> USD {selectedSettlementContract.outstandingBalance.toFixed(2)}</p>
                <p><strong>Result:</strong> The system will settle every remaining unpaid installment in one action.</p>
                <p><strong>Discount:</strong> If enabled, the configured early settlement discount will be applied automatically.</p>
              </div>
              <Field label="Settlement Date">
                <input
                  required
                  type="date"
                  value={settleForm.paymentDate}
                  onChange={(e) => setSettleForm((current) => ({ ...current, paymentDate: e.target.value }))}
                  className={inputClassName}
                />
              </Field>
              <Field label="Payment Method">
                <select
                  value={settleForm.paymentMethod}
                  onChange={(e) => setSettleForm((current) => ({ ...current, paymentMethod: e.target.value }))}
                  className={`${inputClassName} bg-white`}
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </Field>
              <Field label="EcoCash Reference">
                <input
                  value={settleForm.ecocashReference}
                  onChange={(e) => setSettleForm((current) => ({ ...current, ecocashReference: e.target.value }))}
                  className={inputClassName}
                  placeholder="Optional transaction reference"
                />
              </Field>
              <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={settleForm.applyDiscount}
                  onChange={(e) => setSettleForm((current) => ({ ...current, applyDiscount: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Apply early settlement discount
              </label>
              <Field label="Notes">
                <textarea
                  rows="3"
                  value={settleForm.notes}
                  onChange={(e) => setSettleForm((current) => ({ ...current, notes: e.target.value }))}
                  className={inputClassName}
                  placeholder="Optional settlement note"
                />
              </Field>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSettleOpen(false);
                    setSelectedSettlementContract(null);
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? <Spinner size="sm" /> : null}
                  {saving ? 'Settling...' : 'Settle Balance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
