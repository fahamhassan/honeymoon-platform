'use client';
import { useState } from 'react';

// ── Status Badge ──────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  active:    'bg-green-500/15 text-green-400 border-green-500/30',
  confirmed: 'bg-green-500/15 text-green-400 border-green-500/30',
  pending:   'bg-gold/15 text-gold border-gold/30',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
  completed: 'bg-muted/15 text-muted border-muted/30',
  rejected:  'bg-red-500/15 text-red-400 border-red-500/30',
  inactive:  'bg-muted/15 text-muted border-muted/30',
  quote_sent:'bg-blue-400/15 text-blue-300 border-blue-400/30',
};

export function StatusBadge({ status }) {
  const s = (status || '').toLowerCase().replace(' ', '_');
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase border ${STATUS_STYLES[s] || 'bg-muted/10 text-muted border-muted/20'}`}>
      {status}
    </span>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon, trend }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className={`text-[11px] font-semibold ${trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-display font-semibold text-cream mb-0.5">{value}</div>
      <div className="text-xs text-muted">{label}</div>
      {sub && <div className="text-[11px] text-gold/80 mt-1">{sub}</div>}
    </div>
  );
}

// ── Mini bar chart ────────────────────────────────────────────────────────────
export function BarChart({ data, labels, color = '#C6A85C' }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-2 h-20 w-full">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-sm transition-all"
            style={{ height: `${(v / max) * 100}%`, background: `linear-gradient(180deg, ${color}, ${color}50)` }}
          />
          {labels && <span className="text-[9px] text-muted">{labels[i]}</span>}
        </div>
      ))}
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({ name, size = 32 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-dark flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38, background: 'linear-gradient(135deg, #C6A85C, #7A5C10)' }}
    >
      {initials}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, body }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <span className="text-5xl">{icon}</span>
      <div className="text-lg font-display text-cream">{title}</div>
      {body && <div className="text-sm text-muted max-w-xs">{body}</div>}
    </div>
  );
}

// ── Loading Spinner ───────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-dark2 border border-gold/20 rounded-2xl p-7 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl text-cream">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-cream text-xl leading-none">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
export function Toast({ message, type = 'success', onDone }) {
  const colors = { success: 'border-green-500/40 text-green-300', error: 'border-red-500/40 text-red-300', info: 'border-gold/40 text-gold' };
  return message ? (
    <div className={`fixed bottom-6 right-6 z-50 bg-dark2 border rounded-xl px-5 py-3.5 text-sm shadow-xl ${colors[type] || colors.info}`}>
      {message}
    </div>
  ) : null;
}

// ── Page Header ───────────────────────────────────────────────────────────────
export function PageHeader({ title, sub, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="font-display text-2xl text-cream">{title}</h1>
        {sub && <p className="text-sm text-muted mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
export function ProgressBar({ value, color = '#C6A85C', label, pct }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1.5">
        <span className="text-xs text-muted">{label}</span>
        <span className="text-xs font-semibold" style={{ color }}>{pct ?? `${value}%`}</span>
      </div>
      <div className="h-1.5 bg-dark4 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(value, 100)}%`, background: color }} />
      </div>
    </div>
  );
}
