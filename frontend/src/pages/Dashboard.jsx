import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-gray-500 text-sm mb-8">Welcome back, {user?.name}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Contracts', value: '—', color: 'blue' },
          { label: 'Pending Applications', value: '—', color: 'yellow' },
          { label: 'Payments This Month', value: '—', color: 'green' },
          { label: 'Accounts in Arrears', value: '—', color: 'red' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-3xl font-bold mt-1 text-${color}-600`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-700">
        Module 1 (Auth &amp; User Management) is live. More modules coming soon.
      </div>
    </div>
  );
}
