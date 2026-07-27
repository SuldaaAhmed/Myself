'use client';

import * as Icons from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/overlays';
import { ThemeToggle } from '@/components/site/theme-toggle';
import { RESOURCES, permissionFor } from '@/lib/admin/resources';
import { hasPermission, useLogout, useMessages, useSession } from '@/lib/hooks/use-api';
import { cn, initials } from '@/lib/utils';

interface NavLink {
  href: string;
  label: string;
  icon: keyof typeof Icons;
  permission?: string;
  badge?: number;
}

/** Any lucide icon by name, so the CMS can pick icons as plain strings. */
export function Icon({ name, className }: { name: string; className?: string }) {
  const Component = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
    name
  ];
  const Fallback = Icons.Circle;
  const Resolved = Component ?? Fallback;
  return <Resolved className={className} />;
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user, isLoading, isError } = useSession();
  const logout = useLogout();
  const { data: inbox } = useMessages({ limit: 1 });
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (isError) router.replace('/admin/login');
  }, [isError, router]);

  React.useEffect(() => setOpen(false), [pathname]);

  const groups = React.useMemo(() => {
    const overview: NavLink[] = [
      { href: '/admin', label: 'Dashboard', icon: 'LayoutDashboard' },
      { href: '/admin/analytics', label: 'Analytics', icon: 'BarChart3', permission: 'analytics:read' },
      {
        href: '/admin/messages',
        label: 'Messages',
        icon: 'Inbox',
        permission: 'messages:read',
        badge: inbox?.unread,
      },
    ];

    const forGroup = (group: string) =>
      RESOURCES.filter((resource) => resource.group === group).map<NavLink>((resource) => ({
        href: `/admin/${resource.key}`,
        label: resource.label,
        icon: resource.icon as keyof typeof Icons,
        permission: permissionFor(resource, 'read'),
      }));

    const system: NavLink[] = [
      { href: '/admin/media', label: 'Media library', icon: 'Image', permission: 'media:read' },
      { href: '/admin/settings', label: 'Site settings', icon: 'Settings', permission: 'settings:read' },
      { href: '/admin/seo', label: 'SEO', icon: 'Search', permission: 'seo:read' },
      { href: '/admin/users', label: 'Users', icon: 'Users', permission: 'users:read' },
      { href: '/admin/roles', label: 'Roles', icon: 'ShieldCheck', permission: 'roles:read' },
      { href: '/admin/audit-log', label: 'Audit log', icon: 'ScrollText', permission: 'audit:read' },
    ];

    const visible = (links: NavLink[]) =>
      links.filter((link) => !link.permission || hasPermission(user, link.permission));

    return [
      { title: 'Overview', links: visible(overview) },
      { title: 'Portfolio', links: visible(forGroup('Portfolio')) },
      { title: 'Content', links: visible(forGroup('Content')) },
      { title: 'Taxonomy', links: visible(forGroup('Taxonomy')) },
      { title: 'System', links: visible(system) },
    ].filter((group) => group.links.length > 0);
  }, [user, inbox?.unread]);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Icons.Loader2 className="size-5 animate-spin text-muted" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto border-r border-line bg-surface transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
          <span className="grid size-8 place-items-center rounded-lg bg-foreground font-mono text-[0.625rem] font-bold text-background">
            CMS
          </span>
          <span className="font-display text-lg">Dashboard</span>
        </div>

        <nav className="p-3" aria-label="Dashboard">
          {groups.map((group) => (
            <div key={group.title} className="mb-5">
              <p className="px-2.5 pb-2 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {group.links.map((link) => {
                  const active =
                    link.href === '/admin'
                      ? pathname === '/admin'
                      : pathname === link.href || pathname.startsWith(`${link.href}/`);

                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={cn(
                          'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                          active
                            ? 'bg-accent-soft text-foreground'
                            : 'text-muted hover:bg-surface-muted hover:text-foreground',
                        )}
                      >
                        <Icon name={link.icon} className="size-4 shrink-0" />
                        <span className="truncate">{link.label}</span>
                        {link.badge ? (
                          <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[0.625rem] font-medium text-accent-foreground">
                            {link.badge}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      ) : null}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-background/85 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid size-9 place-items-center rounded-lg border border-line text-muted lg:hidden"
            aria-label="Open navigation"
          >
            <Icons.Menu className="size-4" />
          </button>

          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/" target="_blank">
              <Icons.ExternalLink className="size-3.5" />
              View site
            </Link>
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2.5 rounded-lg border border-line px-2.5 py-1.5 text-sm transition-colors hover:border-line-strong"
                >
                  <span className="grid size-6 place-items-center rounded-full bg-surface-muted font-mono text-[0.625rem]">
                    {initials(user?.name ?? '?')}
                  </span>
                  <span className="hidden max-w-32 truncate sm:block">{user?.name}</span>
                  <Icons.ChevronDown className="size-3.5 text-muted" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <div className="px-2.5 py-2">
                  <p className="truncate text-sm">{user?.email}</p>
                  <p className="mt-0.5 font-mono text-[0.625rem] uppercase tracking-wide text-muted">
                    {user?.roles.join(', ')}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.push('/admin/settings')}>
                  <Icons.Settings className="size-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  danger
                  onSelect={() => {
                    logout.mutate(undefined, {
                      onSettled: () => router.push('/admin/login'),
                    });
                  }}
                >
                  <Icons.LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl">{title}</h1>
        {description ? <p className="mt-1.5 text-sm text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
