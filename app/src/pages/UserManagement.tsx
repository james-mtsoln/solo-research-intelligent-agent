import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2,
  Users,
  UserPlus,
  Mail,
  Shield,
  Edit3,
  Trash2,
  X,
  Copy,
  Check,
  UserX,
  Send,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────── */

interface AppUser {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  is_active: boolean;
  created_at: string;
}

interface Invitation {
  id: number;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'pending' | 'used' | 'expired' | 'cancelled';
  created_at: string;
  expires_at: string;
}

/* ── Mock data ─────────────────────────────────────────── */

const MOCK_USERS: AppUser[] = [
  { id: 1, email: 'admin@rid.io', name: 'Alex Chen', role: 'admin', is_active: true, created_at: '2024-01-15T08:00:00Z' },
  { id: 2, email: 'sarah@rid.io', name: 'Sarah Kim', role: 'editor', is_active: true, created_at: '2024-02-20T10:30:00Z' },
  { id: 3, email: 'mike@rid.io', name: 'Mike Ross', role: 'editor', is_active: true, created_at: '2024-03-05T14:15:00Z' },
  { id: 4, email: 'lisa@rid.io', name: 'Lisa Wang', role: 'viewer', is_active: true, created_at: '2024-04-10T09:45:00Z' },
  { id: 5, email: 'john@rid.io', name: 'John Doe', role: 'viewer', is_active: false, created_at: '2024-05-18T11:00:00Z' },
  { id: 6, email: 'emma@rid.io', name: 'Emma Wilson', role: 'viewer', is_active: true, created_at: '2024-06-22T16:20:00Z' },
];

const MOCK_INVITATIONS: Invitation[] = [
  { id: 1, email: 'pending@rid.io', role: 'editor', status: 'pending', created_at: '2024-12-01T10:00:00Z', expires_at: '2024-12-08T10:00:00Z' },
  { id: 2, email: 'used@rid.io', role: 'viewer', status: 'used', created_at: '2024-11-20T08:00:00Z', expires_at: '2024-11-27T08:00:00Z' },
  { id: 3, email: 'expired@rid.io', role: 'editor', status: 'expired', created_at: '2024-11-10T12:00:00Z', expires_at: '2024-11-17T12:00:00Z' },
];

/* ── Role badge component ──────────────────────────────── */

function RoleBadge({ role }: { role: 'admin' | 'editor' | 'viewer' }) {
  const styles = {
    admin: 'bg-status-error/10 text-status-error border-status-error/25',
    editor: 'bg-status-warning/10 text-status-warning border-status-warning/25',
    viewer: 'bg-status-info/10 text-status-info border-status-info/25',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-xs font-medium uppercase tracking-wider ${styles[role]}`}
    >
      {role === 'admin' && <Shield size={10} className="mr-1" />}
      {role}
    </span>
  );
}

/* ── Status badge ──────────────────────────────────────── */

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isActive ? 'bg-status-success' : 'bg-status-error'
        }`}
      />
      <span className={isActive ? 'text-status-success' : 'text-status-error'}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    </span>
  );
}

/* ── Toast ─────────────────────────────────────────────── */

function Toast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-radius-lg border border-status-success/25 bg-bg-elevated px-4 py-3 shadow-lg">
      <Check size={16} className="text-status-success" />
      <span className="text-sm text-text-primary">{message}</span>
      <button onClick={onClose} className="text-text-muted hover:text-text-secondary">
        <X size={14} />
      </button>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────── */

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>(MOCK_USERS);
  const [invitations, setInvitations] = useState<Invitation[]>(MOCK_INVITATIONS);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Role change dialog
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [newRole, setNewRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(''), 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  /* ── Invite user ── */
  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setSending(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 600));

    const newInvite: Invitation = {
      id: Date.now(),
      email: inviteEmail,
      role: inviteRole,
      status: 'pending',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    setInvitations((prev) => [newInvite, ...prev]);
    setInviteEmail('');
    setInviteRole('editor');
    setSending(false);
    showToast(`Invitation sent to ${newInvite.email}`);
  };

  /* ── Cancel invitation ── */
  const handleCancelInvitation = (id: number) => {
    setInvitations((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: 'cancelled' as const } : inv))
    );
    showToast('Invitation cancelled');
  };

  /* ── Resend invitation ── */
  const handleResendInvitation = (id: number) => {
    setInvitations((prev) =>
      prev.map((inv) =>
        inv.id === id
          ? {
              ...inv,
              created_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            }
          : inv
      )
    );
    showToast('Invitation resent');
  };

  /* ── Change role ── */
  const openRoleDialog = (user: AppUser) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleDialogOpen(true);
  };

  const handleRoleChange = () => {
    if (!selectedUser) return;

    setUsers((prev) =>
      prev.map((u) => (u.id === selectedUser.id ? { ...u, role: newRole } : u))
    );
    setRoleDialogOpen(false);
    setSelectedUser(null);
    showToast(`Role updated for ${selectedUser.name}`);
  };

  /* ── Deactivate user ── */
  const handleDeactivateUser = (id: number) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, is_active: !u.is_active } : u))
    );
    showToast('User status updated');
  };

  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Copy invite link ── */
  const handleCopyLink = (inviteId: number) => {
    const link = `${window.location.origin}/#/accept-invite?token=inv-${inviteId}`;
    navigator.clipboard.writeText(link).catch(() => {});
    setCopiedId(inviteId);
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    copiedTimeoutRef.current = setTimeout(() => setCopiedId(null), 2000);
    showToast('Invitation link copied to clipboard');
  };

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    };
  }, []);

  /* ── Format date ── */
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary lg:text-3xl">
          User Management
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage team access and roles
        </p>
      </div>

      {/* ── Invite User Section ── */}
      <section className="rounded-radius-lg border border-border-subtle bg-bg-surface p-5">
        <div className="mb-4 flex items-center gap-2">
          <UserPlus size={18} className="text-accent-cyan" />
          <h2 className="text-base font-semibold text-text-primary">
            Invite User
          </h2>
        </div>

        <form
          onSubmit={handleSendInvitation}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              Email
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="h-10 border-border-subtle bg-bg-primary pl-9 text-text-primary placeholder:text-text-tertiary focus:border-accent-cyan"
                required
              />
            </div>
          </div>

          <div className="w-full sm:w-40">
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              Role
            </label>
            <Select
              value={inviteRole}
              onValueChange={(v: 'admin' | 'editor' | 'viewer') =>
                setInviteRole(v)
              }
            >
              <SelectTrigger className="h-10 border-border-subtle bg-bg-primary text-text-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border-subtle bg-bg-elevated">
                <SelectItem value="admin" className="text-text-primary focus:bg-bg-surface focus:text-text-primary">
                  Admin
                </SelectItem>
                <SelectItem value="editor" className="text-text-primary focus:bg-bg-surface focus:text-text-primary">
                  Editor
                </SelectItem>
                <SelectItem value="viewer" className="text-text-primary focus:bg-bg-surface focus:text-text-primary">
                  Viewer
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="flex h-10 items-center justify-center gap-2 rounded-full bg-accent-blue px-5 text-sm font-semibold text-white transition-all hover:bg-accent-blue-hover hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
          >
            {sending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={14} />
                Send Invitation
              </>
            )}
          </button>
        </form>
      </section>

      {/* ── Users Table ── */}
      <section className="rounded-radius-lg border border-border-subtle bg-bg-surface p-5">
        <div className="mb-4 flex items-center gap-2">
          <Users size={18} className="text-accent-cyan" />
          <h2 className="text-base font-semibold text-text-primary">
            Team Members
          </h2>
          <span className="ml-2 rounded-full bg-bg-elevated px-2 py-0.5 font-mono text-xs text-text-tertiary">
            {users.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border-subtle hover:bg-transparent">
                <TableHead className="text-text-tertiary font-label">
                  Name
                </TableHead>
                <TableHead className="text-text-tertiary font-label">
                  Email
                </TableHead>
                <TableHead className="text-text-tertiary font-label">
                  Role
                </TableHead>
                <TableHead className="text-text-tertiary font-label">
                  Status
                </TableHead>
                <TableHead className="text-text-tertiary font-label">
                  Joined
                </TableHead>
                <TableHead className="text-right text-text-tertiary font-label">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow
                  key={u.id}
                  className="border-border-subtle transition-colors hover:bg-bg-elevated/50"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-blue/10 font-mono text-xs font-medium text-accent-blue">
                        {u.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <span className="font-medium text-text-primary">
                        {u.name}
                      </span>
                      {currentUser?.id === u.id && (
                        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                          You
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {u.email}
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={u.role} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge isActive={u.is_active} />
                  </TableCell>
                  <TableCell className="font-mono text-sm text-text-tertiary">
                    {fmtDate(u.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openRoleDialog(u)}
                        className="flex h-8 w-8 items-center justify-center rounded-radius-md text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-secondary"
                        title="Change role"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeactivateUser(u.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-radius-md text-text-muted transition-colors hover:bg-status-error/10 hover:text-status-error"
                        title={u.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <UserX size={14} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* ── Invitations Table ── */}
      <section className="rounded-radius-lg border border-border-subtle bg-bg-surface p-5">
        <div className="mb-4 flex items-center gap-2">
          <Mail size={18} className="text-accent-cyan" />
          <h2 className="text-base font-semibold text-text-primary">
            Invitations
          </h2>
          <span className="ml-2 rounded-full bg-bg-elevated px-2 py-0.5 font-mono text-xs text-text-tertiary">
            {invitations.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border-subtle hover:bg-transparent">
                <TableHead className="text-text-tertiary font-label">
                  Email
                </TableHead>
                <TableHead className="text-text-tertiary font-label">
                  Role
                </TableHead>
                <TableHead className="text-text-tertiary font-label">
                  Sent
                </TableHead>
                <TableHead className="text-text-tertiary font-label">
                  Expires
                </TableHead>
                <TableHead className="text-text-tertiary font-label">
                  Status
                </TableHead>
                <TableHead className="text-right text-text-tertiary font-label">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((inv) => {
                const isUsed = inv.status === 'used';
                const isExpired = inv.status === 'expired';
                const isCancelled = inv.status === 'cancelled';
                const isPending = inv.status === 'pending';
                const muted = isUsed || isExpired || isCancelled;

                return (
                  <TableRow
                    key={inv.id}
                    className={`border-border-subtle transition-colors hover:bg-bg-elevated/50 ${
                      muted ? 'opacity-50' : ''
                    }`}
                  >
                    <TableCell
                      className={muted ? 'text-text-muted' : 'text-text-primary'}
                    >
                      {inv.email}
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={inv.role} />
                    </TableCell>
                    <TableCell className="font-mono text-sm text-text-tertiary">
                      {fmtDate(inv.created_at)}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-text-tertiary">
                      {fmtDate(inv.expires_at)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-medium uppercase tracking-wider ${
                          isPending
                            ? 'bg-status-warning/10 text-status-warning'
                            : isUsed
                            ? 'bg-status-success/10 text-status-success'
                            : 'bg-status-error/10 text-status-error'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleResendInvitation(inv.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-radius-md text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-secondary"
                              title="Resend"
                            >
                              <Send size={14} />
                            </button>
                            <button
                              onClick={() => handleCopyLink(inv.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-radius-md text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-secondary"
                              title="Copy link"
                            >
                              {copiedId === inv.id ? (
                                <Check size={14} className="text-status-success" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                            <button
                              onClick={() => handleCancelInvitation(inv.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-radius-md text-text-muted transition-colors hover:bg-status-error/10 hover:text-status-error"
                              title="Cancel"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* ── Role Change Dialog ── */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="border-border-subtle bg-bg-elevated text-text-primary sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-text-primary">
              Change Role
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 pt-2">
              <div className="rounded-radius-md border border-border-subtle bg-bg-primary p-3">
                <p className="text-sm text-text-secondary">User</p>
                <p className="mt-0.5 font-medium text-text-primary">
                  {selectedUser.name}
                </p>
                <p className="font-mono text-xs text-text-tertiary">
                  {selectedUser.email}
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                  New Role
                </label>
                <Select
                  value={newRole}
                  onValueChange={(v: 'admin' | 'editor' | 'viewer') =>
                    setNewRole(v)
                  }
                >
                  <SelectTrigger className="h-10 border-border-subtle bg-bg-primary text-text-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-border-subtle bg-bg-elevated">
                    <SelectItem value="admin" className="text-text-primary focus:bg-bg-surface">
                      Admin
                    </SelectItem>
                    <SelectItem value="editor" className="text-text-primary focus:bg-bg-surface">
                      Editor
                    </SelectItem>
                    <SelectItem value="viewer" className="text-text-primary focus:bg-bg-surface">
                      Viewer
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setRoleDialogOpen(false)}
                  className="rounded-radius-md border border-border-subtle px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-surface"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRoleChange}
                  className="rounded-full bg-accent-blue px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-accent-blue-hover"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
