import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarClock, ClipboardCheck, Pencil, Plus, Wrench } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import {
  createInstallation,
  getInstallationOptions,
  getInstallations,
  updateInstallation,
} from '../api/installations';

const INSTALLATION_STATUSES = ['Pending', 'Scheduled', 'In Progress', 'Installed', 'Revisit Required', 'Failed'];

const emptyCreateForm = {
  contract: '',
  assignedTechnician: '',
  scheduledFor: '',
  status: 'Scheduled',
  installationNotes: '',
  closureNotes: '',
};

const emptyEditForm = {
  assignedTechnician: '',
  scheduledFor: '',
  status: 'Pending',
  revisitReason: '',
  failureReason: '',
  dishInstalled: false,
  routerInstalled: false,
  signalOptimized: false,
  connectivityTestPassed: false,
  customerTrainingCompleted: false,
  installationNotes: '',
  proofOfInstallationUrl: '',
  customerHandoverConfirmed: false,
  closureNotes: '',
  certificateIssued: false,
};

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      {children}
    </label>
  );
}

function CheckboxField({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <span>{label}</span>
    </label>
  );
}

const inputClassName =
  'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function Installations() {
  const { user } = useAuth();
  const canCreate = ['Admin', 'Agent'].includes(user?.role);
  const canEdit = ['Admin', 'Agent', 'Technician'].includes(user?.role);
  const canAssign = ['Admin', 'Agent'].includes(user?.role);
  const canIssueCertificate = ['Admin', 'Agent'].includes(user?.role);

  const [jobs, setJobs] = useState([]);
  const [options, setOptions] = useState({ technicians: [], contracts: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [selectedJob, setSelectedJob] = useState(null);

  const loadData = async () => {
    try {
      const requests = [getInstallations()];
      if (canCreate) {
        requests.push(getInstallationOptions());
      }

      const [jobsRes, optionsRes] = await Promise.all(requests);
      setJobs(jobsRes.data);
      setOptions(optionsRes?.data || { technicians: [], contracts: [] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load installations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const overview = useMemo(
    () => ({
      total: jobs.length,
      scheduled: jobs.filter((job) => job.status === 'Scheduled').length,
      inProgress: jobs.filter((job) => job.status === 'In Progress').length,
      revisit: jobs.filter((job) => job.status === 'Revisit Required').length,
      installed: jobs.filter((job) => job.status === 'Installed').length,
    }),
    [jobs]
  );

  const openCreate = () => {
    setCreateForm({
      ...emptyCreateForm,
      contract: options.contracts[0]?._id || '',
      assignedTechnician: options.technicians[0]?._id || '',
      scheduledFor: new Date().toISOString().slice(0, 16),
    });
    setCreateOpen(true);
  };

  const openEdit = (job) => {
    setSelectedJob(job);
    setEditForm({
      assignedTechnician: job.assignedTechnician?._id || '',
      scheduledFor: job.scheduledFor ? new Date(job.scheduledFor).toISOString().slice(0, 16) : '',
      status: job.status,
      revisitReason: job.revisitReason || '',
      failureReason: job.failureReason || '',
      dishInstalled: Boolean(job.dishInstalled),
      routerInstalled: Boolean(job.routerInstalled),
      signalOptimized: Boolean(job.signalOptimized),
      connectivityTestPassed: Boolean(job.connectivityTestPassed),
      customerTrainingCompleted: Boolean(job.customerTrainingCompleted),
      installationNotes: job.installationNotes || '',
      proofOfInstallationUrl: job.proofOfInstallationUrl || '',
      customerHandoverConfirmed: Boolean(job.customerHandoverConfirmed),
      closureNotes: job.closureNotes || '',
      certificateIssued: Boolean(job.certificateIssued),
    });
    setEditOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createInstallation({
        ...createForm,
        scheduledFor: createForm.scheduledFor || undefined,
      });
      toast.success('Installation job created');
      setCreateOpen(false);
      setLoading(true);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create installation job');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;

    setSaving(true);
    try {
      await updateInstallation(selectedJob._id, {
        ...editForm,
        scheduledFor: editForm.scheduledFor || undefined,
        assignedTechnician: canAssign ? (editForm.assignedTechnician || '') : undefined,
        certificateIssued: canIssueCertificate ? editForm.certificateIssued : undefined,
      });
      toast.success('Installation job updated');
      setEditOpen(false);
      setSelectedJob(null);
      setLoading(true);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update installation job');
    } finally {
      setSaving(false);
    }
  };

  const selectedContract = options.contracts.find((contract) => contract._id === createForm.contract);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Installations</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Schedule, assign, and close installation jobs linked to customer contracts
          </p>
        </div>
        {canCreate ? (
          <button
            onClick={openCreate}
            disabled={options.contracts.length === 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
          >
            <Plus size={16} /> New Installation
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <>
          {canCreate && options.contracts.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-4 text-sm">
              No contracts are currently eligible for a new installation job. Contracts must have a paid deposit.
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {[
              { label: 'Total Jobs', value: overview.total, icon: Wrench },
              { label: 'Scheduled', value: overview.scheduled, icon: CalendarClock },
              { label: 'In Progress', value: overview.inProgress, icon: ClipboardCheck },
              { label: 'Revisits', value: overview.revisit, icon: Wrench },
              { label: 'Installed', value: overview.installed, icon: ClipboardCheck },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-[1.6rem] border border-slate-200/70 bg-white/85 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-500">{item.label}</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900">{item.value}</p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-[var(--brand-navy)]">
                      <Icon size={20} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Job', 'Contract', 'Technician', 'Schedule', 'Progress', 'Status', 'Closure', 'Actions'].map((heading) => (
                    <th key={heading} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobs.map((job) => {
                  const checklistCompleted = [
                    job.dishInstalled,
                    job.routerInstalled,
                    job.signalOptimized,
                    job.connectivityTestPassed,
                    job.customerTrainingCompleted,
                  ].filter(Boolean).length;

                  return (
                    <tr key={job._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{job.jobNumber}</div>
                        <div className="text-xs text-gray-500">{job.revisitCount ? `${job.revisitCount} revisit(s)` : 'First visit'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{job.contract?.contractRef}</div>
                        <div className="text-xs text-gray-500">{job.contract?.customer?.fullName}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {job.assignedTechnician?.name || 'Unassigned'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div>{job.scheduledFor ? new Date(job.scheduledFor).toLocaleString() : 'Not scheduled'}</div>
                        <div className="text-xs text-gray-500">
                          {job.startedAt ? `Started ${new Date(job.startedAt).toLocaleDateString()}` : 'Not started'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div>{checklistCompleted}/5 checklist items</div>
                        <div className="text-xs text-gray-500">
                          {job.customerHandoverConfirmed ? 'Customer handover confirmed' : 'Handover pending'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge label={job.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div>{job.certificateIssued ? 'Certificate issued' : 'Certificate pending'}</div>
                        <div className="text-xs text-gray-500">
                          {job.completedAt ? `Completed ${new Date(job.completedAt).toLocaleDateString()}` : 'Open job'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {canEdit ? (
                          <button
                            onClick={() => openEdit(job)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Update installation"
                          >
                            <Pencil size={15} />
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">View only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                      No installation jobs yet
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      )}

      {createOpen && canCreate ? (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Create Installation Job</h2>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <Field label="Eligible Contract">
                <select
                  required
                  value={createForm.contract}
                  onChange={(e) => setCreateForm((current) => ({ ...current, contract: e.target.value }))}
                  className={`${inputClassName} bg-white`}
                >
                  <option value="">Select contract</option>
                  {options.contracts.map((contract) => (
                    <option key={contract._id} value={contract._id}>
                      {contract.contractRef} - {contract.customer?.fullName}
                    </option>
                  ))}
                </select>
              </Field>

              {selectedContract ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 space-y-1">
                  <div>Customer: {selectedContract.customer?.fullName}</div>
                  <div>Package: {selectedContract.package?.name}</div>
                  <div>Contract Status: {selectedContract.status}</div>
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Assign Technician">
                  <select
                    value={createForm.assignedTechnician}
                    onChange={(e) => setCreateForm((current) => ({ ...current, assignedTechnician: e.target.value }))}
                    className={`${inputClassName} bg-white`}
                  >
                    <option value="">Unassigned</option>
                    {options.technicians.map((technician) => (
                      <option key={technician._id} value={technician._id}>
                        {technician.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Scheduled For">
                  <input
                    type="datetime-local"
                    value={createForm.scheduledFor}
                    onChange={(e) => setCreateForm((current) => ({ ...current, scheduledFor: e.target.value }))}
                    className={inputClassName}
                  />
                </Field>
              </div>

              <Field label="Initial Status">
                <select
                  value={createForm.status}
                  onChange={(e) => setCreateForm((current) => ({ ...current, status: e.target.value }))}
                  className={`${inputClassName} bg-white`}
                >
                  {INSTALLATION_STATUSES.filter((status) => status !== 'Installed').map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </Field>

              <Field label="Installation Notes">
                <textarea
                  rows="3"
                  value={createForm.installationNotes}
                  onChange={(e) => setCreateForm((current) => ({ ...current, installationNotes: e.target.value }))}
                  className={inputClassName}
                />
              </Field>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
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
                  {saving ? 'Saving...' : 'Create Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editOpen && selectedJob && canEdit ? (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Update Installation Job</h2>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {canAssign ? (
                  <Field label="Assigned Technician">
                    <select
                      value={editForm.assignedTechnician}
                      onChange={(e) => setEditForm((current) => ({ ...current, assignedTechnician: e.target.value }))}
                      className={`${inputClassName} bg-white`}
                    >
                      <option value="">Unassigned</option>
                      {options.technicians.map((technician) => (
                        <option key={technician._id} value={technician._id}>
                          {technician.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : null}
                <Field label="Scheduled For">
                  <input
                    type="datetime-local"
                    value={editForm.scheduledFor}
                    onChange={(e) => setEditForm((current) => ({ ...current, scheduledFor: e.target.value }))}
                    className={inputClassName}
                  />
                </Field>
                <Field label="Status">
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((current) => ({ ...current, status: e.target.value }))}
                    className={`${inputClassName} bg-white`}
                  >
                    {INSTALLATION_STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </Field>
                {canIssueCertificate ? (
                  <div className="flex items-end">
                    <CheckboxField
                      label="Issue certificate of ownership"
                      checked={editForm.certificateIssued}
                      onChange={(e) => setEditForm((current) => ({ ...current, certificateIssued: e.target.checked }))}
                    />
                  </div>
                ) : null}
              </div>

              <section className="border border-gray-200 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Technician Checklist</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <CheckboxField label="Dish installed" checked={editForm.dishInstalled} onChange={(e) => setEditForm((current) => ({ ...current, dishInstalled: e.target.checked }))} />
                  <CheckboxField label="Router installed" checked={editForm.routerInstalled} onChange={(e) => setEditForm((current) => ({ ...current, routerInstalled: e.target.checked }))} />
                  <CheckboxField label="Signal optimized" checked={editForm.signalOptimized} onChange={(e) => setEditForm((current) => ({ ...current, signalOptimized: e.target.checked }))} />
                  <CheckboxField label="Connectivity test passed" checked={editForm.connectivityTestPassed} onChange={(e) => setEditForm((current) => ({ ...current, connectivityTestPassed: e.target.checked }))} />
                  <CheckboxField label="Customer training completed" checked={editForm.customerTrainingCompleted} onChange={(e) => setEditForm((current) => ({ ...current, customerTrainingCompleted: e.target.checked }))} />
                  <CheckboxField label="Customer handover confirmed" checked={editForm.customerHandoverConfirmed} onChange={(e) => setEditForm((current) => ({ ...current, customerHandoverConfirmed: e.target.checked }))} />
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Revisit Reason">
                  <textarea
                    rows="3"
                    value={editForm.revisitReason}
                    onChange={(e) => setEditForm((current) => ({ ...current, revisitReason: e.target.value }))}
                    className={inputClassName}
                  />
                </Field>
                <Field label="Failure Reason">
                  <textarea
                    rows="3"
                    value={editForm.failureReason}
                    onChange={(e) => setEditForm((current) => ({ ...current, failureReason: e.target.value }))}
                    className={inputClassName}
                  />
                </Field>
              </div>

              <Field label="Proof of Installation URL">
                <input
                  value={editForm.proofOfInstallationUrl}
                  onChange={(e) => setEditForm((current) => ({ ...current, proofOfInstallationUrl: e.target.value }))}
                  className={inputClassName}
                  placeholder="Optional file or photo URL"
                />
              </Field>

              <Field label="Installation Notes">
                <textarea
                  rows="3"
                  value={editForm.installationNotes}
                  onChange={(e) => setEditForm((current) => ({ ...current, installationNotes: e.target.value }))}
                  className={inputClassName}
                />
              </Field>

              <Field label="Closure Notes">
                <textarea
                  rows="3"
                  value={editForm.closureNotes}
                  onChange={(e) => setEditForm((current) => ({ ...current, closureNotes: e.target.value }))}
                  className={inputClassName}
                />
              </Field>

              <div className="flex gap-3 pt-2">
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
    </div>
  );
}
