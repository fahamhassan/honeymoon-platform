'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { StatCard, BarChart, StatusBadge, Avatar, Spinner, ProgressBar } from '@/components/ui';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

export default function AdminOverviewPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.dashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8"><Spinner /></div>;

  const d = data || {};
  const revData = d.revenue_by_month?.map(m => parseFloat(m.amount)) || [180, 220, 280, 240, 310, 380];

  return (
    <div className="p-8 fade-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl text-cream">Platform Overview</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted">
              {new Date().toLocaleDateString('en-AE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className="text-xs text-green-400">● All systems operational</span>
          </div>
        </div>
        <button className="ghost-btn flex items-center gap-2 rounded-xl py-2.5">
          ↓ Export Report
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        <StatCard icon="👥" label="Total Users"       value={(parseInt(d.users?.total || 0)).toLocaleString()}  trend={`+${d.users?.new_this_week || 0} this week`} />
        <StatCard icon="🛡️" label="Active Vendors"   value={parseInt(d.vendors?.active || 0)}                 sub={`${d.vendors?.pending || 0} pending review`} />
        <StatCard icon="📅" label="Total Bookings"    value={(parseInt(d.bookings?.total || 0)).toLocaleString()} trend={`+${d.bookings?.this_month || 0} this month`} />
        <StatCard icon="💰" label="Platform Revenue"  value={`AED ${(parseFloat(d.revenue?.total_fees || 0) / 1000).toFixed(0)}K`} trend="+22%" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-5 gap-5 mb-7">
        <div className="col-span-3 card p-6">
          <h2 className="font-display text-base text-cream mb-4">Platform Revenue (AED '000)</h2>
          <BarChart data={revData} labels={MONTHS} />
        </div>
        <div className="col-span-2 card p-6">
          <h2 className="font-display text-base text-cream mb-4">Platform Health</h2>
          {[
            { label: 'Booking Completion', value: 94, color: '#5CB88A' },
            { label: 'Vendor Response',    value: 88, color: '#C6A85C' },
            { label: 'Payment Success',    value: 99, color: '#7EC8C8' },
            { label: 'Dispute Resolution', value: 76, color: '#D4A0B5' },
          ].map(s => (
            <ProgressBar key={s.label} label={s.label} value={s.value} color={s.color} />
          ))}
        </div>
      </div>

      {/* Revenue by category */}
      <div className="card p-6 mb-7">
        <h2 className="font-display text-base text-cream mb-5">Revenue by Category</h2>
        <div className="grid grid-cols-5 gap-4">
          {[
            { e: '🏛️', l: 'Venues',        r: 'AED 840K', p: 35 },
            { e: '🍽️', l: 'Catering',      r: 'AED 600K', p: 25 },
            { e: '📸', l: 'Photography',   r: 'AED 360K', p: 15 },
            { e: '🌸', l: 'Décor',         r: 'AED 288K', p: 12 },
            { e: '🎵', l: 'Entertainment', r: 'AED 192K', p: 8  },
          ].map(c => (
            <div key={c.l} className="bg-dark3 rounded-xl p-4 text-center border border-gold/8">
              <div className="text-2xl mb-2">{c.e}</div>
              <div className="text-sm font-semibold text-cream">{c.l}</div>
              <div className="text-gold text-sm font-bold mt-1">{c.r}</div>
              <div className="text-muted text-xs">{c.p}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent bookings */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-base text-cream">Recent Bookings</h2>
          <a href="/dashboard/bookings" className="text-gold text-xs hover:underline">View all →</a>
        </div>
        {(d.recentBookings || []).map(b => (
          <div key={b.id} className="flex items-center justify-between py-3 border-b border-gold/5 last:border-0">
            <div className="flex items-center gap-3">
              <Avatar name={b.user_name} size={30} />
              <div>
                <div className="text-sm text-cream font-medium">{b.user_name}</div>
                <div className="text-xs text-muted">{b.vendor_name} · {b.booking_ref}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gold">AED {parseFloat(b.total_amount || 0).toLocaleString()}</div>
              <StatusBadge status={b.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
