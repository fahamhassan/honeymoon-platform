'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setToken } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.auth.login(email, password);
      setToken(data.token, data.refreshToken);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-4"
         style={{ background: 'radial-gradient(ellipse at 70% 20%, #1C0E2E 0%, #0C0910 60%)' }}>
      <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
           style={{ background: 'radial-gradient(circle, #C6A85C 0%, transparent 70%)' }} />

      <div className="w-full max-w-md fade-up">
        <div className="text-center mb-10">
          <div className="text-4xl mb-3">👑</div>
          <h1 className="font-display text-3xl text-gold tracking-wider">HoneyMoon</h1>
          <p className="text-sm text-muted mt-1 tracking-widest uppercase">Admin Control</p>
        </div>

        <div className="card p-8">
          <h2 className="font-display text-xl text-cream mb-1">Administrator Sign In</h2>
          <p className="text-sm text-muted mb-7">Restricted access — authorised personnel only</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 mb-5">{error}</div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="inp-label">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@honeymoon.ae" required className="w-full" />
            </div>
            <div>
              <label className="inp-label">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="w-full" />
            </div>
            <button type="submit" disabled={loading} className="gold-btn w-full py-3 rounded-xl text-sm">
              {loading ? 'Signing in…' : 'Access Admin Panel'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
