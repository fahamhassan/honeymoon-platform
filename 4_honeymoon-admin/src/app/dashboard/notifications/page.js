'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { PageHeader, Toast } from '@/components/ui';

const TYPES = ['info', 'promo', 'alert', 'payment', 'booking'];
const AUDIENCES = [
  { value: 'all',      label: 'All Users',           sub: 'Send to every registered user' },
  { value: 'active',   label: 'Active Users',        sub: 'Users with at least one booking' },
  { value: 'gold',     label: 'Gold Tier & Above',   sub: 'Gold and Diamond tier users' },
  { value: 'diamond',  label: 'Diamond Tier',        sub: 'Top-tier loyalty members' },
];

export default function NotificationsPage() {
  const [form,    setForm]    = useState({ title: '', body: '', type: 'info', audience: 'all' });
  const [sending, setSending] = useState(false);
  const [toast,   setToast]   = useState(null);

  const showToast = (msg, type='success') => { setToast({message:msg,type}); setTimeout(()=>setToast(null),3500); };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSend = async () => {
    if (!form.title || !form.body) return;
    setSending(true);
    try {
      const res = await api.admin.sendNotification(form);
      showToast(`Notification sent to ${res.sent || 0} users!`);
      setForm({ title: '', body: '', type: 'info', audience: 'all' });
    } catch (err) {
      showToast(err.message || 'Failed to send', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-8 fade-up">
      <PageHeader title="Send Notification" sub="Broadcast messages to users on the platform" />

      <div className="grid grid-cols-3 gap-7">
        <div className="col-span-2 card p-7">
          <h2 className="font-display text-base text-cream mb-5">Compose Notification</h2>

          <div className="field mb-5">
            <label className="inp-label">Notification Type</label>
            <div className="flex gap-2 flex-wrap mt-2">
              {TYPES.map(t => (
                <button key={t} onClick={() => f('type', t)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize cursor-pointer border transition-all ${form.type === t ? 'border-gold/50 bg-gold/10 text-gold' : 'border-gold/15 text-muted hover:border-gold/30'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="field mb-5">
            <label className="inp-label">Title *</label>
            <input value={form.title} onChange={e => f('title', e.target.value)}
              placeholder="e.g. 🎉 Exclusive Offer for Diamond Members" className="w-full" maxLength={80} />
            <div className="text-[10px] text-muted mt-1">{form.title.length}/80</div>
          </div>

          <div className="field mb-5">
            <label className="inp-label">Message *</label>
            <textarea value={form.body} onChange={e => f('body', e.target.value)} rows={4}
              placeholder="Write your notification message here…" className="w-full" maxLength={300} />
            <div className="text-[10px] text-muted mt-1">{form.body.length}/300</div>
          </div>

          {/* Audience */}
          <div className="field mb-6">
            <label className="inp-label">Target Audience</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {AUDIENCES.map(a => (
                <button key={a.value} onClick={() => f('audience', a.value)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${form.audience === a.value ? 'border-gold/50 bg-gold/8' : 'border-gold/10 hover:border-gold/25'}`}>
                  <div className={`text-sm font-semibold ${form.audience === a.value ? 'text-gold' : 'text-cream'}`}>{a.label}</div>
                  <div className="text-xs text-muted mt-0.5">{a.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {(form.title || form.body) && (
            <div className="bg-dark3 border border-gold/15 rounded-2xl p-4 mb-6">
              <div className="text-xs text-muted mb-2 uppercase tracking-widest">Preview</div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-dark2 rounded-full flex items-center justify-center text-base flex-shrink-0">🌙</div>
                <div>
                  <div className="text-sm font-semibold text-cream">{form.title || 'Notification Title'}</div>
                  <div className="text-xs text-muted mt-0.5 leading-relaxed">{form.body || 'Message body will appear here…'}</div>
                </div>
              </div>
            </div>
          )}

          <button onClick={handleSend} disabled={sending || !form.title || !form.body}
            className="gold-btn w-full py-3.5 rounded-xl disabled:opacity-40">
            {sending ? 'Sending…' : '📤 Send Notification'}
          </button>
        </div>

        {/* Tips panel */}
        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="font-display text-sm text-cream mb-3">Best Practices</h3>
            <ul className="space-y-2.5">
              {[
                'Keep titles under 50 characters for mobile',
                'Use emoji sparingly to stand out',
                'Include a clear call to action',
                'Send at peak times: 9–11am or 6–8pm GST',
                'Test with small audience first',
              ].map(t => (
                <li key={t} className="flex items-start gap-2 text-xs text-muted">
                  <span className="text-gold mt-0.5">•</span>{t}
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5">
            <h3 className="font-display text-sm text-cream mb-3">Audience Size</h3>
            {AUDIENCES.map(a => (
              <div key={a.value} className="flex justify-between py-2 border-b border-gold/8 last:border-0">
                <span className="text-xs text-muted">{a.label}</span>
                <span className={`text-xs font-semibold ${form.audience === a.value ? 'text-gold' : 'text-cream'}`}>
                  {a.value === 'all' ? '12,480' : a.value === 'active' ? '8,920' : a.value === 'gold' ? '2,340' : '580'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Toast {...(toast||{})} />
    </div>
  );
}
