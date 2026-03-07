'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Avatar, Spinner, EmptyState, PageHeader, Toast } from '@/components/ui';

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`text-sm ${i <= rating ? 'text-gold' : 'text-muted/30'}`}>★</span>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews,  setReviews]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [replyId,  setReplyId]  = useState(null);
  const [replyText,setReplyText]= useState('');
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null);
  const [vendorId, setVendorId] = useState(null);

  useEffect(() => {
    api.auth.me()
      .then(d => {
        const id = d.vendor?.id;
        setVendorId(id);
        return api.vendor.reviews(id);
      })
      .then(d => setReviews(d.reviews || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleReply = async (reviewId) => {
    if (!replyText.trim()) return;
    setSaving(true);
    try {
      await api.vendor.replyReview(reviewId, replyText);
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, vendor_reply: replyText } : r));
      setReplyId(null);
      setReplyText('');
      showToast('Reply posted!');
    } catch (err) {
      showToast(err.message || 'Failed to post reply', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8"><Spinner /></div>;

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const dist = [5,4,3,2,1].map(r => ({ r, count: reviews.filter(rv => rv.rating === r).length }));

  return (
    <div className="p-8 fade-up">
      <PageHeader title="Customer Reviews" sub={`${reviews.length} review${reviews.length !== 1 ? 's' : ''}`} />

      {reviews.length === 0 ? (
        <EmptyState icon="⭐" title="No reviews yet" body="Reviews from your clients will appear here." />
      ) : (
        <div className="grid grid-cols-3 gap-7">
          {/* Rating summary */}
          <div className="card p-6">
            <div className="text-center mb-6">
              <div className="text-6xl font-display font-bold text-gold">{avg.toFixed(1)}</div>
              <Stars rating={Math.round(avg)} />
              <div className="text-xs text-muted mt-1">{reviews.length} reviews</div>
            </div>
            <div className="space-y-2">
              {dist.map(({ r, count }) => (
                <div key={r} className="flex items-center gap-2">
                  <span className="text-xs text-muted w-3">{r}</span>
                  <span className="text-gold text-xs">★</span>
                  <div className="flex-1 h-1.5 bg-dark3 rounded-full overflow-hidden">
                    <div className="h-full bg-gold rounded-full" style={{ width: `${reviews.length ? (count / reviews.length) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs text-muted w-4 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews list */}
          <div className="col-span-2 space-y-4">
            {reviews.map(r => (
              <div key={r.id} className="card p-5">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar name={r.user_name} size={36} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-sm text-cream">{r.user_name}</div>
                      <span className="text-xs text-muted">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('en-AE', { month: 'short', year: 'numeric' }) : ''}
                      </span>
                    </div>
                    <Stars rating={r.rating} />
                  </div>
                </div>
                <p className="text-sm text-muted leading-relaxed mb-3">{r.comment}</p>

                {r.vendor_reply ? (
                  <div className="bg-gold/8 border border-gold/15 rounded-xl p-3">
                    <div className="text-xs text-gold font-semibold mb-1">Your Reply</div>
                    <p className="text-xs text-cream/80">{r.vendor_reply}</p>
                  </div>
                ) : replyId === r.id ? (
                  <div>
                    <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                      rows={2} placeholder="Write a professional reply…" className="w-full text-xs mb-2" />
                    <div className="flex gap-2">
                      <button onClick={() => handleReply(r.id)} disabled={saving}
                        className="gold-btn py-1.5 px-4 rounded-lg text-xs">{saving ? 'Posting…' : 'Post Reply'}</button>
                      <button onClick={() => setReplyId(null)} className="ghost-btn py-1.5 px-4 rounded-lg text-xs">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setReplyId(r.id); setReplyText(''); }}
                    className="ghost-btn py-1.5 px-3 rounded-lg text-xs">Reply</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <Toast {...(toast || {})} />
    </div>
  );
}
