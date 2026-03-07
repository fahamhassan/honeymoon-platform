'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { StatCard, BarChart, StatusBadge, Spinner, PageHeader } from '@/components/ui';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun'];

export default function FinancePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.finance()
      .then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8"><Spinner /></div>;
  const d = data || {};

  const revData = d.revenue_by_month?.map(m => parseFloat(m.fees)) || [18, 22, 28, 24, 31, 38];

  return (
    <div className="p-8 fade-up">
      <PageHeader title="Finance & Revenue" sub="Platform financial overview" />

      <div className="grid grid-cols-4 gap-4 mb-7">
        <StatCard icon="💰" label="Total GMV"         value={`AED ${(parseFloat(d.total_gmv || 0)/1000).toFixed(0)}K`}    sub="all transactions" />
        <StatCard icon="🏦" label="Platform Revenue"  value={`AED ${(parseFloat(d.total_fees || 0)/1000).toFixed(0)}K`}   sub="5% platform fee" />
        <StatCard icon="📤" label="Vendor Payouts"    value={`AED ${(parseFloat(d.total_payout || 0)/1000).toFixed(0)}K`} sub="paid to vendors" />
        <StatCard icon="⏳" label="Pending Payouts"   value={`AED ${(parseFloat(d.pending_payout || 0)/1000).toFixed(0)}K`} sub="to be settled" />
      </div>

      <div className="card p-6 mb-7">
        <h2 className="font-display text-base text-cream mb-4">Monthly Platform Fees (AED '000)</h2>
        <BarChart data={revData} labels={MONTHS} color="#5CB88A" />
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gold/10">
          <h2 className="font-display text-base text-cream">Recent Transactions</h2>
        </div>
        <div className="tbl-hdr" style={{ gridTemplateColumns: '1.5fr 2fr 1.5fr 1fr 1fr 1fr 1fr' }}>
          <span>Ref</span><span>Vendor</span><span>Client</span><span>Gross</span><span>Fee</span><span>Payout</span><span>Status</span>
        </div>
        {(d.recent_payments || []).map(p => (
          <div key={p.id} className="tbl-row" style={{ gridTemplateColumns: '1.5fr 2fr 1.5fr 1fr 1fr 1fr 1fr' }}>
            <span className="text-xs font-mono text-gold">{p.booking_ref}</span>
            <span className="text-xs text-cream">{p.vendor_name}</span>
            <span className="text-xs text-muted">{p.user_name}</span>
            <span className="text-sm text-cream">AED {parseFloat(p.amount || 0).toLocaleString()}</span>
            <span className="text-sm text-red-400">-{parseFloat(p.platform_fee || 0).toLocaleString()}</span>
            <span className="text-sm text-green-400">AED {parseFloat(p.vendor_payout || 0).toLocaleString()}</span>
            <StatusBadge status={p.status} />
          </div>
        ))}
        {(!d.recent_payments || d.recent_payments.length === 0) && (
          <p className="text-sm text-muted text-center py-10">No transactions yet</p>
        )}
      </div>
    </div>
  );
}
