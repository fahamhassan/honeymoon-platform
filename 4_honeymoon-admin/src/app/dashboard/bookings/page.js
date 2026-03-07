'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { StatusBadge, Avatar, Spinner, EmptyState, PageHeader, Toast } from '@/components/ui';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [status,   setStatus]   = useState('');
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    setLoading(true);
    api.admin.bookings(status ? { status } : {})
      .then(d => setBookings(d.bookings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status]);

  const filtered = bookings.filter(b =>
    !search ||
    b.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.vendor_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.booking_ref?.toLowerCase().includes(search.toLowerCase())
  );

  const counts = ['confirmed','pending','cancelled','completed'].reduce((a, s) => {
    a[s] = bookings.filter(b => b.status === s).length; return a;
  }, {});

  return (
    <div className="p-8 fade-up">
      <PageHeader title="All Bookings" sub={`${bookings.length} total bookings`} />

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { l: 'Confirmed', v: counts.confirmed,  c: '#5CB88A' },
          { l: 'Pending',   v: counts.pending,    c: '#C6A85C' },
          { l: 'Completed', v: counts.completed,  c: '#8A7A9A' },
          { l: 'Cancelled', v: counts.cancelled,  c: '#D46A6A' },
        ].map(s => (
          <div key={s.l} className="card p-3.5 text-center">
            <div className="text-2xl font-bold" style={{ color: s.c }}>{s.v || 0}</div>
            <div className="text-xs text-muted">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bookings…" className="w-72" />
        <select value={status} onChange={e => setStatus(e.target.value)} className="w-40">
          <option value="">All Status</option>
          {['pending','confirmed','completed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="tbl-hdr" style={{ gridTemplateColumns: '1.5fr 1.5fr 2fr 1fr 1.5fr 1fr' }}>
          <span>Ref</span><span>Client</span><span>Vendor · Package</span><span>Date</span><span>Amount</span><span>Status</span>
        </div>
        {loading ? <Spinner /> : filtered.length === 0 ? <EmptyState icon="📅" title="No bookings found" /> : (
          filtered.map(b => (
            <div key={b.id} className="tbl-row" style={{ gridTemplateColumns: '1.5fr 1.5fr 2fr 1fr 1.5fr 1fr' }}>
              <span className="text-xs font-mono text-gold">{b.booking_ref}</span>
              <div className="flex items-center gap-2">
                <Avatar name={b.user_name} size={24} />
                <span className="text-xs text-cream">{b.user_name}</span>
              </div>
              <div>
                <div className="text-xs text-cream">{b.vendor_name}</div>
                <div className="text-[10px] text-muted">{b.package_name}</div>
              </div>
              <span className="text-xs text-muted">
                {b.event_date ? new Date(b.event_date).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' }) : '—'}
              </span>
              <span className="text-sm font-semibold text-gold">AED {parseFloat(b.total_amount || 0).toLocaleString()}</span>
              <StatusBadge status={b.status} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
