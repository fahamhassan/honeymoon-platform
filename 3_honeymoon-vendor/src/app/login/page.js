'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setToken } from '@/lib/api';

export default function VendorLoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [showPw,   setShowPw]   = useState(false);

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
         style={{ background: 'radial-gradient(ellipse at 30% 20%, #1C0E2E 0%, #0C0910 60%)' }}>

      {/* Decorative glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
           style={{ background: 'radial-gradient(circle, #C6A85C 0%, transparent 70%)' }} />

      <div className="w-full max-w-md fade-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-4xl mb-3">🌙</div>
          <h1 className="font-display text-3xl text-gold tracking-wider">HoneyMoon</h1>
          <p className="text-sm text-muted mt-1 tracking-widest uppercase">Vendor Portal</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="font-display text-xl text-cream mb-1">Welcome back</h2>
          <p className="text-sm text-muted mb-7">Sign in to manage your services and bookings</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="inp-label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@business.com"
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="inp-label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pr-10"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-cream text-sm">
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="gold-btn w-full py-3 rounded-xl text-sm">
              {loading ? 'Signing in…' : 'Sign In to Portal'}
            </button>
          </form>

          <div className="border-t border-gold/10 mt-7 pt-5 text-center">
            <p className="text-xs text-muted">
              Not a vendor yet?{' '}
              <span className="text-gold cursor-pointer hover:underline">Apply to join →</span>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted/50 mt-6">
          © 2026 HoneyMoon Platform · Dubai, UAE
        </p>
      </div>
    </div>
  );
}
