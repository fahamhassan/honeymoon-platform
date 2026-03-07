'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { StatCard, BarChart, StatusBadge, Spinner, PageHeader } from '@/components/ui';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function EarningsPage() {
  const [payments, setPayments] = useState([]);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([api.payments.list(), api.vendor.stats()])
      .then(([p, s]) => { setPayments(p.payments || []); setStats(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8"><Spinner /></div>;

  const paid       = payments.filter(p => p.status === 'paid');
  const totalGross = paid.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const totalPayout= paid.reduce((s, p) => s + parseFloat(p.vendor_payout || p.amount || 0), 0);
  const totalFees  = paid.reduce((s, p) => s + parseFloat(p.platform_fee || 0), 0);
  const pending    = payments.filter(p => p.status === 'pending').reduce((s, p) => s + parseFloat(p.amount || 0), 0);

  // Build monthly data
  const monthlyData = Array(6).fill(0);
  paid.forEach(p => {
    const m = new Date(p.created_at).getMonth();
    if (m >= 6) monthlyData[m - 6] = (monthlyData[m - 6] || 0) + parseFloat(p.vendor_payout || p.amount || 0);
  });

  return (
    <div className="p-8 fade-up">
      <PageHeader title="Earnings" sub="Your revenue overview and payout history" />

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        <StatCard icon="💰" label="Gross Revenue"  value={`AED ${(totalGross / 1000).toFixed(0)}K`}   sub="all time" />
        <StatCard icon="🏦" label="Your Payout"    value={`AED ${(totalPayout / 1000).toFixed(0)}K`}  sub="after platform fees" />
        <StatCard icon="🧾" label="Platform Fees"  value={`AED ${(totalFees / 1000).toFixed(0)}K`}    sub="5% per transaction" />
        <StatCard icon="⏳" label="Pending Payout" value={`AED ${(pending / 1000).toFixed(0)}K`}      sub="awaiting settlement" />
      </div>

      {/* Chart */}
      <div className="card p-6 mb-7">
        <h2 className="font-display text-base text-cream mb-4">Monthly Payouts (AED)</h2>
        <BarChart data={monthlyData.length ? monthlyData : [38000, 55000, 72000, 60000, 84000, 96000]}
                  labels={MONTHS.slice(0, 6)} color="#5CB88A" />
      </div>

      {/* Transaction table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gold/10">
          <h2 className="font-display text-base text-cream">Transaction History</h2>
        </div>
        <div className="tbl-hdr" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr' }}>
          <span>Booking</span><span>Client</span><span>Gross</span><span>Platform Fee</span><span>Your Payout</span><span>Status</span>
        </div>
        {payments.length === 0 ? (
          <p className="text-sm text-muted text-center py-12">No transactions yet</p>
        ) : (
          payments.map(p => (
            <div key={p.id} className="tbl-row" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr' }}>
              <div>
                <div className="text-sm text-cream font-medium">{p.booking_ref}</div>
                <div className="text-[10px] text-muted">
                  {p.created_at ? new Date(p.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                </div>
              </div>
              <span className="text-sm text-muted">{p.counterpart_name}</span>
              <span className="text-sm text-cream">AED {parseFloat(p.amount || 0).toLocaleString()}</span>
              <span className="text-sm text-red-400">-AED {parseFloat(p.platform_fee || 0).toLocaleString()}</span>
              <span className="text-sm font-semibold text-green-400">AED {parseFloat(p.vendor_payout || p.amount || 0).toLocaleString()}</span>
              <StatusBadge status={p.status} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
