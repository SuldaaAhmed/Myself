'use client';

import { Loader2, Plus, Trash2 } from 'lucide-react';
import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PageTitle } from '@/components/admin/admin-shell';
import { Button } from '@/components/ui/button';
import { Badge, EmptyState, Table, Td, Th, Tr } from '@/components/ui/data';
import { Field, Input, Switch } from '@/components/ui/form-controls';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/overlays';
import { useToast } from '@/components/ui/toast';
import { api, apiErrorMessage } from '@/lib/api/client';
import { useRoles, useSession, useUsers } from '@/lib/hooks/use-api';
import type { AdminUser } from '@/lib/api/types';
import { formatDate } from '@/lib/utils';

function UserDialog({ user }: { user?: AdminUser }) {
  const [open, setOpen] = React.useState(false);
  const { data: roles } = useRoles();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    jobTitle: user?.jobTitle ?? '',
    password: '',
    isActive: user?.isActive ?? true,
    roleIds: user?.roles.map((role) => role.id) ?? [],
  });

  const submit = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        jobTitle: form.jobTitle || undefined,
        isActive: form.isActive,
        roleIds: form.roleIds,
      };
      if (form.password) payload.password = form.password;

      if (user) await api.patch(`/users/${user.id}`, payload);
      else await api.post('/users', payload);

      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast(user ? 'User updated' : 'User invited');
      setOpen(false);
    } catch (error) {
      toast(apiErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={user ? 'ghost' : 'primary'}>
          {user ? 'Edit' : <Plus className="size-4" />}
          {user ? null : 'New user'}
        </Button>
      </DialogTrigger>
      <DialogContent
        title={user ? `Edit ${user.name}` : 'Invite a user'}
        description="Dashboard accounts only — visitors never sign in."
      >
        <div className="space-y-4">
          <Field label="Name" required>
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </Field>
          <Field label="Email" required>
            <Input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </Field>
          <Field label="Job title">
            <Input
              value={form.jobTitle}
              onChange={(event) => setForm({ ...form, jobTitle: event.target.value })}
            />
          </Field>
          <Field
            label={user ? 'New password' : 'Password'}
            required={!user}
            help="At least 10 characters, mixing cases and digits."
          >
            <Input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder={user ? 'Leave empty to keep the current one' : undefined}
            />
          </Field>

          <Field label="Roles" help="Permissions are the union of every assigned role.">
            <div className="flex flex-wrap gap-1.5">
              {(roles ?? []).map((role) => {
                const active = form.roleIds.includes(role.id);
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        roleIds: active
                          ? form.roleIds.filter((id) => id !== role.id)
                          : [...form.roleIds, role.id],
                      })
                    }
                    className={
                      active
                        ? 'rounded-lg border border-accent bg-accent-soft px-2.5 py-1 text-xs'
                        : 'rounded-lg border border-line px-2.5 py-1 text-xs text-muted hover:text-foreground'
                    }
                  >
                    {role.name}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-line p-3.5">
            <div>
              <p className="text-sm">Active</p>
              <p className="text-xs text-muted">Inactive accounts cannot sign in.</p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={submit} loading={saving}>
              {user ? 'Save changes' : 'Create user'}
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function UsersPage() {
  const { data, isLoading } = useUsers({ limit: 50 });
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const remove = async (user: AdminUser) => {
    if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${user.id}`);
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast('User deleted');
    } catch (error) {
      toast(apiErrorMessage(error), 'error');
    }
  };

  return (
    <>
      <PageTitle
        title="Users"
        description="Who can sign in to this dashboard, and what they are allowed to do."
        action={<UserDialog />}
      />

      {isLoading ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-5 animate-spin text-muted" aria-label="Loading" />
        </div>
      ) : (data?.data ?? []).length === 0 ? (
        <EmptyState title="No users" />
      ) : (
        <div className="card overflow-hidden">
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Roles</Th>
                <Th className="w-28">Status</Th>
                <Th className="w-36">Last sign-in</Th>
                <Th className="w-32 text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map((user) => (
                <Tr key={user.id}>
                  <Td>
                    <p className="text-sm">{user.name}</p>
                    <p className="text-xs text-muted">{user.email}</p>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role.id} tone={role.name === 'owner' ? 'accent' : 'neutral'}>
                          {role.name}
                        </Badge>
                      ))}
                    </div>
                  </Td>
                  <Td>
                    {user.isActive ? <Badge tone="mint">Active</Badge> : <Badge tone="warn">Disabled</Badge>}
                  </Td>
                  <Td className="font-mono text-xs text-muted">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <UserDialog user={user} />
                      {user.id === session?.id ? null : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => remove(user)}
                          aria-label={`Delete ${user.name}`}
                        >
                          <Trash2 className="size-3.5 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </>
  );
}
