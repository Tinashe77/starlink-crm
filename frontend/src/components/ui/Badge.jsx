const variants = {
  // User statuses
  Active: 'bg-green-100 text-green-700',
  Inactive: 'bg-red-100 text-red-700',
  // User roles
  Admin: 'bg-purple-100 text-purple-700',
  Agent: 'bg-blue-100 text-blue-700',
  Technician: 'bg-yellow-100 text-yellow-700',
  'Collections Officer': 'bg-orange-100 text-orange-700',
  Customer: 'bg-teal-100 text-teal-700',
  Household: 'bg-sky-100 text-sky-700',
  Business: 'bg-indigo-100 text-indigo-700',
  School: 'bg-emerald-100 text-emerald-700',
  // Application statuses
  Draft: 'bg-gray-100 text-gray-600',
  Submitted: 'bg-blue-100 text-blue-700',
  'Under Review': 'bg-yellow-100 text-yellow-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  'Pending Deposit': 'bg-amber-100 text-amber-700',
  Pending: 'bg-slate-100 text-slate-700',
  Open: 'bg-slate-100 text-slate-700',
  Assigned: 'bg-blue-100 text-blue-700',
  Scheduled: 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-indigo-100 text-indigo-700',
  Installed: 'bg-emerald-100 text-emerald-700',
  'Revisit Required': 'bg-orange-100 text-orange-700',
  Failed: 'bg-red-100 text-red-700',
  Resolved: 'bg-emerald-100 text-emerald-700',
  Closed: 'bg-slate-200 text-slate-700',
  Paid: 'bg-green-100 text-green-700',
  Captured: 'bg-blue-100 text-blue-700',
  Voided: 'bg-red-100 text-red-700',
  Late: 'bg-yellow-100 text-yellow-700',
  Defaulted: 'bg-rose-100 text-rose-700',
  'In Arrears': 'bg-orange-100 text-orange-700',
  Default: 'bg-rose-100 text-rose-700',
  Completed: 'bg-emerald-100 text-emerald-700',
};

export default function Badge({ label }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-white/70 px-3 py-1 text-[0.72rem] font-semibold shadow-[0_8px_18px_rgba(15,23,42,0.05)] ${
        variants[label] || 'bg-gray-100 text-gray-700'
      }`}
    >
      {label}
    </span>
  );
}
