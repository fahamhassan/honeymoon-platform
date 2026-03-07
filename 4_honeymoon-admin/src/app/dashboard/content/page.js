'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Spinner, PageHeader, Modal, Toast } from '@/components/ui';

export default function ContentPage() {
  const [tab,       setTab]      = useState('banners');
  const [banners,   setBanners]  = useState([]);
  const [featured,  setFeatured] = useState([]);
  const [promos,    setPromos]   = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [showModal, setShowModal]= useState(false);
  const [form,      setForm]     = useState({});
  const [saving,    setSaving]   = useState(false);
  const [toast,     setToast]    = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([api.admin.banners(), api.admin.featured(), api.admin.promotions()])
      .then(([b, f, p]) => { setBanners(b.banners || []); setFeatured(f.featured || []); setPromos(p.promotions || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg, type='success') => { setToast({message:msg,type}); setTimeout(()=>setToast(null),3000); };

  const handleToggleBanner = async (id) => {
    try { await api.admin.toggleBanner(id); load(); showToast('Banner updated'); }
    catch(err) { showToast(err.message||'Failed', 'error'); }
  };

  const handleDeleteBanner = async (id) => {
    try { await api.admin.deleteBanner(id); load(); showToast('Banner deleted'); }
    catch(err) { showToast(err.message||'Failed', 'error'); }
  };

  const handleSaveBanner = async () => {
    setSaving(true);
    try { await api.admin.createBanner(form); setShowModal(false); setForm({}); load(); showToast('Banner created!'); }
    catch(err) { showToast(err.message||'Failed', 'error'); }
    finally { setSaving(false); }
  };

  const handleRemoveFeatured = async (vendorId) => {
    try { await api.admin.removeFeatured(vendorId); load(); showToast('Removed from featured'); }
    catch(err) { showToast(err.message||'Failed', 'error'); }
  };

  const f = (k,v) => setForm(p=>({...p,[k]:v}));

  if (loading) return <div className="p-8"><Spinner /></div>;

  return (
    <div className="p-8 fade-up">
      <PageHeader title="Content Management" sub="Manage banners, featured vendors, and promotions" />

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gold/10 pb-3">
        {[['banners','🖼️ Banners'],['featured','⭐ Featured'],['promos','🏷️ Promotions']].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all ${tab===t?'bg-gold/10 text-gold border border-gold/30':'text-muted hover:text-cream'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Banners */}
      {tab === 'banners' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowModal(true)} className="gold-btn rounded-xl">+ New Banner</button>
          </div>
          {banners.length === 0 ? <p className="text-sm text-muted text-center py-12">No banners created yet</p> : (
            <div className="grid grid-cols-2 gap-4">
              {banners.map(b => (
                <div key={b.id} className={`card p-4 ${!b.is_active ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-cream">{b.title}</div>
                      <div className="text-xs text-muted">{b.subtitle}</div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${b.is_active ? 'bg-green-500/15 text-green-400' : 'bg-muted/10 text-muted'}`}>
                      {b.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted mb-3">Position: {b.sort_order || 0}</div>
                  <div className="flex gap-2">
                    <button onClick={() => handleToggleBanner(b.id)} className="ghost-btn flex-1 py-1.5 text-xs">
                      {b.is_active ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={() => handleDeleteBanner(b.id)} className="red-btn flex-1 py-1.5 text-xs">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Featured Vendors */}
      {tab === 'featured' && (
        <div className="card overflow-hidden">
          <div className="tbl-hdr" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr' }}>
            <span>Vendor</span><span>Category</span><span>Rating</span><span>Bookings</span><span>Action</span>
          </div>
          {featured.map(v => (
            <div key={v.id} className="tbl-row" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr' }}>
              <div className="font-medium text-cream">{v.business_name}</div>
              <span className="text-xs text-muted capitalize">{v.category?.replace('_',' ')}</span>
              <span className="text-sm text-gold">{v.rating ? `${parseFloat(v.rating).toFixed(1)} ★` : '—'}</span>
              <span className="text-sm">{v.booking_count || 0}</span>
              <button onClick={() => handleRemoveFeatured(v.id)} className="red-btn py-1 px-3 text-xs">Remove</button>
            </div>
          ))}
          {featured.length === 0 && <p className="text-sm text-muted text-center py-10">No featured vendors</p>}
        </div>
      )}

      {/* Promotions */}
      {tab === 'promos' && (
        <div className="card overflow-hidden">
          <div className="tbl-hdr" style={{ gridTemplateColumns: '1.5fr 2fr 1fr 1fr 1fr 1fr' }}>
            <span>Code</span><span>Description</span><span>Discount</span><span>Uses</span><span>Expires</span><span>Status</span>
          </div>
          {promos.map(p => (
            <div key={p.id} className="tbl-row" style={{ gridTemplateColumns: '1.5fr 2fr 1fr 1fr 1fr 1fr' }}>
              <span className="font-mono text-gold font-bold">{p.code}</span>
              <span className="text-xs text-muted">{p.description}</span>
              <span className="text-sm text-green-400">{p.discount_type === 'percent' ? `${p.discount_value}%` : `AED ${p.discount_value}`}</span>
              <span className="text-sm">{p.use_count || 0}/{p.max_uses || '∞'}</span>
              <span className="text-xs text-muted">{p.expires_at ? new Date(p.expires_at).toLocaleDateString('en-AE') : '—'}</span>
              <span className={`text-xs font-semibold ${p.is_active ? 'text-green-400' : 'text-muted'}`}>{p.is_active ? 'Active' : 'Inactive'}</span>
            </div>
          ))}
          {promos.length === 0 && <p className="text-sm text-muted text-center py-10">No promotions yet</p>}
        </div>
      )}

      {/* New Banner Modal */}
      {showModal && (
        <Modal title="Create Banner" onClose={() => { setShowModal(false); setForm({}); }}>
          <div className="space-y-4">
            {[
              { k: 'title',    label: 'Title *',       type: 'text',   ph: 'e.g. Summer Wedding Collection' },
              { k: 'subtitle', label: 'Subtitle',       type: 'text',   ph: 'e.g. Book your dream venue today' },
              { k: 'cta_text', label: 'CTA Button',     type: 'text',   ph: 'e.g. Explore Now' },
              { k: 'cta_link', label: 'CTA Link',       type: 'text',   ph: '/vendors?category=wedding_venue' },
            ].map(s => (
              <div key={s.k} className="field">
                <label className="inp-label">{s.label}</label>
                <input type={s.type} value={form[s.k]||''} onChange={e=>f(s.k,e.target.value)} placeholder={s.ph} className="w-full" />
              </div>
            ))}
            <div className="field">
              <label className="inp-label">Background Gradient</label>
              <input value={form.bg_gradient||''} onChange={e=>f('bg_gradient',e.target.value)} placeholder="e.g. linear-gradient(135deg, #1A0E2E, #2D1B4E)" className="w-full" />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={handleSaveBanner} disabled={saving} className="gold-btn flex-1 py-3 rounded-xl">
              {saving ? 'Creating…' : 'Create Banner'}
            </button>
            <button onClick={() => { setShowModal(false); setForm({}); }} className="ghost-btn flex-1 py-3 rounded-xl">Cancel</button>
          </div>
        </Modal>
      )}

      <Toast {...(toast||{})} />
    </div>
  );
}
