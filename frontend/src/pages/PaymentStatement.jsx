import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import { getPaymentStatement } from '../api/payments';
import BrandLogo from '../components/BrandLogo';

function formatDate(value) {
  if (!value) return '___/___/____';
  return new Date(value).toLocaleDateString();
}

function getInitials(name) {
  if (!name) return '—';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export default function PaymentStatement() {
  const { contractId } = useParams();
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPaymentStatement(contractId)
      .then((res) => setStatement(res.data))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load payment statement'))
      .finally(() => setLoading(false));
  }, [contractId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!statement) {
    return <div className="p-6 text-sm text-gray-500">Payment statement not found.</div>;
  }

  const { contract, schedule, payments, nextDue, paymentComplete } = statement;
  const paymentByScheduleId = new Map();

  payments.forEach((payment) => {
    const key =
      typeof payment.scheduleItem === 'string'
        ? payment.scheduleItem
        : payment.scheduleItem?._id;

    if (!key) return;
    paymentByScheduleId.set(key, payment);
  });

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_right,rgba(21,169,231,0.10),transparent_28%),radial-gradient(circle_at_top_left,rgba(26,182,108,0.08),transparent_22%),#eef5fb]">
      <div className="print:hidden sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/70 bg-white/85 px-6 py-4 backdrop-blur-xl">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{contract.contractRef}</h1>
          <p className="text-sm text-slate-500">StarConnect Africa payment statement</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/payment-plans" className="text-sm text-slate-600 hover:text-slate-900">Back</Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--brand-navy)] to-[var(--brand-cyan)] px-4 py-2.5 text-sm font-medium text-white shadow-[0_16px_30px_rgba(23,63,143,0.22)]"
          >
            <Download size={16} /> Download / Print
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 print:p-0">
        <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 shadow-[0_26px_70px_rgba(15,23,42,0.10)] print:rounded-none print:border-0 print:shadow-none">
          <div className="border-b border-slate-200/70 bg-gradient-to-r from-[var(--brand-navy)] via-[var(--brand-navy)] to-[var(--brand-cyan)] px-8 py-8 text-white print:bg-none print:text-slate-900">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-md rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl print:border-slate-200 print:bg-slate-50">
                <BrandLogo />
              </div>
              <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-5 backdrop-blur-xl print:border-slate-200 print:bg-white">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-white/70 print:text-slate-400">Statement Summary</p>
                <div className="mt-3 space-y-2 text-sm leading-6 text-white/90 print:text-slate-700">
                  <p><strong>Contract:</strong> {contract.contractRef}</p>
                  <p><strong>Customer:</strong> {contract.customer?.fullName}</p>
                  <p><strong>Weekly Amount:</strong> USD {contract.weeklyInstallment.toFixed(2)}</p>
                  <p><strong>Next Due:</strong> {nextDue ? `${formatDate(nextDue.dueDate)} · USD ${(nextDue.amountDue - nextDue.amountPaid).toFixed(2)}` : 'No remaining installments'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-10 print:p-0">
          <div className="grid gap-8 md:grid-cols-2">
            {[false, true].map((isOfficeCopy) => (
              <section
                key={String(isOfficeCopy)}
                className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/70 shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
              >
                <div className="border-b border-slate-200/70 px-6 py-5">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[var(--brand-cyan)]">
                    StarConnect Africa {isOfficeCopy ? '· Office Copy' : '· Customer Copy'}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-slate-900">8-Week Payment Tracking Card</h2>
                </div>

                <div className="grid gap-3 border-b border-slate-200/70 px-6 py-5 text-sm text-slate-700 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-slate-400">Customer</p>
                    <p className="mt-1 font-semibold text-slate-900">{contract.customer?.fullName}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-slate-400">Contract</p>
                    <p className="mt-1 font-semibold text-slate-900">{contract.contractRef}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-slate-400">Weekly Amount</p>
                    <p className="mt-1 font-semibold text-slate-900">USD {contract.weeklyInstallment.toFixed(2)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-slate-400">EcoCash Number</p>
                    <p className="mt-1 font-semibold text-slate-900">{contract.customer?.phonePrimary || contract.customer?.whatsappNumber || 'N/A'}</p>
                  </div>
                </div>

                <div className="px-6 py-5">
                <table className="w-full overflow-hidden rounded-2xl border border-slate-200/80 text-sm">
                  <thead className="bg-slate-100/90">
                    <tr>
                      {['Week', 'Due Date', 'Date Paid', 'Receipt #', 'Staff Init.'].map((heading) => (
                        <th key={heading} className="border-b border-slate-200 px-3 py-3 text-left text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((item) => {
                      const payment = paymentByScheduleId.get(item._id);

                      return (
                        <tr key={`${isOfficeCopy ? 'office' : 'customer'}-${item._id}`} className="border-b border-slate-100 last:border-b-0">
                          <td className="px-3 py-3 font-semibold text-slate-900">{item.weekNumber}</td>
                          <td className="px-3 py-3 text-slate-600">{formatDate(item.dueDate)}</td>
                          <td className="px-3 py-3 text-slate-600">{formatDate(item.paidAt)}</td>
                          <td className="px-3 py-3 text-slate-600">{item.paymentReference || payment?.receiptNumber || '—'}</td>
                          <td className="px-3 py-3 text-slate-600">{isOfficeCopy ? getInitials(payment?.receivedBy?.name) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>

                <div className="grid gap-3 border-t border-slate-200/70 bg-white/70 px-6 py-5 text-sm text-slate-700">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Payment Complete</p>
                      <p className="mt-1 font-semibold text-slate-900">{paymentComplete ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Certificate</p>
                      <p className="mt-1 font-semibold text-slate-900">{contract.status === 'Completed' ? 'Pending' : 'No'}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Date</p>
                      <p className="mt-1 font-semibold text-slate-900">{formatDate(contract.completedAt)}</p>
                    </div>
                  </div>
                  {!isOfficeCopy ? (
                    <div className="rounded-2xl border border-[var(--brand-cyan)]/18 bg-[rgba(21,169,231,0.06)] px-4 py-4">
                      <p className="font-semibold tracking-[-0.02em] text-slate-900">Payment Instructions</p>
                      <p className="mt-2">EcoCash: *151*2*1*[MERCHANT CODE]*[AMOUNT]*[{contract.contractRef}]#</p>
                      <p className="mt-1">Next Due: {nextDue ? `${formatDate(nextDue.dueDate)} (USD ${(nextDue.amountDue - nextDue.amountPaid).toFixed(2)})` : 'No remaining installments'}</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4">
                      <p><strong>Staff:</strong> ____________________</p>
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
