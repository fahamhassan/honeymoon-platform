'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { StatusBadge, Spinner, EmptyState, PageHeader, Toast } from '@/components/ui';

const PRIORITY_COLOR = { High: '#D46A6A', Medium: '#C6A85C', Low: '#8A7A9A' };

export default function ReportsPage() {
  const [reports,  setReports]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('');
  const [toast,    setToast]    = useState(null);

  const load = () => {
    setLoading(true);
    api.admin.reports(filter ? { status: filter } : {})
      .then(d => setReports(d.reports || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const showToast = (msg, type='success') => { setToast({message:msg,type}); setTimeout(()=>setToast(null),3000); };

  const handleUpdate = async (id, status) => {
    try {
      await api.admin.updateReport(id, { status });
      showToast(`Report ${status}`);
      load();
    } catch (err) {
      showToast(err.message || 'Update failed', 'error');
    }
  };

  return (
    <div className="p-8 fade-up">
      <PageHeader title="Reports & Disputes" sub="Review user-submitted reports" />

      <div className="flex gap-3 mb-5">
        <select value={filter} onChange={e => setFilter(e.target.value)} className="w-40">
          <option value="">All Status</option>
          {['pending','investigating','resolved','escalated'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="tbl-hdr" style={{ gridTemplateColumns: '1fr 2fr 1.5fr 1.5fr 1fr 1fr 1.5fr' }}>
          <span>ID</span><span>Type</span><span>User</span><span>Vendor</span><span>Priority</span><span>Status</span><span>Actions</span>
        </div>
        {loading ? <Spinner /> : reports.length === 0 ? <EmptyState icon="🚩" title="No reports found" /> : (
          reports.map(r => (
            <div key={r.id} className="tbl-row" style={{ gridTemplateColumns: '1fr 2fr 1.5fr 1.5fr 1fr 1fr 1.5fr' }}>
              <span className="text-xs font-mono text-gold">{r.report_ref || r.id?.slice(0,8)}</span>
              <span className="text-xs text-cream">{r.type}</span>
              <span className="text-xs text-muted">{r.user_name}</span>
              <span className="text-xs text-muted">{r.vendor_name}</span>
              <span className="text-xs font-semibold" style={{ color: PRIORITY_COLOR[r.priority] || '#8A7A9A' }}>
                {r.priority}
              </span>
              <StatusBadge status={r.status} />
              <div className="flex gap-1.5">
                {r.status === 'pending' && (
                  <button onClick={() => handleUpdate(r.id, 'investigating')}
                    className="ghost-btn py-1 px-2 text-[11px]">Investigate</button>
                )}
                {r.status !== 'resolved' && (
                  <button onClick={() => handleUpdate(r.id, 'resolved')}
                    className="gold-btn py-1 px-2 rounded-md text-[11px]">✓ Resolve</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      <Toast {...(toast||{})} />
    </div>
  );
}
