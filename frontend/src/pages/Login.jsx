import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../api/auth';
import toast from 'react-hot-toast';
import { ArrowRight, KeyRound, Mail } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import AuthShell from '../components/AuthShell';

const inputClassName =
  'w-full rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3.5 text-sm text-slate-900 shadow-[0_12px_24px_rgba(15,23,42,0.05)] outline-none transition focus:border-[var(--brand-cyan)]/40 focus:ring-4 focus:ring-[rgba(21,169,231,0.12)]';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await login(form);
      loginUser(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Secure Access"
      title="Sign in to continue"
      subtitle="Access customer records, contracts, and collections from one secure StarConnect workspace."
      sideTitle="A cleaner way to run customer operations."
      sideCopy="Track approvals, generate contracts, capture payments, and manage collections in one connected portal designed around the StarConnect Africa brand."
      highlights={[
        'Protected staff and customer access',
        'Automated collections reminders',
        'Digital contracts and payment tracking',
      ]}
      footer={(
        <p className="text-center text-sm text-slate-500">
          New customer?{' '}
          <Link to="/register" className="font-semibold text-[var(--brand-navy)] transition hover:text-[var(--brand-cyan)]">
            Create an account
          </Link>
        </p>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Email address</label>
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

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label className="block text-sm font-semibold text-slate-700">Password</label>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-cyan)] transition hover:text-[var(--brand-navy)]"
            >
              Forgot password
            </Link>
          </div>
          <div className="relative">
            <KeyRound
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={`${inputClassName} pl-11`}
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--brand-navy)] to-[var(--brand-cyan)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_32px_rgba(23,63,143,0.22)] transition hover:translate-y-[-1px] hover:shadow-[0_20px_34px_rgba(23,63,143,0.25)] disabled:opacity-60"
        >
          {loading ? <Spinner size="sm" /> : <ArrowRight size={16} />}
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  );
}
