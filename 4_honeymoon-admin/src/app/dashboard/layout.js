'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { api, clearToken } from '@/lib/api';

const NAV = [
  { href: '/dashboard',                  icon: '▦',  label: 'Dashboard'     },
  { href: '/dashboard/users',            icon: '👥', label: 'Users'         },
  { href: '/dashboard/vendors',          icon: '🛡️', label: 'Vendors',  badge: 'pending' },
  { href: '/dashboard/bookings',         icon: '📅', label: 'Bookings'      },
  { href: '/dashboard/finance',          icon: '💰', label: 'Finance'       },
  { href: '/dashboard/reports',          icon: '🚩', label: 'Reports',  badge: 'reports' },
  { href: '/dashboard/content',          icon: '🖼️', label: 'Content'       },
  { href: '/dashboard/notifications',    icon: '🔔', label: 'Notifications' },
];

export default function AdminLayout({ children }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [admin,  setAdmin]  = useState(null);
  const [badges, setBadges] = useState({});

  useEffect(() => {
    if (!localStorage.getItem('admin_token')) { router.replace('/login'); return; }
    api.auth.me()
      .then(d => setAdmin(d.user || d.admin))
      .catch(() => { clearToken(); router.replace('/login'); });

    api.admin.dashboard()
      .then(d => setBadges({
        pending: d.vendors?.pending || 0,
        reports: 0,
      }))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await api.auth.logout().catch(() => {});
    clearToken();
    router.replace('/login');
  };

  return (
    <div className="flex h-screen bg-dark overflow-hidden">
      {/* Sidebar */}
      <aside className="w-52 bg-dark2 border-r border-gold/10 flex flex-col flex-shrink-0">
        <div className="px-5 py-5 border-b border-gold/8">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="text-xl">👑</span>
            <div>
              <div className="font-display text-sm text-gold">HoneyMoon</div>
              <div className="text-[9px] text-muted tracking-widest uppercase">Admin Control</div>
            </div>
          </div>
          {admin && (
            <div className="flex items-center gap-2.5 bg-gold/8 border border-gold/15 rounded-xl px-3 py-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold to-yellow-700 flex items-center justify-center text-dark text-xs font-bold flex-shrink-0">
                {(admin.full_name || 'A')[0].toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-semibold text-cream leading-tight">{admin.full_name || 'Admin'}</div>
                <div className="text-[10px] text-gold">Super Admin</div>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const badgeCount = item.badge ? badges[item.badge] : 0;
            return (
              <Link key={item.href} href={item.href}
                className={`nav-item ${active ? 'active' : ''} justify-between`}>
                <span className="flex items-center gap-3">
                  <span className="text-base w-5 text-center">{item.icon}</span>
                  {item.label}
                </span>
                {badgeCount > 0 && (
                  <span className="bg-gold text-dark text-[9px] font-bold rounded-full px-1.5 py-px">{badgeCount}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-5">
          <button onClick={handleLogout} className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/8">
            <span className="text-base w-5 text-center">→</span>
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
