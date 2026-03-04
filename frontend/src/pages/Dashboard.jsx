import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileSignature,
  Wallet,
} from 'lucide-react';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import { getCustomerApplications } from '../api/customerApplications';
import { getContracts } from '../api/contracts';
import { getPaymentPlans } from '../api/paymentPlans';
import { getPayments } from '../api/payments';
import { getCollectionsOverview } from '../api/collections';
import { getInstallations } from '../api/installations';

const STAFF_COLLECTIONS_ROLES = ['Admin', 'Agent', 'Collections Officer'];
const CUSTOMER_ROLE = 'Customer';

const formatMoney = (value) => `USD ${Number(value || 0).toFixed(2)}`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : 'Not scheduled');

function StatCard({ label, value, detail, icon: Icon, tone = 'blue' }) {
  const tones = {
    blue: 'from-[var(--brand-cyan)]/18 to-white text-[var(--brand-cyan)]',
    green: 'from-[var(--brand-green)]/18 to-white text-[var(--brand-green)]',
    red: 'from-[var(--brand-red)]/14 to-white text-[var(--brand-red)]',
    gold: 'from-[var(--brand-gold)]/20 to-white text-[var(--brand-gold)]',
    navy: 'from-[var(--brand-navy)]/14 to-white text-[var(--brand-navy)]',
  };

  return (
    <div className={`rounded-[1.6rem] border border-white/70 bg-gradient-to-br ${tones[tone]} p-5 shadow-[0_20px_40px_rgba(15,23,42,0.06)]`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-900">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/85 shadow-sm">
          <Icon size={22} />
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}

function SectionCard({ eyebrow, title, action, children }) {
  return (
    <section className="rounded-[1.8rem] border border-slate-200/70 bg-white/85 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-slate-400">
              {eyebrow}
            </p>
          ) : null}
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-slate-900">{title}</h3>
        </div>
        {action || null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ListRow({ title, meta, badge, emphasis = false }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3">
      <div className="min-w-0">
        <p className={`truncate text-sm ${emphasis ? 'font-semibold text-slate-900' : 'font-medium text-slate-800'}`}>
          {title}
        </p>
        {meta ? <p className="mt-1 text-xs leading-5 text-slate-500">{meta}</p> : null}
      </div>
      {badge || null}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applications, setApplications] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [collections, setCollections] = useState(null);
  const [installations, setInstallations] = useState([]);

  const isCustomer = user?.role === CUSTOMER_ROLE;
  const isTechnician = user?.role === 'Technician';
  const canSeeCollections = STAFF_COLLECTIONS_ROLES.includes(user?.role);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        if (isTechnician) {
          const installationsRes = await getInstallations();
          setApplications([]);
          setContracts([]);
          setScheduleItems([]);
          setPayments([]);
          setCollections(null);
          setInstallations(installationsRes.data);
          return;
        }

        const [
          applicationsRes,
          contractsRes,
          scheduleRes,
          paymentsRes,
          collectionsRes,
        ] = await Promise.all([
          getCustomerApplications(),
          getContracts(),
          getPaymentPlans(),
          getPayments(),
          canSeeCollections ? getCollectionsOverview() : Promise.resolve(null),
        ]);

        setApplications(applicationsRes.data);
        setContracts(contractsRes.data);
        setScheduleItems(scheduleRes.data);
        setPayments(paymentsRes.data);
        setCollections(collectionsRes?.data || null);
        setInstallations([]);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [canSeeCollections, isTechnician]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-8">
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  const pendingApplications = applications.filter((item) => item.status !== 'Approved' && item.status !== 'Rejected');
  const approvedApplications = applications.filter((item) => item.status === 'Approved');
  const activeContracts = contracts.filter((item) => item.status === 'Active');
  const pendingDepositContracts = contracts.filter((item) => item.status === 'Pending Deposit');
  const completedContracts = contracts.filter((item) => item.status === 'Completed');
  const unpaidSchedule = scheduleItems
    .filter((item) => item.status !== 'Paid')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const nextDueItem = unpaidSchedule[0] || null;
  const dueTodayItems = scheduleItems.filter((item) => {
    const due = new Date(item.dueDate);
    const now = new Date();
    return (
      item.status !== 'Paid' &&
      due.getFullYear() === now.getFullYear() &&
      due.getMonth() === now.getMonth() &&
      due.getDate() === now.getDate()
    );
  });
  const outstandingTotal = contracts.reduce((sum, item) => sum + Number(item.outstandingBalance || 0), 0);
  const totalReceived = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
    .slice(0, 5);
  const technicianAssigned = installations;
  const technicianScheduled = technicianAssigned.filter((item) => item.status === 'Scheduled');
  const technicianInProgress = technicianAssigned.filter((item) => item.status === 'In Progress');
  const technicianRevisits = technicianAssigned.filter((item) => item.status === 'Revisit Required');
  const technicianCompleted = technicianAssigned.filter((item) => item.status === 'Installed');
  const technicianNextJob = [...technicianAssigned]
    .filter((item) => item.scheduledFor)
    .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor))[0] || null;

  const customerStats = [
    {
      label: 'My Applications',
      value: applications.length,
      detail: pendingApplications.length
        ? `${pendingApplications.length} still in progress`
        : 'No pending application reviews',
      icon: ClipboardList,
      tone: 'blue',
    },
    {
      label: 'My Contracts',
      value: contracts.length,
      detail: activeContracts.length
        ? `${activeContracts.length} currently active`
        : completedContracts.length
          ? `${completedContracts.length} completed`
          : 'No active contracts yet',
      icon: FileSignature,
      tone: 'green',
    },
    {
      label: 'Outstanding Balance',
      value: formatMoney(outstandingTotal),
      detail: nextDueItem
        ? `Next due ${formatDate(nextDueItem.dueDate)}`
        : 'No upcoming balance due',
      icon: Wallet,
      tone: 'gold',
    },
    {
      label: 'Payments Recorded',
      value: payments.length,
      detail: payments.length ? `${formatMoney(totalReceived)} captured` : 'No payments recorded yet',
      icon: CreditCard,
      tone: 'navy',
    },
  ];

  const staffStats = [
    {
      label: 'Pending Applications',
      value: pendingApplications.length,
      detail: approvedApplications.length
        ? `${approvedApplications.length} already approved`
        : 'No approvals completed yet',
      icon: ClipboardList,
      tone: 'blue',
    },
    {
      label: 'Active Contracts',
      value: activeContracts.length,
      detail: pendingDepositContracts.length
        ? `${pendingDepositContracts.length} awaiting deposit`
        : 'No contracts waiting on deposit',
      icon: FileSignature,
      tone: 'green',
    },
    {
      label: 'Due Today',
      value: dueTodayItems.length,
      detail: dueTodayItems.length
        ? `${formatMoney(dueTodayItems.reduce((sum, item) => sum + (item.amountDue - item.amountPaid), 0))} due today`
        : 'No installments due today',
      icon: CalendarClock,
      tone: 'gold',
    },
    {
      label: 'Payments Captured',
      value: payments.length,
      detail: payments.length ? `${formatMoney(totalReceived)} received` : 'No payments captured yet',
      icon: Wallet,
      tone: 'navy',
    },
  ];

  if (canSeeCollections && collections?.metrics) {
    staffStats[2] = {
      label: 'Due Today',
      value: collections.metrics.dueTodayCount,
      detail: collections.metrics.dueTodayCount
        ? `${formatMoney(collections.metrics.dueTodayAmount)} due today`
        : 'No installments due today',
      icon: CalendarClock,
      tone: 'gold',
    };
    staffStats.push({
      label: 'Default Risk',
      value: collections.metrics.defaultRiskCount,
      detail: collections.metrics.overdueCount
        ? `${collections.metrics.overdueCount} overdue installments in queue`
        : 'No accounts currently at risk',
      icon: AlertTriangle,
      tone: 'red',
    });
  }

  const technicianStats = [
    {
      label: 'Assigned Jobs',
      value: technicianAssigned.length,
      detail: technicianAssigned.length ? 'Installation jobs assigned to you' : 'No jobs assigned yet',
      icon: ClipboardList,
      tone: 'blue',
    },
    {
      label: 'Scheduled',
      value: technicianScheduled.length,
      detail: technicianScheduled.length ? 'Ready for upcoming visits' : 'No scheduled visits',
      icon: CalendarClock,
      tone: 'gold',
    },
    {
      label: 'In Progress',
      value: technicianInProgress.length,
      detail: technicianInProgress.length ? 'Jobs currently underway' : 'No active site work',
      icon: Activity,
      tone: 'green',
    },
    {
      label: 'Revisits',
      value: technicianRevisits.length,
      detail: technicianRevisits.length ? 'Jobs needing a follow-up visit' : 'No revisit backlog',
      icon: AlertTriangle,
      tone: 'red',
    },
    {
      label: 'Installed',
      value: technicianCompleted.length,
      detail: technicianCompleted.length ? 'Jobs marked installed' : 'No completed installs yet',
      icon: CheckCircle2,
      tone: 'navy',
    },
  ];

  const headerCopy = isCustomer
    ? 'Track your application progress, contract status, upcoming payments, and recent activity from one place.'
    : isTechnician
      ? 'Review your assigned installation jobs, upcoming visits, and revisit work from one operational view.'
      : 'Monitor the application pipeline, contracts, payments, and operational priorities that need attention today.';

  return (
    <div className="p-6 md:p-8">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-[var(--brand-navy)] via-[var(--brand-navy)] to-[var(--brand-cyan)] px-6 py-6 text-white shadow-[0_24px_60px_rgba(21,169,231,0.18)]">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr] lg:items-center">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.42em] text-white/70">
              {isCustomer ? 'My Overview' : 'Operations Overview'}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] md:text-4xl">
              Welcome back, {user?.name}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/78 md:text-base">
              {headerCopy}
            </p>
          </div>

          <div className="rounded-[1.6rem] border border-white/15 bg-white/10 p-5 backdrop-blur-xl">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-white/65">At a Glance</p>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                <span className="text-sm text-white/80">Access Level</span>
                <span className="text-sm font-semibold">{user?.role}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                <span className="text-sm text-white/80">Next Due</span>
                <span className="text-sm font-semibold">
                  {nextDueItem ? formatDate(nextDueItem.dueDate) : 'No balance due'}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                <span className="text-sm text-white/80">Current Focus</span>
                <span className="text-sm font-semibold">
                  {isCustomer
                    ? nextDueItem
                      ? 'Stay current on payments'
                      : 'Account up to date'
                    : isTechnician
                      ? technicianNextJob
                        ? 'Prepare for next site visit'
                        : 'Await new assignment'
                    : pendingApplications.length
                      ? 'Review pending applications'
                      : 'Monitor operations'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className={`mt-6 grid grid-cols-1 gap-4 ${
        isCustomer ? 'xl:grid-cols-4' : isTechnician ? 'xl:grid-cols-5' : staffStats.length > 4 ? 'xl:grid-cols-5' : 'xl:grid-cols-4'
      }`}>
        {(isCustomer ? customerStats : isTechnician ? technicianStats : staffStats).map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </div>

      {isCustomer ? (
        <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <SectionCard eyebrow="Next Step" title="What You Should Do Next">
            {nextDueItem ? (
              <div className="space-y-3">
                <ListRow
                  title={`Week ${nextDueItem.weekNumber} payment due`}
                  meta={`${formatMoney(nextDueItem.amountDue - nextDueItem.amountPaid)} remaining · ${formatDate(nextDueItem.dueDate)}`}
                  badge={<Badge label={nextDueItem.status} />}
                  emphasis
                />
                <ListRow
                  title="Check your latest statement"
                  meta="Open the Payment Plans or Contracts area to review your live schedule and statement."
                />
                <ListRow
                  title="Need support?"
                  meta="Use the contact details on your contract or reach out to the StarConnect team for payment assistance."
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--brand-green)]/18 bg-[rgba(26,182,108,0.08)] px-4 py-4 text-sm leading-7 text-slate-700">
                You do not currently have an unpaid installment. Your account appears up to date.
              </div>
            )}
          </SectionCard>

          <SectionCard eyebrow="Recent Activity" title="My Recent Payments">
            {recentPayments.length > 0 ? (
              <div className="space-y-3">
                {recentPayments.map((payment) => (
                  <ListRow
                    key={payment._id}
                    title={payment.receiptNumber}
                    meta={`${formatMoney(payment.amount)} · ${formatDate(payment.paymentDate)} · ${payment.contract?.contractRef || 'Contract payment'}`}
                    badge={<Badge label={payment.status || 'Captured'} />}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-4 text-sm text-slate-500">
                No payment activity has been recorded yet.
              </div>
            )}
          </SectionCard>

          <SectionCard eyebrow="My Applications" title="Application Progress">
            {applications.length > 0 ? (
              <div className="space-y-3">
                {applications.slice(0, 4).map((application) => (
                  <ListRow
                    key={application._id}
                    title={application.applicationNumber}
                    meta={`${application.fullName} · ${application.packageName}`}
                    badge={<Badge label={application.status} />}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-4 text-sm text-slate-500">
                You have not submitted an application yet.
              </div>
            )}
          </SectionCard>

          <SectionCard
            eyebrow="Contract Status"
            title="My Contracts"
            action={<ArrowUpRight className="text-[var(--brand-cyan)]" size={20} />}
          >
            {contracts.length > 0 ? (
              <div className="space-y-3">
                {contracts.slice(0, 4).map((contract) => (
                  <ListRow
                    key={contract._id}
                    title={contract.contractRef}
                    meta={`${contract.package?.name || 'Package'} · Outstanding ${formatMoney(contract.outstandingBalance)}`}
                    badge={<Badge label={contract.status} />}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-4 text-sm text-slate-500">
                No contracts are available on your account yet.
              </div>
            )}
          </SectionCard>
        </div>
      ) : isTechnician ? (
        <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <SectionCard
            eyebrow="Assigned Work"
            title="My Installation Queue"
            action={<Activity className="text-[var(--brand-cyan)]" size={20} />}
          >
            {technicianAssigned.length > 0 ? (
              <div className="space-y-3">
                {technicianAssigned.slice(0, 6).map((job) => (
                  <ListRow
                    key={job._id}
                    title={`${job.jobNumber} · ${job.contract?.customer?.fullName || 'Customer'}`}
                    meta={`${job.contract?.contractRef || 'Contract'} · ${job.scheduledFor ? formatDate(job.scheduledFor) : 'Not scheduled'} · ${job.contract?.package?.name || 'Package'}`}
                    badge={<Badge label={job.status} />}
                    emphasis={job.status === 'In Progress' || job.status === 'Revisit Required'}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-4 text-sm text-slate-500">
                No installation jobs are currently assigned to you.
              </div>
            )}
          </SectionCard>

          <SectionCard eyebrow="Next Visit" title="Upcoming Site Work">
            {technicianNextJob ? (
              <div className="space-y-3">
                <ListRow
                  title={technicianNextJob.jobNumber}
                  meta={`${technicianNextJob.contract?.customer?.fullName || 'Customer'} · ${technicianNextJob.contract?.contractRef}`}
                  badge={<Badge label={technicianNextJob.status} />}
                  emphasis
                />
                <ListRow
                  title="Scheduled time"
                  meta={new Date(technicianNextJob.scheduledFor).toLocaleString()}
                />
                <ListRow
                  title="Package"
                  meta={technicianNextJob.contract?.package?.name || 'No package information'}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--brand-green)]/18 bg-[rgba(26,182,108,0.08)] px-4 py-4 text-sm leading-7 text-slate-700">
                You do not have a scheduled installation visit yet.
              </div>
            )}
          </SectionCard>

          <SectionCard eyebrow="Checklist Focus" title="What Needs Attention">
            <div className="grid gap-3 md:grid-cols-2">
              <ListRow
                title="In-progress jobs"
                meta="Complete checklists, signal optimization, and testing"
                badge={<span className="text-sm font-semibold text-slate-900">{technicianInProgress.length}</span>}
              />
              <ListRow
                title="Revisit required"
                meta="Jobs that need a return trip or unresolved issue"
                badge={<span className="text-sm font-semibold text-slate-900">{technicianRevisits.length}</span>}
              />
              <ListRow
                title="Customer handovers"
                meta={`${technicianAssigned.filter((job) => !job.customerHandoverConfirmed).length} jobs still need final handover confirmation`}
                badge={<span className="text-sm font-semibold text-slate-900">{technicianAssigned.filter((job) => !job.customerHandoverConfirmed).length}</span>}
              />
              <ListRow
                title="Proof of installation"
                meta={`${technicianAssigned.filter((job) => !job.proofOfInstallationUrl).length} jobs missing proof links`}
                badge={<span className="text-sm font-semibold text-slate-900">{technicianAssigned.filter((job) => !job.proofOfInstallationUrl).length}</span>}
              />
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Technician Access"
            title="What You Can Do"
            action={<ArrowUpRight className="text-[var(--brand-cyan)]" size={20} />}
          >
            <div className="space-y-3">
              {[
                'Open Installations to view only the jobs assigned to you',
                'Move assigned jobs through Scheduled, In Progress, Installed, Revisit Required, or Failed',
                'Complete the installation checklist and handover details',
                'Add proof-of-installation links and field notes',
              ].map((item) => (
                <ListRow key={item} title={item} />
              ))}
            </div>
          </SectionCard>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <SectionCard
            eyebrow="Today’s Focus"
            title="Priority Queue"
            action={<Activity className="text-[var(--brand-cyan)]" size={20} />}
          >
            <div className="space-y-3">
              {pendingApplications.slice(0, 3).map((application) => (
                <ListRow
                  key={application._id}
                  title={`${application.applicationNumber} requires review`}
                  meta={`${application.fullName} · ${application.packageName}`}
                  badge={<Badge label={application.status} />}
                  emphasis
                />
              ))}

              {pendingDepositContracts.slice(0, 2).map((contract) => (
                <ListRow
                  key={contract._id}
                  title={`${contract.contractRef} awaiting deposit`}
                  meta={`${contract.customer?.fullName || 'Customer'} · Deposit ${formatMoney(contract.depositAmount)}`}
                  badge={<Badge label={contract.status} />}
                />
              ))}

              {canSeeCollections && collections?.collectionsQueue?.slice(0, 3)?.map((item) => (
                <ListRow
                  key={item._id}
                  title={`${item.contract?.contractRef} in collections queue`}
                  meta={`${item.contract?.customer?.fullName || 'Customer'} · ${formatMoney(item.remaining)} remaining · due ${formatDate(item.dueDate)}`}
                  badge={<Badge label={item.status} />}
                />
              ))}

              {pendingApplications.length === 0 && pendingDepositContracts.length === 0 && (!collections?.collectionsQueue?.length) ? (
                <div className="rounded-2xl border border-[var(--brand-green)]/18 bg-[rgba(26,182,108,0.08)] px-4 py-4 text-sm leading-7 text-slate-700">
                  No urgent operational blockers are showing right now.
                </div>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard eyebrow="Cash Flow" title="Recent Payment Activity">
            {recentPayments.length > 0 ? (
              <div className="space-y-3">
                {recentPayments.map((payment) => (
                  <ListRow
                    key={payment._id}
                    title={payment.receiptNumber}
                    meta={`${payment.contract?.contractRef || 'Contract'} · ${payment.contract?.customer?.fullName || 'Customer'} · ${formatDate(payment.paymentDate)}`}
                    badge={<span className="text-sm font-semibold text-slate-900">{formatMoney(payment.amount)}</span>}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-4 text-sm text-slate-500">
                No payments have been captured yet.
              </div>
            )}
          </SectionCard>

          <SectionCard eyebrow="Pipeline" title="Application and Contract Snapshot">
            <div className="grid gap-3 md:grid-cols-2">
              <ListRow
                title="Applications awaiting action"
                meta={`${pendingApplications.length} still in the review pipeline`}
                badge={<span className="text-sm font-semibold text-slate-900">{pendingApplications.length}</span>}
              />
              <ListRow
                title="Approved applications"
                meta="Ready for or already converted into contracts"
                badge={<span className="text-sm font-semibold text-slate-900">{approvedApplications.length}</span>}
              />
              <ListRow
                title="Contracts with payment plans"
                meta={`${contracts.filter((item) => item.paymentPlanReady).length} already scheduled`}
                badge={<span className="text-sm font-semibold text-slate-900">{contracts.filter((item) => item.paymentPlanReady).length}</span>}
              />
              <ListRow
                title="Completed contracts"
                meta="Fully paid and closed financially"
                badge={<span className="text-sm font-semibold text-slate-900">{completedContracts.length}</span>}
              />
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Collections Signals"
            title={canSeeCollections ? 'Receivables and Risk' : 'Operational Signals'}
            action={<ArrowUpRight className="text-[var(--brand-cyan)]" size={20} />}
          >
            {canSeeCollections && collections?.metrics ? (
              <div className="grid gap-3 md:grid-cols-2">
                <ListRow
                  title="Overdue receivables"
                  meta={`${collections.metrics.overdueCount} overdue installments`}
                  badge={<span className="text-sm font-semibold text-slate-900">{formatMoney(collections.metrics.overdueAmount)}</span>}
                />
                <ListRow
                  title="Payments this month"
                  meta={`${collections.metrics.paymentsThisMonthCount} captured transactions`}
                  badge={<span className="text-sm font-semibold text-slate-900">{formatMoney(collections.metrics.paymentsThisMonth)}</span>}
                />
                <ListRow
                  title="Default risk"
                  meta="Accounts beyond the grace period threshold"
                  badge={<span className="text-sm font-semibold text-slate-900">{collections.metrics.defaultRiskCount}</span>}
                />
                <ListRow
                  title="Projected late fees"
                  meta="Current exposure based on risk queue"
                  badge={<span className="text-sm font-semibold text-slate-900">{formatMoney(collections.metrics.projectedLateFees)}</span>}
                />
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                <ListRow
                  title="Contracts awaiting activation"
                  meta={`${pendingDepositContracts.length} still pending deposit`}
                  badge={<span className="text-sm font-semibold text-slate-900">{pendingDepositContracts.length}</span>}
                />
                <ListRow
                  title="Open installments"
                  meta={`${unpaidSchedule.length} unpaid schedule rows across live contracts`}
                  badge={<span className="text-sm font-semibold text-slate-900">{unpaidSchedule.length}</span>}
                />
              </div>
            )}
          </SectionCard>
        </div>
      )}

      <div className="mt-6 rounded-[1.8rem] border border-slate-200/70 bg-white/85 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="text-[var(--brand-green)]" size={20} />
          <h3 className="text-lg font-semibold tracking-[-0.04em] text-slate-900">
            {isCustomer ? 'Dashboard Logic' : 'Operational Summary'}
          </h3>
        </div>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          {isCustomer
            ? 'This dashboard is personalized to your account only. It summarizes your own applications, contracts, payment plan, and recorded payments.'
            : isTechnician
              ? 'This dashboard is scoped to technician work only. It highlights the installation jobs assigned to your account and the field tasks that still need action.'
            : 'This dashboard combines application, contract, payment-plan, payment, and collections data so staff can see where work is blocked and where money is due.'}
        </p>
      </div>
    </div>
  );
}
