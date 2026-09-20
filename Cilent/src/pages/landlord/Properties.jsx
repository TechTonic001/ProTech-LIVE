// src/pages/landlord/Properties.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { propertyAPI, roomAPI } from '../../utils/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SkeletonCard from '../../components/ui/SkeletonCard';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import NigerianLocationSelector from '../../components/ui/NigerianLocationSelector';
import { 
  Building2, 
  MapPin, 
  Plus, 
  Trash2, 
  Megaphone,
  DoorOpen,
  PenTool,
  Loader2,
  ListFilter
} from 'lucide-react';
import toast from 'react-hot-toast';

const Properties = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: properties = [], isLoading: isPropertiesLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: () => propertyAPI.getAll().then((res) => res.data.data || []),
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
  });

  const { data: rooms = [], isLoading: isRoomsLoading } = useQuery({
    queryKey: ['rooms', 'all-with-leases'],
    queryFn: () => roomAPI.getAllWithLeases().then((res) => res.data || []),
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
  });
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  
  // Form state
  const [form, setForm] = useState({
    property_name: '',
    state: '',
    lga: '',
    address: '',
    city: 'Ogbomoso',
    default_room_type: 'single',
    default_yearly_rent: '',
    allow_partial_payment: false,
  });
  const [totalRooms, setTotalRooms] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete confirm modal state
  const [deleteModal, setDeleteModal] = useState({ open: false, property: null, loading: false });

  const createPropertyMutation = useMutation({
    mutationFn: (data) => propertyAPI.create(data).then((res) => res.data.property),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success(`Property created! ${totalRooms} rooms generated automatically.`);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to save property');
    },
  });

  const updatePropertyMutation = useMutation({
    mutationFn: ({ id, data }) => propertyAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property updated successfully');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to save property');
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: ({ id, reason }) => propertyAPI.delete(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success(`Property moved to recycle bin. Recovery available for 30 days.`);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete property');
    },
  });

  const openCreateModal = () => {
    setForm({
      property_name: '',
      state: '',
      lga: '',
      address: '',
      city: 'Ogbomoso',
      default_room_type: 'single',
      default_yearly_rent: '',
      allow_partial_payment: false,
    });
    setTotalRooms('');
    setFormError('');
    setModalMode('create');
    setIsModalOpen(true);
  };

  const openEditModal = (prop) => {
    setForm({
      property_name: prop.property_name || '',
      state: prop.state || '',
      lga: prop.lga || '',
      address: prop.address || '',
      city: prop.city || 'Ogbomoso',
      default_room_type: 'single',
      default_yearly_rent: '',
      allow_partial_payment: Boolean(prop.allow_partial_payment),
    });
    setTotalRooms(prop.total_rooms || '');
    setSelectedPropertyId(prop.property_id);
    setFormError('');
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.property_name || !form.address) {
      setFormError('Property Name and Address are required.');
      return;
    }

    if (modalMode === 'create' && (!totalRooms || Number(totalRooms) < 1)) {
      setFormError('Please enter the number of rooms.');
      return;
    }

    setFormError('');
    setSubmitLoading(true);

    try {
      if (modalMode === 'create') {
        await createPropertyMutation.mutateAsync({
          property_name: form.property_name,
          state: form.state,
          lga: form.lga,
          address: form.address,
          city: form.city || form.lga || 'Ogbomoso',
          total_rooms: totalRooms,
          default_room_type: form.default_room_type,
          default_yearly_rent: form.default_yearly_rent,
          allow_partial_payment: form.allow_partial_payment,
        });
      } else {
        await updatePropertyMutation.mutateAsync({
          id: selectedPropertyId,
          data: {
            property_name: form.property_name,
            state: form.state,
            lga: form.lga,
            address: form.address,
            city: form.city || form.lga || 'Ogbomoso',
            total_rooms: Number(totalRooms) || 0,
            allow_partial_payment: form.allow_partial_payment,
          },
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Error saving property');
      toast.error(err.message || 'Operation failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = (property) => {
    setDeleteModal({ open: true, property, loading: false });
  };

  const handleDeleteConfirm = async (reason) => {
    const { property } = deleteModal;
    setDeleteModal((prev) => ({ ...prev, loading: true }));
    try {
      await deletePropertyMutation.mutateAsync({ id: property.property_id, reason });
      setDeleteModal({ open: false, property: null, loading: false });
    } catch (err) {
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  if (isPropertiesLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} lines={3} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl lg:text-2xl font-black text-slate-900">My Properties</h2>
          <span className="bg-slate-200 text-slate-700 text-xs font-black px-2 py-0.5 rounded-full">
            {properties.length}
          </span>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition duration-150 hover:shadow-lg hover:shadow-blue-500/25 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Property
        </button>
      </div>

      {properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties registered"
          message="Begin by registering a property. Once added, you can configure rooms and assign tenants."
          actionText="Add Property"
          onActionClick={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {properties.map((property) => {
            const propertyRooms = rooms.filter((room) => room.property_id === property.property_id);

            return (
            <div
              key={property.property_id}
              className={`bg-white rounded-2xl border overflow-hidden shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between ${
                property.isOptimistic ? 'border-blue-300 opacity-60 pointer-events-none' : 'border-slate-100'
              }`}
            >
              {/* Top accent bar */}
              <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-600" />
              
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-16 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 flex-shrink-0">
                    {property.isOptimistic ? <Loader2 className="w-6 h-6 animate-spin" /> : <Building2 className="w-6 h-6" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900 truncate">{property.property_name}</h3>
                      {property.isOptimistic && (
                        <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                          Saving...
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{property.address}, {property.city}</span>
                    </p>
                  </div>
                </div>

                {/* Property Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 border border-slate-100/50 rounded-xl p-2.5 text-center">
                    <div className="text-sm font-black text-slate-900">{property.total_rooms || 0}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Rooms</div>
                  </div>
                  <div className="bg-green-50/50 border border-green-100/50 rounded-xl p-2.5 text-center">
                    <div className="text-sm font-black text-green-700">{property.total_rooms || 0}</div>
                    <div className="text-[9px] font-bold text-green-500 uppercase mt-0.5">Capacity</div>
                  </div>
                  <div className="bg-blue-50/50 border border-blue-100/50 rounded-xl p-2.5 text-center">
                    <div className="text-sm font-black text-blue-700">{property.city}</div>
                    <div className="text-[9px] font-bold text-blue-500 uppercase mt-0.5">City</div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Payment mode</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold ${property.allow_partial_payment ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {property.allow_partial_payment ? 'Partial allowed' : 'Full payment only'}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Rooms</h4>
                    {isRoomsLoading && <span className="text-[10px] text-slate-400">Loading...</span>}
                  </div>
                  {propertyRooms.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-400">
                      No rooms added to this property yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {propertyRooms.map((room) => (
                        <div key={room.room_id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                          <p className="text-xs font-bold text-slate-700">{room.room_number}</p>
                          <p className="text-[10px] text-slate-400">{room.room_type || 'Room'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2 justify-end">
                <button
                  onClick={() => navigate(`/landlord/rooms?property_id=${property.property_id}`)}
                  disabled={property.isOptimistic}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition disabled:opacity-50"
                >
                  <DoorOpen className="w-3.5 h-3.5" />
                  Rooms
                </button>
                <button
                  onClick={() => openEditModal(property)}
                  disabled={property.isOptimistic}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition disabled:opacity-50"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => navigate(`/landlord/announcements?property_id=${property.property_id}`)}
                  disabled={property.isOptimistic}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition disabled:opacity-50"
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  Announce
                </button>
                <button
                  onClick={() => handleDelete(property)}
                  disabled={property.isOptimistic}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition ml-auto disabled:opacity-50"
                  title="Move to recycle bin"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Add New Property' : 'Edit Property'}
      >
        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
          {formError && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl p-3">
              {formError}
            </p>
          )}

          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block mb-1.5">
              Property Name
            </label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="property_name"
                value={form.property_name}
                onChange={handleInputChange}
                placeholder="e.g. Halleluyah Court"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
              />
            </div>
          </div>

          <NigerianLocationSelector
            value={{ state: form.state, lga: form.lga, address: form.address }}
            onChange={(loc) => setForm(prev => ({ ...prev, ...loc, city: loc.lga || prev.city }))}
          />

          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block mb-1.5">
              Total Rooms
            </label>
            <input
              type="number"
              min="1"
              max="500"
              value={totalRooms}
              onChange={(e) => setTotalRooms(parseInt(e.target.value, 10) || '')}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block mb-1.5">
                Default Room Type
              </label>
              <select
                name="default_room_type"
                value={form.default_room_type}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
              >
                <option value="single">Single Room</option>
                <option value="shared">Shared Room</option>
                <option value="self_contain">Self Contain</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block mb-1.5">
                Default Yearly Rent
              </label>
              <input
                type="number"
                name="default_yearly_rent"
                value={form.default_yearly_rent}
                onChange={handleInputChange}
                min={0}
                placeholder="e.g. 15000"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
              />
              <p className="text-xs text-slate-400 mt-1">
                This yearly price will be applied to all rooms. You can rename rooms later from the Rooms page.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Payment Mode</div>
                <div className="text-xs text-slate-600 mt-1">Allow tenants to pay part of the rent instead of full payment</div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(form.allow_partial_payment)}
                onChange={(e) => setForm((prev) => ({ ...prev, allow_partial_payment: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-2">
            <p className="text-sm font-bold text-blue-700">Auto Room Generation</p>
            <p className="text-sm text-blue-600 mt-1">
              {totalRooms > 0
                ? `${totalRooms} rooms will be created automatically, named Room 1 through Room ${totalRooms}. The yearly rent will apply to every room and you can rename rooms later from the Rooms page.`
                : 'Enter the number of rooms to see a preview.'}
            </p>
          </div>

          <button
            type="submit"
            disabled={submitLoading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition duration-150 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
          >
            {submitLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Property'
            )}
          </button>
        </form>
      </Modal>

      {/* Soft Delete Confirm Modal (Issue 1D) */}
      <DeleteConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, property: null, loading: false })}
        onConfirm={handleDeleteConfirm}
        itemType="property"
        itemName={deleteModal.property?.property_name || ''}
        isLoading={deleteModal.loading}
      />
    </div>
  );
};

export default Properties;
