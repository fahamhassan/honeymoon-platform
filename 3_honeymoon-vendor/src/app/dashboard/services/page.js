'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { StatusBadge, Modal, Spinner, EmptyState, PageHeader, Toast } from '@/components/ui';

const EMPTY_SVC = { name: '', description: '', price: '', pricing_unit: 'per_event', max_capacity: '', deposit_percent: 30, is_active: true };
const UNITS = ['per_event', 'per_guest', 'per_hour', 'per_item', 'per_night'];

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null); // null | 'add' | 'edit'
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(EMPTY_SVC);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null);

  const load = () => api.vendor.services()
    .then(d => setServices(d.services || d || []))
    .catch(() => {})
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openAdd = () => { setForm(EMPTY_SVC); setEditing(null); setModal('add'); };
  const openEdit = (svc) => { setForm({ ...svc }); setEditing(svc); setModal('edit'); };
  const closeModal = () => { setModal(null); setEditing(null); };

  const handleSave = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);
    try {
      if (editing) {
        await api.vendor.updateService(editing.id, form);
        showToast('Service updated');
      } else {
        await api.vendor.createService(form);
        showToast('Service published!');
      }
      closeModal();
      load();
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (svc) => {
    try {
      await api.vendor.updateService(svc.id, { is_active: !svc.is_active });
      showToast(svc.is_active ? 'Service deactivated' : 'Service activated');
      load();
    } catch (err) {
      showToast(err.message || 'Failed to update', 'error');
    }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  if (loading) return <div className="p-8"><Spinner /></div>;

  return (
    <div className="p-8 fade-up">
      <PageHeader
        title="My Services"
        sub={`${services.length} listing${services.length !== 1 ? 's' : ''}`}
        action={<button onClick={openAdd} className="gold-btn rounded-xl">+ Add Service</button>}
      />

      {services.length === 0 ? (
        <EmptyState icon="📦" title="No services yet" body="Add your first service to start receiving bookings." />
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {services.map(svc => (
            <div key={svc.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-cream">{svc.name}</div>
                  <div className="text-xs text-muted mt-0.5">{svc.pricing_unit?.replace('_', ' ')}</div>
                </div>
                <StatusBadge status={svc.is_active ? 'Active' : 'Inactive'} />
              </div>

              {svc.description && (
                <p className="text-xs text-muted leading-relaxed mb-3 line-clamp-2">{svc.description}</p>
              )}

              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: 'Price', value: `AED ${parseFloat(svc.price || 0).toLocaleString()}` },
                  { label: 'Bookings', value: svc.booking_count || 0 },
                  { label: 'Deposit', value: `${svc.deposit_percent || 30}%` },
                ].map(s => (
                  <div key={s.label} className="bg-dark3 rounded-lg p-2.5">
                    <div className="text-[10px] text-muted">{s.label}</div>
                    <div className="text-sm font-bold text-gold mt-0.5">{s.value}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button onClick={() => openEdit(svc)} className="ghost-btn flex-1 py-2">Edit</button>
                <button onClick={() => handleToggle(svc)} className={`flex-1 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${svc.is_active ? 'red-btn' : 'ghost-btn'}`}>
                  {svc.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <Modal title={modal === 'add' ? 'New Service Listing' : 'Edit Service'} onClose={closeModal}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 field">
              <label className="inp-label">Service Name *</label>
              <input value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Gold Ballroom Package" className="w-full" />
            </div>
            <div className="field">
              <label className="inp-label">Price (AED) *</label>
              <input type="number" value={form.price} onChange={e => f('price', e.target.value)} placeholder="25000" className="w-full" />
            </div>
            <div className="field">
              <label className="inp-label">Pricing Unit</label>
              <select value={form.pricing_unit} onChange={e => f('pricing_unit', e.target.value)} className="w-full">
                {UNITS.map(u => <option key={u} value={u}>{u.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="inp-label">Deposit %</label>
              <input type="number" value={form.deposit_percent} onChange={e => f('deposit_percent', e.target.value)} min="10" max="100" className="w-full" />
            </div>
            <div className="field">
              <label className="inp-label">Max Capacity</label>
              <input type="number" value={form.max_capacity} onChange={e => f('max_capacity', e.target.value)} placeholder="300" className="w-full" />
            </div>
            <div className="col-span-2 field">
              <label className="inp-label">Description</label>
              <textarea value={form.description} onChange={e => f('description', e.target.value)} rows={3} placeholder="Describe your service…" className="w-full" />
            </div>
          </div>
          <div className="flex gap-3 mt-2">
            <button onClick={handleSave} disabled={saving} className="gold-btn flex-1 py-3 rounded-xl">
              {saving ? 'Saving…' : modal === 'add' ? 'Publish Service' : 'Save Changes'}
            </button>
            <button onClick={closeModal} className="ghost-btn flex-1 py-3 rounded-xl">Cancel</button>
          </div>
        </Modal>
      )}

      <Toast {...(toast || {})} />
    </div>
  );
}
