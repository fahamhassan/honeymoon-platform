'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { StatusBadge, Spinner, EmptyState, PageHeader, Modal, Toast } from '@/components/ui';

const TABS = ['all', 'pending', 'active', 'suspended'];

export default function VendorsPage() {
  const [vendors,  setVendors]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('all');
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);
  const [reason,   setReason]   = useState('');
  const [acting,   setActing]   = useState(false);
  const [toast,    setToast]    = useState(null);

  const load = () => {
    setLoading(true);
    api.admin.vendors(tab !== 'all' ? { status: tab } : {})
      .then(d => setVendors(d.vendors || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tab]);

  const showToast = (msg, type = 'success') => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };

  const handleAction = async (action) => {
    setActing(true);
    try {
      if (action === 'approve')  await api.admin.approveVendor(selected.id);
      if (action === 'reject')   await api.admin.rejectVendor(selected.id, reason);
      if (action === 'suspend')  await api.admin.suspendVendor(selected.id, reason);
      showToast(`Vendor ${action}d`);
      setSelected(null);
      setReason('');
      load();
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setActing(false);
    }
  };

  const filtered = vendors.filter(v =>
    !search || v.business_name?.toLowerCase().includes(search.toLowerCase()) ||
    v.email?.toLowerCase().includes(search.toLowerCase())
  );

  const counts = TABS.reduce((a, t) => { a[t] = t === 'all' ? vendors.length : vendors.filter(v => v.status === t).length; return a; }, {});

  return (
    <div className="p-8 fade-up">
      <PageHeader title="Vendor Management" sub="Review and manage vendor applications" />

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { l: 'Total',    v: counts.all,       c: '#C6A85C' },
          { l: 'Active',   v: counts.active,    c: '#5CB88A' },
          { l: 'Pending',  v: counts.pending,   c: '#D4A0B5' },
          { l: 'Suspended',v: counts.suspended, c: '#D46A6A' },
        ].map(s => (
          <div key={s.l} className="card p-3.5 text-center">
            <div className="text-2xl font-bold" style={{ color: s.c }}>{s.v || 0}</div>
            <div className="text-xs text-muted">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Tabs + search */}
      <div className="flex items-center gap-3 mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors…" className="w-64" />
        <div className="flex gap-1.5">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize cursor-pointer border transition-all ${tab === t ? 'border-gold/50 bg-gold/10 text-gold' : 'border-gold/15 text-muted hover:border-gold/30'}`}>
              {t} {t !== 'all' && counts[t] > 0 ? `(${counts[t]})` : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="tbl-hdr" style={{ gridTemplateColumns: '2.5fr 1.5fr 1fr 1fr 1.5fr 1fr 1.5fr' }}>
          <span>Vendor</span><span>Category</span><span>Bookings</span><span>Rating</span><span>Revenue</span><span>Status</span><span>Actions</span>
        </div>
        {loading ? <Spinner /> : filtered.length === 0 ? <EmptyState icon="🛡️" title="No vendors found" /> : (
          filtered.map(v => (
            <div key={v.id} className="tbl-row" style={{ gridTemplateColumns: '2.5fr 1.5fr 1fr 1fr 1.5fr 1fr 1.5fr' }}>
              <div>
                <div className="text-sm font-medium text-cream">{v.business_name}</div>
                <div className="text-xs text-muted">{v.email}</div>
              </div>
              <span className="text-xs text-muted capitalize">{v.category?.replace('_', ' ')}</span>
              <span className="text-sm">{v.booking_count || 0}</span>
              <span className="text-sm">{v.rating ? `${parseFloat(v.rating).toFixed(1)} ★` : '—'}</span>
              <span className="text-sm font-semibold text-gold">
                {v.total_revenue ? `AED ${(parseFloat(v.total_revenue) / 1000).toFixed(0)}K` : '—'}
              </span>
              <StatusBadge status={v.status} />
              <div className="flex gap-1.5">
                <button onClick={() => setSelected(v)} className="ghost-btn py-1 px-2.5 text-[11px]">Review</button>
                {v.status === 'pending' && (
                  <button onClick={() => { setSelected(v); handleAction('approve'); }}
                    className="gold-btn py-1 px-2 rounded-md text-[11px]">✓</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Vendor review modal */}
      {selected && (
        <Modal title={selected.business_name} onClose={() => { setSelected(null); setReason(''); }}>
          <div className="space-y-2 mb-5">
            {[
              ['Category',  selected.category?.replace('_', ' ')],
              ['Email',     selected.email],
              ['Phone',     selected.phone],
              ['City',      selected.city],
              ['Status',    selected.status],
              ['Joined',    selected.created_at ? new Date(selected.created_at).toLocaleDateString('en-AE') : ''],
            ].map(([l, v]) => v ? (
              <div key={l} className="flex justify-between py-1.5 border-b border-gold/8">
                <span className="text-xs text-muted">{l}</span>
                <span className="text-sm text-cream capitalize">{v}</span>
              </div>
            ) : null)}
            {selected.description && (
              <div className="bg-dark3 rounded-xl p-3 mt-2">
                <p className="text-xs text-muted leading-relaxed">{selected.description}</p>
              </div>
            )}
          </div>

          {(selected.status === 'pending' || selected.status === 'active') && (
            <>
              <div className="field mb-4">
                <label className="inp-label">Reason / Note (optional)</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder="Admin note…" className="w-full" />
              </div>
              <div className="flex gap-3">
                {selected.status === 'pending' && (
                  <button onClick={() => handleAction('approve')} disabled={acting} className="gold-btn flex-1 py-3 rounded-xl">
                    {acting ? '…' : '✓ Approve'}
                  </button>
                )}
                {selected.status === 'pending' && (
                  <button onClick={() => handleAction('reject')} disabled={acting} className="red-btn flex-1 py-3 rounded-xl">
                    {acting ? '…' : '✕ Reject'}
                  </button>
                )}
                {selected.status === 'active' && (
                  <button onClick={() => handleAction('suspend')} disabled={acting} className="red-btn flex-1 py-3 rounded-xl">
                    {acting ? '…' : '⚠ Suspend'}
                  </button>
                )}
              </div>
            </>
          )}
        </Modal>
      )}
      <Toast {...(toast || {})} />
    </div>
  );
}
