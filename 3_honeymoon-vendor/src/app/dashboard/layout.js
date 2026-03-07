'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { api, clearToken } from '@/lib/api';

const NAV = [
  { href: '/dashboard',           icon: '▦',  label: 'Overview'   },
  { href: '/dashboard/bookings',  icon: '📅', label: 'Bookings'   },
  { href: '/dashboard/services',  icon: '📦', label: 'Services'   },
  { href: '/dashboard/earnings',  icon: '💰', label: 'Earnings'   },
  { href: '/dashboard/reviews',   icon: '⭐', label: 'Reviews'    },
  { href: '/dashboard/settings',  icon: '⚙️', label: 'Settings'   },
];

export default function DashboardLayout({ children }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [vendor, setVendor] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem('vendor_token')) {
      router.replace('/login');
      return;
    }
    api.auth.me()
      .then(d => setVendor(d.vendor))
      .catch(() => { clearToken(); router.replace('/login'); });
  }, []);

  const handleLogout = async () => {
    await api.auth.logout().catch(() => {});
    clearToken();
    router.replace('/login');
  };

  return (
    <div className="flex h-screen bg-dark overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-52 bg-dark2 border-r border-gold/10 flex flex-col flex-shrink-0">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-gold/8">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="text-xl">🌙</span>
            <div>
              <div className="font-display text-sm text-gold">HoneyMoon</div>
              <div className="text-[9px] text-muted tracking-widest uppercase">Vendor Portal</div>
            </div>
          </div>
          {/* Vendor card */}
          {vendor && (
            <div className="bg-gold/8 border border-gold/15 rounded-xl p-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🏛️</span>
                <div>
                  <div className="text-xs font-semibold text-cream leading-tight">{vendor.business_name}</div>
                  <div className="text-[10px] text-muted">{vendor.category}</div>
                  {vendor.is_verified && (
                    <span className="text-[9px] text-gold font-bold tracking-wider">✓ VERIFIED</span>
                  )}
                </div>
              </div>
              {vendor.rating && (
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-gold text-xs">★</span>
                  <span className="text-xs text-cream font-semibold">{parseFloat(vendor.rating).toFixed(1)}</span>
                  <span className="text-[10px] text-muted">({vendor.review_count} reviews)</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`nav-item ${active ? 'active' : ''}`}>
                <span className="text-base w-5 text-center">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5">
          <button onClick={handleLogout}
            className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/8">
            <span className="text-base w-5 text-center">→</span>
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
