const variants = {
  Active: 'bg-green-100 text-green-700',
  Inactive: 'bg-red-100 text-red-700',
  Admin: 'bg-purple-100 text-purple-700',
  Agent: 'bg-blue-100 text-blue-700',
  Technician: 'bg-yellow-100 text-yellow-700',
  'Collections Officer': 'bg-orange-100 text-orange-700',
};

export default function Badge({ label }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[label] || 'bg-gray-100 text-gray-700'}`}>
      {label}
    </span>
  );
}
