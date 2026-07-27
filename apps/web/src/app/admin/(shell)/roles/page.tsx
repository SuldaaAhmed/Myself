'use client';

import { Loader2, ShieldCheck } from 'lucide-react';
import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PageTitle } from '@/components/admin/admin-shell';
import { Button } from '@/components/ui/button';
import { Badge, EmptyState } from '@/components/ui/data';
import { Field, Input } from '@/components/ui/form-controls';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/overlays';
import { useToast } from '@/components/ui/toast';
import { api, apiErrorMessage } from '@/lib/api/client';
import { usePermissionCatalogue, useRoles } from '@/lib/hooks/use-api';
import type { Role } from '@/lib/api/types';

function RoleEditor({ role }: { role?: Role }) {
  const [open, setOpen] = React.useState(false);
  const { data: catalogue } = usePermissionCatalogue();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);

  const [name, setName] = React.useState(role?.name ?? '');
  const [description, setDescription] = React.useState(role?.description ?? '');
  const [keys, setKeys] = React.useState<string[]>(role?.permissions.map((item) => item.key) ?? []);

  const toggle = (key: string) =>
    setKeys((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));

  const toggleResource = (resourceKeys: string[]) => {
    const allSelected = resourceKeys.every((key) => keys.includes(key));
    setKeys((current) =>
      allSelected
        ? current.filter((key) => !resourceKeys.includes(key))
        : [...new Set([...current, ...resourceKeys])],
    );
  };

  const submit = async () => {
    setSaving(true);
    try {
      const payload = { name, description: description || undefined, permissionKeys: keys };
      if (role) await api.patch(`/roles/${role.id}`, payload);
      else await api.post('/roles', payload);

      await queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast(role ? 'Role updated' : 'Role created');
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
        <Button size="sm" variant={role ? 'outline' : 'primary'}>
          {role ? 'Edit permissions' : 'New role'}
        </Button>
      </DialogTrigger>
      <DialogContent
        title={role ? `Edit ${role.name}` : 'New role'}
        description="Permissions are `resource:action` pairs enforced by the API on every request."
        className="w-[min(94vw,46rem)]"
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={role?.isSystem}
              />
            </Field>
            <Field label="Description">
              <Input value={description} onChange={(event) => setDescription(event.target.value)} />
            </Field>
          </div>

          <div className="max-h-[45vh] space-y-4 overflow-y-auto rounded-xl border border-line p-4">
            {(catalogue ?? []).map((group) => {
              const groupKeys = group.permissions.map((permission) => permission.key);
              return (
                <div key={group.resource}>
                  <button
                    type="button"
                    onClick={() => toggleResource(groupKeys)}
                    className="mb-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-muted transition-colors hover:text-foreground"
                  >
                    {group.resource}
                  </button>
                  <div className="flex flex-wrap gap-1.5">
                    {group.permissions.map((permission) => {
                      const active = keys.includes(permission.key);
                      return (
                        <button
                          key={permission.key}
                          type="button"
                          onClick={() => toggle(permission.key)}
                          className={
                            active
                              ? 'rounded-lg border border-accent bg-accent-soft px-2.5 py-1 font-mono text-[0.6875rem]'
                              : 'rounded-lg border border-line px-2.5 py-1 font-mono text-[0.6875rem] text-muted hover:text-foreground'
                          }
                        >
                          {permission.action}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={submit} loading={saving}>
              {role ? 'Save role' : 'Create role'}
            </Button>
            <p className="text-xs text-muted">{keys.length} permissions selected</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function RolesPage() {
  const { data: roles, isLoading } = useRoles();

  return (
    <>
      <PageTitle
        title="Roles & permissions"
        description="Fine-grained access control. The API rejects anything a role does not grant."
        action={<RoleEditor />}
      />

      {isLoading ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-5 animate-spin text-muted" aria-label="Loading" />
        </div>
      ) : (roles ?? []).length === 0 ? (
        <EmptyState title="No roles" icon={<ShieldCheck className="size-6" />} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {(roles ?? []).map((role) => (
            <section key={role.id} className="card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 font-display text-2xl capitalize">
                    {role.name}
                    {role.isSystem ? <Badge>system</Badge> : null}
                  </h2>
                  {role.description ? (
                    <p className="mt-1.5 text-sm text-muted">{role.description}</p>
                  ) : null}
                </div>
                <RoleEditor role={role} />
              </div>

              <div className="mt-5 flex items-center gap-4 border-t border-line pt-4 text-sm">
                <span className="text-muted">{role._count?.users ?? 0} users</span>
                <span className="text-muted">{role.permissions.length} permissions</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-1">
                {role.permissions.slice(0, 14).map((permission) => (
                  <span
                    key={permission.id}
                    className="rounded-md bg-surface-muted px-1.5 py-0.5 font-mono text-[0.625rem] text-muted"
                  >
                    {permission.key}
                  </span>
                ))}
                {role.permissions.length > 14 ? (
                  <span className="px-1.5 py-0.5 font-mono text-[0.625rem] text-muted">
                    +{role.permissions.length - 14} more
                  </span>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
