'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type {
  AnalyticsOverview,
  AuditEntry,
  MediaItem,
  Message,
  Paginated,
  Role,
  SeoRecord,
  SessionUser,
  Setting,
  AdminUser,
} from '@/lib/api/types';

export interface ListQuery {
  page?: number;
  limit?: number;
  q?: string;
  sort?: string;
  status?: string;
  includeUnpublished?: boolean;
}

/** Drops empty values so they never reach the query string. */
const cleanParams = (query: object) =>
  Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== ''));

/* -------------------------------------------------------------------------- */
/* Session                                                                     */
/* -------------------------------------------------------------------------- */

export function useSession(options?: Partial<UseQueryOptions<SessionUser>>) {
  return useQuery<SessionUser>({
    queryKey: ['session'],
    queryFn: async () => (await api.get<SessionUser>('/auth/me')).data,
    retry: false,
    staleTime: 60_000,
    ...options,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) =>
      (await api.post<SessionUser>('/auth/login', credentials)).data,
    onSuccess: (user) => queryClient.setQueryData(['session'], user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => api.post('/auth/logout'),
    onSuccess: () => queryClient.clear(),
  });
}

export function hasPermission(user: SessionUser | undefined, permission: string): boolean {
  if (!user) return false;
  if (user.permissions.includes('*')) return true;
  const [resource] = permission.split(':');
  return user.permissions.includes(permission) || user.permissions.includes(`${resource}:*`);
}

/* -------------------------------------------------------------------------- */
/* Generic CRUD — every CMS resource shares these hooks                        */
/* -------------------------------------------------------------------------- */

export function useResourceList<T>(resource: string, query: ListQuery = {}, enabled = true) {
  return useQuery<Paginated<T>>({
    queryKey: [resource, 'list', query],
    queryFn: async () =>
      (
        await api.get<Paginated<T>>(`/${resource}`, {
          params: cleanParams({ includeUnpublished: true, ...query }),
        })
      ).data,
    enabled,
  });
}

export function useResourceItem<T>(resource: string, id?: string) {
  return useQuery<T>({
    queryKey: [resource, 'item', id],
    queryFn: async () =>
      (await api.get<T>(`/${resource}/${id}`, { params: { includeUnpublished: true } })).data,
    enabled: Boolean(id),
  });
}

export function useCreateResource<T>(resource: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      (await api.post<T>(`/${resource}`, payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [resource] }),
  });
}

export function useUpdateResource<T>(resource: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      (await api.patch<T>(`/${resource}/${id}`, payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [resource] }),
  });
}

export function useDeleteResource(resource: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => api.delete(`/${resource}/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [resource] }),
  });
}

export function useReorderResource(resource: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => api.post(`/${resource}/reorder`, { ids }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [resource] }),
  });
}

/* -------------------------------------------------------------------------- */
/* Dedicated endpoints                                                         */
/* -------------------------------------------------------------------------- */

export function useAnalytics(days = 30) {
  return useQuery<AnalyticsOverview>({
    queryKey: ['analytics', days],
    queryFn: async () => (await api.get<AnalyticsOverview>('/analytics/overview', { params: { days } })).data,
  });
}

export function useMessages(query: ListQuery & { status?: string } = {}) {
  return useQuery<Paginated<Message> & { unread: number }>({
    queryKey: ['messages', query],
    queryFn: async () =>
      (
        await api.get<Paginated<Message> & { unread: number }>('/messages', {
          params: cleanParams(query),
        })
      ).data,
  });
}

export function useUpdateMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Message> }) =>
      (await api.patch<Message>(`/messages/${id}`, payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages'] }),
  });
}

export function useMedia(query: ListQuery & { folder?: string } = {}) {
  return useQuery<Paginated<MediaItem>>({
    queryKey: ['media', query],
    queryFn: async () =>
      (await api.get<Paginated<MediaItem>>('/media', { params: cleanParams(query) })).data,
  });
}

export function useUploadMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, folder = 'general' }: { file: File; folder?: string }) => {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post<MediaItem>('/media/upload', form, {
        params: { folder },
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['media'] }),
  });
}

export function useSettings() {
  return useQuery<Setting[]>({
    queryKey: ['settings'],
    queryFn: async () => (await api.get<Setting[]>('/settings')).data,
  });
}

export function useSaveSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      key,
      value,
      group,
      label,
    }: {
      key: string;
      value: Record<string, unknown>;
      group?: string;
      label?: string;
    }) => (await api.put<Setting>(`/settings/${key}`, { value, group, label })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });
}

export function useSeoRecords() {
  return useQuery<SeoRecord[]>({
    queryKey: ['seo'],
    queryFn: async () => (await api.get<SeoRecord[]>('/seo')).data,
  });
}

export function useSaveSeo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<SeoRecord> & { path: string }) =>
      (await api.put<SeoRecord>('/seo', payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seo'] }),
  });
}

export function useUsers(query: ListQuery = {}) {
  return useQuery<Paginated<AdminUser>>({
    queryKey: ['users', query],
    queryFn: async () => (await api.get<Paginated<AdminUser>>('/users', { params: cleanParams(query) })).data,
  });
}

export function useRoles() {
  return useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => (await api.get<Role[]>('/roles')).data,
  });
}

export function usePermissionCatalogue() {
  return useQuery<{ resource: string; permissions: { id: string; key: string; action: string }[] }[]>({
    queryKey: ['permissions'],
    queryFn: async () => (await api.get('/permissions')).data,
  });
}

export function useAuditLog(query: ListQuery = {}) {
  return useQuery<Paginated<AuditEntry>>({
    queryKey: ['audit-log', query],
    queryFn: async () =>
      (await api.get<Paginated<AuditEntry>>('/audit-log', { params: cleanParams(query) })).data,
  });
}
