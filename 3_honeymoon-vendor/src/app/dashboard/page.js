'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { StatCard, BarChart, Avatar, StatusBadge, Spinner, ProgressBar } from '@/components/ui';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

export default function VendorOverviewPage() {
  const [stats,    setStats]    = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([api.vendor.stats(), api.vendor.bookings({ limit: 5 })])
      .then(([s, b]) => { setStats(s); setBookings(b.bookings || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8"><Spinner /></div>;

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-AE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Build sparkline from earnings_by_month if available
  const revData = stats?.earnings_by_month?.map(m => parseFloat(m.amount)) || [38, 55, 72, 60, 84, 96];
  const bookData = stats?.bookings_by_month?.map(m => parseInt(m.count)) || [8, 12, 15, 11, 18, 21];

  return (
    <div className="p-8 fade-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl text-cream">{greeting} 👋</h1>
          <p className="text-sm text-muted mt-0.5">{dateStr} · Dubai, UAE</p>
        </div>
        <a href="/dashboard/services" className="gold-btn px-5 py-2.5 rounded-xl text-sm no-underline">
          + Add Service
        </a>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        <StatCard icon="💰" label="Total Revenue"  value={`AED ${(parseFloat(stats?.total_revenue || 0) / 1000).toFixed(0)}K`} trend={`+${stats?.revenue_growth || 18}%`} sub="this month" />
        <StatCard icon="📅" label="Total Bookings" value={stats?.total_bookings || 0}  trend={`+${stats?.bookings_this_week || 8}`} sub="this week" />
        <StatCard icon="⭐" label="Avg Rating"     value={`${parseFloat(stats?.avg_rating || 4.9).toFixed(1)} ★`} sub={`${stats?.review_count || 0} reviews`} />
        <StatCard icon="⚡" label="Response Rate"  value={`${stats?.response_rate || 98}%`} sub="~2hr avg" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-5 gap-5 mb-7">
        {/* Revenue trend */}
        <div className="col-span-3 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base text-cream">Revenue Trend</h2>
            <div className="flex gap-1.5">
              {['6M', '1Y', 'All'].map((p, i) => (
                <button key={p} className={`text-[10px] px-2.5 py-1 rounded-md border cursor-pointer ${i === 0 ? 'border-gold/50 text-gold bg-gold/10' : 'border-gold/15 text-muted hover:border-gold/30'}`}>{p}</button>
              ))}
            </div>
          </div>
          <BarChart data={revData} labels={MONTHS} />
        </div>

        {/* This month */}
        <div className="col-span-2 card p-5">
          <h2 className="font-display text-base text-cream mb-4">This Month</h2>
          {[
            { l: 'New Bookings', v: stats?.bookings_this_month || 21, total: 21, c: '#C6A85C' },
            { l: 'Confirmed',    v: stats?.confirmed_this_month || 17,  total: 21, c: '#5CB88A' },
            { l: 'Pending',      v: stats?.pending_this_month || 3,   total: 21, c: '#D4A0B5' },
            { l: 'Cancelled',    v: stats?.cancelled_this_month || 1,  total: 21, c: '#D46A6A' },
          ].map(s => (
            <ProgressBar key={s.l} label={s.l} value={Math.round((s.v / s.total) * 100)} color={s.c} pct={s.v} />
          ))}
        </div>
      </div>

      {/* Recent bookings */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-base text-cream">Recent Bookings</h2>
          <a href="/dashboard/bookings" className="text-gold text-xs hover:underline">View all →</a>
        </div>
        {bookings.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">No bookings yet</p>
        ) : (
          bookings.slice(0, 5).map(b => (
            <div key={b.id} className="flex items-center justify-between py-3 border-b border-gold/5 last:border-0">
              <div className="flex items-center gap-3">
                <Avatar name={b.user_name} size={32} />
                <div>
                  <div className="text-sm font-medium text-cream">{b.user_name}</div>
                  <div className="text-xs text-muted">{b.package_name} · {b.booking_ref}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gold">AED {parseFloat(b.total_amount || 0).toLocaleString()}</div>
                <StatusBadge status={b.status} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
