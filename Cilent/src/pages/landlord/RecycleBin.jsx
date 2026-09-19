import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Clock, RotateCcw, Trash2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { recycleBinAPI } from '../../utils/api';

const formatDeletedAt = (value) => {
  if (!value) return 'Unknown date';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

const DaysRemaining = ({ days }) => (
  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black ${days <= 3 ? 'border-red-200 bg-red-100 text-red-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>
    <Clock className="h-3 w-3" />
    {days <= 3 ? `Deleting in ${days}d` : `${days} days remaining`}
  </span>
);

const RecycleBin = () => {
  const [activeTab, setActiveTab] = useState('properties');
  const queryClient = useQueryClient();

  const propertiesQuery = useQuery({
    queryKey: ['recycle-bin', 'properties'],
    queryFn: async () => (await recycleBinAPI.getProperties()).data.data || [],
    enabled: activeTab === 'properties',
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
  });
  const tenantsQuery = useQuery({
    queryKey: ['recycle-bin-tenants'],
    queryFn: async () => (await recycleBinAPI.getTenants()).data.data || [],
    enabled: activeTab === 'tenants',
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
  });

  const recoverMutation = useMutation({
    mutationFn: ({ type, id }) => type === 'property'
      ? recycleBinAPI.recoverProperty(id)
      : recycleBinAPI.recoverTenant(id),
    onSuccess: (_, { type, id }) => {
      const queryKey = type === 'property'
        ? ['recycle-bin', 'properties']
        : ['recycle-bin-tenants'];
      queryClient.setQueryData(queryKey, (items = []) => items.filter((item) => (
        type === 'property' ? item.property_id : item.user_id
      ) !== id));
      queryClient.invalidateQueries({ queryKey: ['recycle-bin'] });
      if (type === 'tenant') {
        queryClient.invalidateQueries({ queryKey: ['recycle-bin-tenants'] });
        queryClient.invalidateQueries({ queryKey: ['active-tenants'] });
      }
      toast.success(`${type === 'property' ? 'Property' : 'Tenant'} recovered successfully`);
    },
    onError: (error) => toast.error(error.message || 'Recovery failed'),
  });

  const isPropertyTab = activeTab === 'properties';
  const items = isPropertyTab ? propertiesQuery.data || [] : tenantsQuery.data || [];
  const isLoading = isPropertyTab ? propertiesQuery.isLoading : tenantsQuery.isLoading;
  const isError = isPropertyTab ? propertiesQuery.isError : tenantsQuery.isError;

  const recover = (type, item) => recoverMutation.mutate({
    type,
    id: type === 'property' ? item.property_id : item.user_id,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-red-50">
          <Trash2 className="h-5 w-5 text-red-500" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">Recycle Bin</h1>
          <p className="mt-0.5 text-xs font-medium text-slate-500">Recover deleted items within 30 days.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200" role="tablist" aria-label="Recycle bin sections">
        {[
          { id: 'properties', label: 'Properties', icon: Building2 },
          { id: 'tenants', label: 'Tenants & Rooms', icon: User },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${activeTab === id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {isLoading ? <LoadingSpinner fullPage /> : isError ? (
        <EmptyState icon={Trash2} title="Unable to load recycle bin" message="Please try again in a moment." />
      ) : items.length === 0 ? (
        <EmptyState icon={Trash2} title={`No deleted ${isPropertyTab ? 'properties' : 'tenants'}`} message="Deleted items will appear here for 30 days." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {items.map((item) => {
              const id = isPropertyTab ? item.property_id : item.user_id;
              const isRecovering = recoverMutation.isPending && recoverMutation.variables?.id === id;
              return (
                <div key={id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      {isPropertyTab ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-black text-slate-900">{isPropertyTab ? item.property_name : item.full_name}</h2>
                      <p className="mt-1 text-xs text-slate-500">
                        {isPropertyTab ? `${item.address || item.city || 'No address'} · ${item.total_rooms || 0} rooms` : `@${item.username} · ${item.property_name ? `${item.property_name} · Room ${item.room_number}` : 'No room assigned'}`}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">Deleted {formatDeletedAt(item.deleted_at)}</p>
                      <div className="mt-2"><DaysRemaining days={item.days_remaining} /></div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => recover(isPropertyTab ? 'property' : 'tenant', item)}
                    disabled={recoverMutation.isPending}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {isRecovering ? 'Recovering...' : 'Recover'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecycleBin;
