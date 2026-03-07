'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Spinner, PageHeader, Toast } from '@/components/ui';

const CATEGORIES = ['wedding_venue', 'catering', 'photography', 'videography', 'decor', 'entertainment', 'hair_makeup', 'wedding_cake', 'transportation', 'invitation'];

export default function VendorSettingsPage() {
  const [form,    setForm]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);
  const [pwForm,  setPwForm]  = useState({ current: '', new: '', confirm: '' });

  useEffect(() => {
    api.auth.me()
      .then(d => setForm(d.vendor || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.vendor.updateProfile(form);
      showToast('Profile updated!');
    } catch (err) {
      showToast(err.message || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return <div className="p-8"><Spinner /></div>;

  return (
    <div className="p-8 fade-up">
      <PageHeader title="Settings" sub="Manage your business profile and account" />

      <div className="grid grid-cols-3 gap-7">
        {/* Business Profile */}
        <div className="col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="font-display text-base text-cream mb-5">Business Profile</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="field">
                <label className="inp-label">Business Name</label>
                <input value={form.business_name || ''} onChange={e => f('business_name', e.target.value)} className="w-full" />
              </div>
              <div className="field">
                <label className="inp-label">Category</label>
                <select value={form.category || ''} onChange={e => f('category', e.target.value)} className="w-full">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="inp-label">Contact Email</label>
                <input type="email" value={form.email || ''} onChange={e => f('email', e.target.value)} className="w-full" />
              </div>
              <div className="field">
                <label className="inp-label">Phone</label>
                <input value={form.phone || ''} onChange={e => f('phone', e.target.value)} className="w-full" />
              </div>
              <div className="field">
                <label className="inp-label">City</label>
                <input value={form.city || ''} onChange={e => f('city', e.target.value)} placeholder="Dubai" className="w-full" />
              </div>
              <div className="field">
                <label className="inp-label">Location / Area</label>
                <input value={form.location || ''} onChange={e => f('location', e.target.value)} placeholder="e.g. Jumeirah, Dubai" className="w-full" />
              </div>
              <div className="col-span-2 field">
                <label className="inp-label">Description</label>
                <textarea value={form.description || ''} onChange={e => f('description', e.target.value)} rows={4}
                  placeholder="Tell clients about your business…" className="w-full" />
              </div>
              <div className="field">
                <label className="inp-label">Website</label>
                <input value={form.website || ''} onChange={e => f('website', e.target.value)} placeholder="https://yourbusiness.com" className="w-full" />
              </div>
              <div className="field">
                <label className="inp-label">Instagram Handle</label>
                <input value={form.instagram || ''} onChange={e => f('instagram', e.target.value)} placeholder="@yourbusiness" className="w-full" />
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} className="gold-btn mt-2 py-3 px-8 rounded-xl">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Account info */}
        <div className="space-y-5">
          <div className="card p-5">
            <h2 className="font-display text-sm text-cream mb-4">Account Status</h2>
            <div className="space-y-3">
              {[
                { label: 'Account Status', value: form.status, color: form.status === 'active' ? '#5CB88A' : '#C6A85C' },
                { label: 'Verified', value: form.is_verified ? '✓ Verified' : 'Unverified', color: form.is_verified ? '#5CB88A' : '#D4A0B5' },
                { label: 'Commission Rate', value: `${form.commission_rate || 5}%`, color: '#C6A85C' },
                { label: 'Deposit %', value: `${form.deposit_percent || 30}%`, color: '#C6A85C' },
              ].map(s => (
                <div key={s.label} className="flex justify-between items-center py-2 border-b border-gold/8 last:border-0">
                  <span className="text-xs text-muted">{s.label}</span>
                  <span className="text-xs font-semibold capitalize" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-display text-sm text-cream mb-4">Support</h2>
            <div className="space-y-2.5">
              {[
                { icon: '📧', label: 'Email Support', value: 'support@honeymoon.ae' },
                { icon: '📞', label: 'Vendor Hotline', value: '+971 4 123 4567' },
                { icon: '💬', label: 'Live Chat', value: 'Available 9am–6pm GST' },
              ].map(s => (
                <div key={s.label} className="flex items-start gap-2.5">
                  <span>{s.icon}</span>
                  <div>
                    <div className="text-xs font-medium text-cream">{s.label}</div>
                    <div className="text-xs text-muted">{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Toast {...(toast || {})} />
    </div>
  );
}
