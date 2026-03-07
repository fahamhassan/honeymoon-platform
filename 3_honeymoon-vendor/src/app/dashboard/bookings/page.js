'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { StatusBadge, Avatar, Spinner, EmptyState, PageHeader, Modal, Toast } from '@/components/ui';

const FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

export default function VendorBookingsPage() {
  const [bookings,  setBookings]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('all');
  const [search,    setSearch]    = useState('');
  const [selected,  setSelected]  = useState(null);
  const [notes,     setNotes]     = useState('');
  const [acting,    setActing]    = useState(false);
  const [toast,     setToast]     = useState(null);

  const load = (status) => {
    setLoading(true);
    api.vendor.bookings(status !== 'all' ? { status } : {})
      .then(d => setBookings(d.bookings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(filter); }, [filter]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAction = async (bookingId, status) => {
    setActing(true);
    try {
      await api.vendor.updateBooking(bookingId, { status, vendor_notes: notes });
      showToast(`Booking ${status}`);
      setSelected(null);
      load(filter);
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setActing(false);
    }
  };

  const filtered = bookings.filter(b => {
    if (!search) return true;
    return (
      b.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.booking_ref?.toLowerCase().includes(search.toLowerCase()) ||
      b.package_name?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'all' ? bookings.length : bookings.filter(b => b.status === f).length;
    return acc;
  }, {});

  return (
    <div className="p-8 fade-up">
      <PageHeader title="Bookings" sub="Manage incoming booking requests" />

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { l: 'Total',     v: counts.all,       c: '#C6A85C' },
          { l: 'Confirmed', v: counts.confirmed,  c: '#5CB88A' },
          { l: 'Pending',   v: counts.pending,    c: '#D4A0B5' },
          { l: 'Cancelled', v: counts.cancelled,  c: '#D46A6A' },
        ].map(s => (
          <div key={s.l} className="card p-3.5 text-center">
            <div className="text-2xl font-bold" style={{ color: s.c }}>{s.v || 0}</div>
            <div className="text-xs text-muted mt-0.5">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by client, ref, package…"
          className="w-64"
        />
        <div className="flex gap-1.5">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize cursor-pointer transition-all border ${filter === f ? 'border-gold/50 bg-gold/10 text-gold' : 'border-gold/15 text-muted hover:border-gold/30'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="tbl-hdr" style={{ gridTemplateColumns: '2.5fr 2fr 1fr 1.5fr 1.5fr 1fr' }}>
          <span>Client</span><span>Package · Date</span><span>Guests</span><span>Amount</span><span>Status</span><span>Actions</span>
        </div>

        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState icon="📅" title="No bookings found" />
        ) : (
          filtered.map(b => (
            <div key={b.id} className="tbl-row" style={{ gridTemplateColumns: '2.5fr 2fr 1fr 1.5fr 1.5fr 1fr' }}>
              <div className="flex items-center gap-2.5">
                <Avatar name={b.user_name} size={28} />
                <div>
                  <div className="text-sm font-medium text-cream">{b.user_name}</div>
                  <div className="text-[10px] text-muted">{b.booking_ref}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-cream">{b.package_name}</div>
                <div className="text-[10px] text-muted">
                  {b.event_date ? new Date(b.event_date).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </div>
              </div>
              <span className="text-sm">{b.guest_count || '—'}</span>
              <span className="text-sm font-semibold text-gold">AED {parseFloat(b.total_amount || 0).toLocaleString()}</span>
              <StatusBadge status={b.status} />
              <div className="flex gap-1.5">
                <button onClick={() => setSelected(b)} className="ghost-btn py-1 px-2.5 text-[11px]">View</button>
                {b.status === 'pending' && (
                  <button onClick={() => handleAction(b.id, 'confirmed')}
                    className="gold-btn py-1 px-2.5 rounded-md text-[11px]">✓</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Booking detail modal */}
      {selected && (
        <Modal title={`Booking ${selected.booking_ref}`} onClose={() => setSelected(null)}>
          <div className="space-y-3 mb-5">
            {[
              ['Client',    selected.user_name],
              ['Package',   selected.package_name],
              ['Event Date', selected.event_date ? new Date(selected.event_date).toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
              ['Guests',    selected.guest_count],
              ['Total',     `AED ${parseFloat(selected.total_amount || 0).toLocaleString()}`],
              ['Paid',      `AED ${parseFloat(selected.paid_amount || 0).toLocaleString()}`],
              ['Status',    selected.status],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between py-2 border-b border-gold/8">
                <span className="text-xs text-muted">{l}</span>
                <span className="text-sm text-cream font-medium">{v}</span>
              </div>
            ))}
            {selected.notes && (
              <div className="bg-dark3 rounded-xl p-3">
                <div className="text-xs text-muted mb-1">Client Notes</div>
                <div className="text-sm text-cream">{selected.notes}</div>
              </div>
            )}
          </div>

          {selected.status === 'pending' && (
            <>
              <div className="field mb-4">
                <label className="inp-label">Message to Client (optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  placeholder="Add a note for the client…" className="w-full" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleAction(selected.id, 'confirmed')} disabled={acting}
                  className="gold-btn flex-1 py-3 rounded-xl">
                  {acting ? 'Processing…' : '✓ Confirm Booking'}
                </button>
                <button onClick={() => handleAction(selected.id, 'cancelled')} disabled={acting}
                  className="red-btn flex-1 py-3 rounded-xl">
                  ✕ Decline
                </button>
              </div>
            </>
          )}
        </Modal>
      )}

      <Toast {...(toast || {})} />
    </div>
  );
}
