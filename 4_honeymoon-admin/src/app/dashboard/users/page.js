'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { StatusBadge, Avatar, Spinner, EmptyState, PageHeader, Toast } from '@/components/ui';

export default function UsersPage() {
  const [users,   setUsers]   = useState([]);
  const [meta,    setMeta]    = useState({});
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');
  const [page,    setPage]    = useState(1);
  const [toast,   setToast]   = useState(null);

  const load = () => {
    setLoading(true);
    api.admin.users({ search, status, page, limit: 20 })
      .then(d => { setUsers(d.users || []); setMeta(d.meta || {}); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, status, page]);

  const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };

  const handleStatus = async (userId, newStatus) => {
    try {
      await api.admin.updateUserStatus(userId, newStatus);
      showToast(`User ${newStatus}`);
      load();
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  return (
    <div className="p-8 fade-up">
      <PageHeader title="User Management" sub={`${meta.total || users.length} total users`} />

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { l: 'Total',       v: meta.total || 0,       c: '#C6A85C' },
          { l: 'Active',      v: meta.active || 0,      c: '#5CB88A' },
          { l: 'Pending',     v: meta.pending || 0,     c: '#D4A0B5' },
          { l: 'Suspended',   v: meta.suspended || 0,   c: '#D46A6A' },
        ].map(s => (
          <div key={s.l} className="card p-3.5 text-center">
            <div className="text-2xl font-bold" style={{ color: s.c }}>{s.v.toLocaleString()}</div>
            <div className="text-xs text-muted mt-0.5">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 mb-5">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name, email, phone…" className="w-72" />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="w-40">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="tbl-hdr" style={{ gridTemplateColumns: '2.5fr 2fr 1fr 1fr 1.5fr 1fr 1fr' }}>
          <span>User</span><span>Email</span><span>Events</span><span>Bookings</span><span>Tier</span><span>Status</span><span>Actions</span>
        </div>
        {loading ? <Spinner /> : users.length === 0 ? <EmptyState icon="👥" title="No users found" /> : (
          users.map(u => (
            <div key={u.id} className="tbl-row" style={{ gridTemplateColumns: '2.5fr 2fr 1fr 1fr 1.5fr 1fr 1fr' }}>
              <div className="flex items-center gap-2.5">
                <Avatar name={u.full_name} size={28} />
                <div>
                  <div className="text-sm font-medium text-cream">{u.full_name}</div>
                  <div className="text-[10px] text-muted">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('en-AE', { month: 'short', year: 'numeric' }) : ''}
                  </div>
                </div>
              </div>
              <span className="text-xs text-muted truncate">{u.email}</span>
              <span className="text-sm">{u.event_count || 0}</span>
              <span className="text-sm">{u.booking_count || 0}</span>
              <span className="text-xs capitalize" style={{ color: u.tier === 'diamond' ? '#7EC8C8' : u.tier === 'gold' ? '#C6A85C' : '#8A7A9A' }}>
                {u.tier} · {(u.loyalty_points || 0).toLocaleString()} pts
              </span>
              <StatusBadge status={u.status} />
              <div className="flex gap-1.5">
                {u.status === 'active' ? (
                  <button onClick={() => handleStatus(u.id, 'suspended')} className="red-btn py-1 px-2 text-[11px]">Suspend</button>
                ) : (
                  <button onClick={() => handleStatus(u.id, 'active')} className="ghost-btn py-1 px-2 text-[11px]">Restore</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {meta.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="ghost-btn py-1.5 px-4 rounded-lg disabled:opacity-30">← Prev</button>
          <span className="text-sm text-muted">Page {page} of {meta.total_pages}</span>
          <button onClick={() => setPage(p => Math.min(meta.total_pages, p + 1))} disabled={page === meta.total_pages}
            className="ghost-btn py-1.5 px-4 rounded-lg disabled:opacity-30">Next →</button>
        </div>
      )}
      <Toast {...(toast || {})} />
    </div>
  );
}
