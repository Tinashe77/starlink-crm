import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import { getPaymentStatement } from '../api/payments';

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
    <div className="bg-gray-100 min-h-full">
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{contract.contractRef}</h1>
          <p className="text-sm text-gray-500">8-Week Payment Tracking Card</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/payment-plans" className="text-sm text-gray-600 hover:text-gray-900">Back</Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
          >
            <Download size={16} /> Download / Print
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 print:p-0">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 print:shadow-none print:border-0 p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-10">
            {[false, true].map((isOfficeCopy) => (
              <section key={String(isOfficeCopy)} className="border border-gray-200 rounded-xl p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">URIMBO TECHNOLOGIES (PVT) LTD{isOfficeCopy ? ' - OFFICE COPY' : ''}</p>
                <h2 className="text-xl font-bold text-gray-900 mt-2">8-WEEK PAYMENT TRACKING CARD</h2>

                <div className="mt-5 space-y-2 text-sm text-gray-700">
                  <p><strong>Customer Name:</strong> {contract.customer?.fullName}</p>
                  <p><strong>Contract Reference:</strong> {contract.contractRef}</p>
                  <p><strong>Weekly Amount:</strong> USD {contract.weeklyInstallment.toFixed(2)}</p>
                  <p><strong>EcoCash Number:</strong> {contract.customer?.phonePrimary || contract.customer?.whatsappNumber || 'N/A'}</p>
                </div>

                <table className="w-full text-sm mt-5 border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Week', 'Due Date', 'Date Paid', 'Receipt #', 'Staff Init.'].map((heading) => (
                        <th key={heading} className="text-left px-2 py-2 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((item) => {
                      const payment = paymentByScheduleId.get(item._id);

                      return (
                        <tr key={`${isOfficeCopy ? 'office' : 'customer'}-${item._id}`} className="border-b border-gray-100">
                          <td className="px-2 py-2">{item.weekNumber}</td>
                          <td className="px-2 py-2">{formatDate(item.dueDate)}</td>
                          <td className="px-2 py-2">{formatDate(item.paidAt)}</td>
                          <td className="px-2 py-2">{item.paymentReference || payment?.receiptNumber || '—'}</td>
                          <td className="px-2 py-2">{isOfficeCopy ? getInitials(payment?.receivedBy?.name) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="mt-4 text-sm text-gray-700 space-y-1">
                  <p><strong>Payment Complete:</strong> {paymentComplete ? 'Yes' : 'No'}</p>
                  <p><strong>Certificate Issued:</strong> {contract.status === 'Completed' ? 'Pending' : 'No'}</p>
                  <p><strong>Date:</strong> {formatDate(contract.completedAt)}</p>
                  {!isOfficeCopy ? (
                    <>
                      <p className="pt-3 font-semibold text-gray-900">PAYMENT INSTRUCTIONS</p>
                      <p>EcoCash: *151*2*1*[MERCHANT CODE]*[AMOUNT]*[{contract.contractRef}]#</p>
                      <p>Next Due: {nextDue ? `${formatDate(nextDue.dueDate)} (USD ${(nextDue.amountDue - nextDue.amountPaid).toFixed(2)})` : 'No remaining installments'}</p>
                    </>
                  ) : (
                    <p><strong>Staff:</strong> ____________________</p>
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
