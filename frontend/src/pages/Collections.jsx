import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AlertTriangle, RefreshCcw, Receipt, ShieldAlert } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import {
  getCollectionReceipt,
  getCollectionsOverview,
  processOverdueCollections,
  voidCollectionPayment,
} from '../api/collections';

const inputClassName =
  'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

const formatMoney = (value) => `USD ${Number(value || 0).toFixed(2)}`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '—');

export default function Collections() {
  const { user } = useAuth();
  const canVoid = ['Admin', 'Collections Officer'].includes(user?.role);

  const [overview, setOverview] = useState(null);
  const [receiptQuery, setReceiptQuery] = useState('');
  const [receiptResult, setReceiptResult] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchingReceipt, setSearchingReceipt] = useState(false);
  const [voiding, setVoiding] = useState(false);

  const loadOverview = async () => {
    try {
      const { data } = await getCollectionsOverview();
      setOverview(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load collections overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleProcessOverdue = async () => {
    setProcessing(true);
    try {
      const { data } = await processOverdueCollections();
      toast.success(
        data.updatedCount
          ? `Collections updated (${data.updatedCount} installments adjusted)`
          : 'No collection status changes were needed'
      );
      await loadOverview();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process overdue collections');
    } finally {
      setProcessing(false);
    }
  };

  const handleLookupReceipt = async (e) => {
    e.preventDefault();
    if (!receiptQuery.trim()) {
      toast.error('Enter a receipt number first');
      return;
    }

    setSearchingReceipt(true);
    try {
      const { data } = await getCollectionReceipt(receiptQuery.trim());
      setReceiptResult(data);
      setVoidReason('');
    } catch (err) {
      setReceiptResult(null);
      toast.error(err.response?.data?.message || 'Receipt not found');
    } finally {
      setSearchingReceipt(false);
    }
  };

  const handleVoidPayment = async () => {
    if (!receiptResult?._id) return;

    setVoiding(true);
    try {
      const { data } = await voidCollectionPayment(receiptResult._id, {
        reason: voidReason,
      });
      setReceiptResult(data.payment);
      toast.success('Receipt voided successfully');
      await loadOverview();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to void receipt');
    } finally {
      setVoiding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!overview) {
    return <div className="p-6 text-sm text-gray-500">Collections data is unavailable.</div>;
  }

  const { metrics, collectionsQueue, recentPayments, settings } = overview;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Reconcile receipts, process overdue installments, and work the at-risk queue.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadOverview}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCcw size={16} /> Refresh
          </button>
          <button
            type="button"
            onClick={handleProcessOverdue}
            disabled={processing}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {processing ? <Spinner size="sm" /> : <AlertTriangle size={16} />}
            {processing ? 'Processing...' : 'Process Due Statuses'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Due Today', value: metrics.dueTodayCount, detail: formatMoney(metrics.dueTodayAmount), tone: 'amber' },
          { label: 'Overdue Installments', value: metrics.overdueCount, detail: formatMoney(metrics.overdueAmount), tone: 'red' },
          { label: 'Default Risk', value: metrics.defaultRiskCount, detail: `${settings.gracePeriodDays} day grace`, tone: 'orange' },
          { label: 'Payments This Month', value: metrics.paymentsThisMonthCount, detail: formatMoney(metrics.paymentsThisMonth), tone: 'emerald' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{card.value}</p>
            <p className="mt-1 text-sm text-gray-500">{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Late fee policy: {formatMoney(settings.lateFeeAmount)} after {settings.gracePeriodDays} grace day(s). Projected late-fee exposure right now: {formatMoney(metrics.projectedLateFees)}.
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        Daily collections automation is active. It processes installment statuses and sends due-soon, due-today, and overdue email reminders once per day. Use <strong>Process Due Statuses</strong> when you need to force an immediate refresh.
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-200 px-5 py-4 flex items-center gap-2">
            <ShieldAlert size={18} className="text-amber-600" />
            <h2 className="text-sm font-semibold text-gray-900">Collections Queue</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Contract', 'Customer', 'Week', 'Due', 'Balance', 'Status', 'Action'].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {collectionsQueue.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{item.contract?.contractRef}</div>
                    <div className="text-xs text-gray-500">
                      {item.overdueDays > 0 ? `${item.overdueDays} day(s) overdue` : `Due in ${item.daysUntilDue} day(s)`}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{item.contract?.customer?.fullName}</div>
                    <div className="text-xs text-gray-500">{item.contract?.customer?.phonePrimary || item.contract?.customer?.email || 'No contact'}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">Week {item.weekNumber}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(item.dueDate)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatMoney(item.remaining)}</td>
                  <td className="px-4 py-3">
                    <Badge label={item.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/payment-plans/${item.contract?._id}/statement`}
                      className="text-xs font-medium text-blue-700 hover:text-blue-900"
                    >
                      View Statement
                    </Link>
                  </td>
                </tr>
              ))}
              {collectionsQueue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    No contracts currently require collections action.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Receipt size={18} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-900">Receipt Lookup</h2>
            </div>
            <form onSubmit={handleLookupReceipt} className="mt-4 space-y-3">
              <input
                value={receiptQuery}
                onChange={(e) => setReceiptQuery(e.target.value)}
                className={inputClassName}
                placeholder="UT-RCP-00001"
              />
              <button
                type="submit"
                disabled={searchingReceipt}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {searchingReceipt ? 'Searching...' : 'Find Receipt'}
              </button>
            </form>

            {receiptResult ? (
              <div className="mt-5 space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{receiptResult.receiptNumber}</p>
                    <p>{formatMoney(receiptResult.amount)} on {formatDate(receiptResult.paymentDate)}</p>
                  </div>
                  <Badge label={receiptResult.status} />
                </div>
                <div className="space-y-1">
                  <p><strong>Contract:</strong> {receiptResult.contract?.contractRef}</p>
                  <p><strong>Customer:</strong> {receiptResult.contract?.customer?.fullName}</p>
                  <p><strong>Installment:</strong> {receiptResult.scheduleItem?.weekNumber ? `Week ${receiptResult.scheduleItem.weekNumber}` : '—'}</p>
                  <p><strong>Method:</strong> {receiptResult.paymentMethod}</p>
                  <p><strong>EcoCash Ref:</strong> {receiptResult.ecocashReference || '—'}</p>
                  <p><strong>Received By:</strong> {receiptResult.receivedBy?.name || '—'}</p>
                </div>

                {receiptResult.status === 'Voided' ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                    <p><strong>Voided:</strong> {formatDate(receiptResult.voidedAt)}</p>
                    <p><strong>By:</strong> {receiptResult.voidedBy?.name || '—'}</p>
                    <p><strong>Reason:</strong> {receiptResult.voidReason || '—'}</p>
                  </div>
                ) : null}

                {canVoid && receiptResult.status === 'Captured' ? (
                  <div className="space-y-3 border-t border-gray-200 pt-4">
                    <textarea
                      rows="3"
                      value={voidReason}
                      onChange={(e) => setVoidReason(e.target.value)}
                      className={inputClassName}
                      placeholder="Reason for voiding this receipt"
                    />
                    <button
                      type="button"
                      onClick={handleVoidPayment}
                      disabled={voiding}
                      className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      {voiding ? 'Voiding...' : 'Void Receipt and Reverse Payment'}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-900">Recent Captured Payments</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {recentPayments.map((payment) => (
                <div key={payment._id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{payment.receiptNumber}</p>
                      <p className="text-xs text-gray-500">{payment.contract?.contractRef} · {payment.contract?.customer?.fullName}</p>
                    </div>
                    <p className="font-semibold text-gray-900">{formatMoney(payment.amount)}</p>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{formatDate(payment.paymentDate)} via {payment.paymentMethod}</p>
                </div>
              ))}
              {recentPayments.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-gray-400">
                  No captured payments yet.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
