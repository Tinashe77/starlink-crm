import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { LifeBuoy, Pencil, Plus, ShieldAlert } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import {
  createSupportTicket,
  getSupportTicketOptions,
  getSupportTickets,
  updateSupportTicket,
} from '../api/supportTickets';

const TICKET_CATEGORIES = ['Query', 'Complaint', 'Technical Support', 'Billing'];
const PRIORITIES = ['Normal', 'Urgent'];
const MANAGER_STATUSES = ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
const TECHNICIAN_STATUSES = ['Assigned', 'In Progress', 'Resolved'];

const emptyCreateForm = {
  contract: '',
  category: 'Query',
  subject: '',
  description: '',
  priority: 'Normal',
  assignedTechnician: '',
};

const emptyEditForm = {
  assignedTechnician: '',
  status: 'Open',
  priority: 'Normal',
  resolutionNotes: '',
  message: '',
};

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

const inputClassName =
  'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function SupportTickets() {
  const { user } = useAuth();
  const canCreate = ['Admin', 'Agent', 'Customer'].includes(user?.role);
  const canManage = ['Admin', 'Agent'].includes(user?.role);
  const canUpdate = ['Admin', 'Agent', 'Technician', 'Customer'].includes(user?.role);

  const [tickets, setTickets] = useState([]);
  const [options, setOptions] = useState({ contracts: [], technicians: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const loadData = async () => {
    try {
      const requests = [getSupportTickets()];
      if (canCreate) {
        requests.push(getSupportTicketOptions());
      }

      const [ticketsRes, optionsRes] = await Promise.all(requests);
      setTickets(ticketsRes.data);
      setOptions(optionsRes?.data || { contracts: [], technicians: [] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const overview = useMemo(
    () => ({
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === 'Open').length,
      assigned: tickets.filter((ticket) => ticket.status === 'Assigned').length,
      inProgress: tickets.filter((ticket) => ticket.status === 'In Progress').length,
      resolved: tickets.filter((ticket) => ['Resolved', 'Closed'].includes(ticket.status)).length,
    }),
    [tickets]
  );

  const openCreate = () => {
    setCreateForm({
      ...emptyCreateForm,
      contract: options.contracts[0]?._id || '',
      assignedTechnician: canManage ? (options.technicians[0]?._id || '') : '',
    });
    setCreateOpen(true);
  };

  const openEdit = (ticket) => {
    setSelectedTicket(ticket);
    setEditForm({
      assignedTechnician: ticket.assignedTechnician?._id || '',
      status: ticket.status,
      priority: ticket.priority || 'Normal',
      resolutionNotes: ticket.resolutionNotes || '',
      message: '',
    });
    setEditOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await createSupportTicket({
        ...createForm,
        assignedTechnician: canManage ? (createForm.assignedTechnician || undefined) : undefined,
      });
      toast.success('Support ticket submitted');
      setCreateOpen(false);
      setLoading(true);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit support ticket');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setSaving(true);

    try {
      await updateSupportTicket(selectedTicket._id, {
        assignedTechnician: canManage ? (editForm.assignedTechnician || '') : undefined,
        status: user?.role === 'Customer' ? undefined : editForm.status,
        priority: canManage ? editForm.priority : undefined,
        resolutionNotes: user?.role === 'Customer' ? undefined : editForm.resolutionNotes,
        message: editForm.message || undefined,
      });
      toast.success('Support ticket updated');
      setEditOpen(false);
      setSelectedTicket(null);
      setLoading(true);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update support ticket');
    } finally {
      setSaving(false);
    }
  };

  const selectedContract = options.contracts.find((contract) => contract._id === createForm.contract);
  const statusOptions = user?.role === 'Technician' ? TECHNICIAN_STATUSES : MANAGER_STATUSES;
  const customerCanReply = user?.role === 'Customer' && selectedTicket?.status !== 'Closed';

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Log customer queries or complaints, assign technicians, and track post-installation resolution
          </p>
        </div>
        {canCreate ? (
          <button
            onClick={openCreate}
            disabled={options.contracts.length === 0}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            <Plus size={16} /> New Ticket
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {canCreate && options.contracts.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              No installed customer contracts are currently available for ticket submission.
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              { label: 'Total Tickets', value: overview.total, icon: LifeBuoy },
              { label: 'Open', value: overview.open, icon: ShieldAlert },
              { label: 'Assigned', value: overview.assigned, icon: LifeBuoy },
              { label: 'In Progress', value: overview.inProgress, icon: ShieldAlert },
              { label: 'Resolved', value: overview.resolved, icon: LifeBuoy },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-[1.6rem] border border-slate-200/70 bg-white/85 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)]"
                >
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

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  {['Ticket', 'Customer', 'Contract', 'Category', 'Assignment', 'Status', 'Updated', 'Actions'].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{ticket.ticketNumber}</div>
                      <div className="text-xs text-gray-500">{ticket.subject}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{ticket.customer?.fullName}</div>
                      <div className="text-xs text-gray-500">{ticket.customer?.phonePrimary || ticket.customer?.email || 'No contact'}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div>{ticket.contract?.contractRef}</div>
                      <div className="text-xs text-gray-500">{ticket.installation?.jobNumber || 'No installation ref'}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div>{ticket.category}</div>
                      <div className="text-xs text-gray-500">{ticket.priority}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div>{ticket.assignedTechnician?.name || 'Unassigned'}</div>
                      <div className="text-xs text-gray-500">
                        {ticket.assignedAt ? `Assigned ${new Date(ticket.assignedAt).toLocaleDateString()}` : 'Awaiting assignment'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={ticket.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div>{new Date(ticket.updatedAt).toLocaleDateString()}</div>
                      <div className="line-clamp-1 text-xs text-gray-500">
                        {ticket.messages?.[ticket.messages.length - 1]?.message || ticket.resolutionNotes || ticket.description}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {canUpdate ? (
                        <button
                          onClick={() => openEdit(ticket)}
                          className="rounded p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                          title="Update ticket"
                        >
                          <Pencil size={15} />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">View only</span>
                      )}
                    </td>
                  </tr>
                ))}
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                      No support tickets have been submitted yet
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      )}

      {createOpen && canCreate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">Submit Support Ticket</h2>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 p-6">
              <Field label="Installed Contract">
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
                <div className="space-y-1 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  <div>Customer: {selectedContract.customer?.fullName}</div>
                  <div>Package: {selectedContract.package?.name}</div>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Category">
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm((current) => ({ ...current, category: e.target.value }))}
                    className={`${inputClassName} bg-white`}
                  >
                    {TICKET_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Priority">
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm((current) => ({ ...current, priority: e.target.value }))}
                    className={`${inputClassName} bg-white`}
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {canManage ? (
                <Field label="Assign Technician (optional)">
                  <select
                    value={createForm.assignedTechnician}
                    onChange={(e) => setCreateForm((current) => ({ ...current, assignedTechnician: e.target.value }))}
                    className={`${inputClassName} bg-white`}
                  >
                    <option value="">Leave unassigned</option>
                    {options.technicians.map((technician) => (
                      <option key={technician._id} value={technician._id}>
                        {technician.name}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : null}

              <Field label="Subject">
                <input
                  required
                  value={createForm.subject}
                  onChange={(e) => setCreateForm((current) => ({ ...current, subject: e.target.value }))}
                  className={inputClassName}
                  placeholder="Short summary of the issue"
                />
              </Field>

              <Field label="Description">
                <textarea
                  required
                  rows="4"
                  value={createForm.description}
                  onChange={(e) => setCreateForm((current) => ({ ...current, description: e.target.value }))}
                  className={inputClassName}
                  placeholder="Describe the query or complaint in detail"
                />
              </Field>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editOpen && canUpdate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">Update Support Ticket</h2>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 p-6">
              <div className="space-y-1 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                <div>Ticket: {selectedTicket?.ticketNumber}</div>
                <div>Subject: {selectedTicket?.subject}</div>
                <div>{selectedTicket?.description}</div>
              </div>

              <div className="max-h-56 space-y-3 overflow-y-auto rounded-xl border border-gray-200 bg-slate-50/70 p-4">
                {(selectedTicket?.messages?.length || 0) > 0 ? (
                  selectedTicket.messages.map((message) => (
                    <div key={message._id} className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-900">
                          {message.authorName || message.author?.name || 'User'}
                        </span>
                        <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          {message.authorRole || message.author?.role || 'Staff'}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-slate-600">{message.message}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        {message.createdAt ? new Date(message.createdAt).toLocaleString() : ''}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No ticket responses yet.</p>
                )}
              </div>

              {canManage ? (
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

              <div className="grid gap-4 md:grid-cols-2">
                {user?.role !== 'Customer' ? (
                  <Field label="Status">
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm((current) => ({ ...current, status: e.target.value }))}
                      className={`${inputClassName} bg-white`}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : (
                  <Field label="Current Status">
                    <div className="rounded-lg border border-gray-200 bg-slate-50 px-3 py-2.5">
                      <Badge label={selectedTicket?.status} />
                    </div>
                  </Field>
                )}

                {canManage ? (
                  <Field label="Priority">
                    <select
                      value={editForm.priority}
                      onChange={(e) => setEditForm((current) => ({ ...current, priority: e.target.value }))}
                      className={`${inputClassName} bg-white`}
                    >
                      {PRIORITIES.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : null}
              </div>

              <Field label="Resolution / Action Notes">
                <textarea
                  rows="4"
                  value={editForm.resolutionNotes}
                  onChange={(e) => setEditForm((current) => ({ ...current, resolutionNotes: e.target.value }))}
                  className={inputClassName}
                  placeholder="Add the action taken, field notes, or resolution details"
                  disabled={user?.role === 'Customer'}
                />
              </Field>

              <Field label={user?.role === 'Customer' ? 'Your Response' : 'Add Ticket Response'}>
                <textarea
                  rows="4"
                  value={editForm.message}
                  onChange={(e) => setEditForm((current) => ({ ...current, message: e.target.value }))}
                  className={inputClassName}
                  placeholder={
                    user?.role === 'Customer'
                      ? customerCanReply
                        ? 'Add more detail or respond to the latest update'
                        : 'This ticket is closed'
                      : 'Add a visible response for the customer'
                  }
                  disabled={user?.role === 'Customer' && !customerCanReply}
                />
              </Field>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditOpen(false);
                    setSelectedTicket(null);
                  }}
                  className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || (user?.role === 'Customer' && !customerCanReply)}
                  className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : user?.role === 'Customer' ? 'Send Response' : 'Update Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
