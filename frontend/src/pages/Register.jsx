import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register } from '../api/auth';
import toast from 'react-hot-toast';
import { ArrowRight, KeyRound, Mail, Phone, User } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import AuthShell from '../components/AuthShell';

const inputClassName =
  'w-full rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3.5 text-sm text-slate-900 shadow-[0_12px_24px_rgba(15,23,42,0.05)] outline-none transition focus:border-[var(--brand-cyan)]/40 focus:ring-4 focus:ring-[rgba(21,169,231,0.12)]';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const { data } = await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      loginUser(data.token, data.user);
      toast.success('Account created! Welcome to StarConnect.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Customer Access"
      title="Create your account"
      subtitle="Register once to view contracts, track payments, and stay on top of your StarConnect account."
      sideTitle="Customer onboarding without friction."
      sideCopy="The portal gives customers direct visibility into contracts, signed documents, payment schedules, and reminders while your team manages the rest in one place."
      highlights={[
        'Self-service customer access',
        'Digital contract signing and download',
        'Live payment plan visibility',
      ]}
      footer={(
        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[var(--brand-navy)] transition hover:text-[var(--brand-cyan)]">
            Sign in
          </Link>
        </p>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-700">Full name *</label>
            <div className="relative">
              <User
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`${inputClassName} pl-11`}
                placeholder="John Doe"
              />
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-700">Email address *</label>
            <div className="relative">
              <Mail
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`${inputClassName} pl-11`}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-700">Mobile number</label>
            <div className="relative">
              <Phone
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={`${inputClassName} pl-11`}
                placeholder="+263 77 000 0000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Password *</label>
            <div className="relative">
              <KeyRound
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={`${inputClassName} pl-11`}
                placeholder="Min 8 characters"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Confirm password *</label>
            <div className="relative">
              <KeyRound
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="password"
                required
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                className={`${inputClassName} pl-11`}
                placeholder="••••••••"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--brand-navy)] to-[var(--brand-cyan)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_32px_rgba(23,63,143,0.22)] transition hover:translate-y-[-1px] hover:shadow-[0_20px_34px_rgba(23,63,143,0.25)] disabled:opacity-60"
        >
          {loading ? <Spinner size="sm" /> : <ArrowRight size={16} />}
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}
