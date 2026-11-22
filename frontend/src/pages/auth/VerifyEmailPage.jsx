import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../../api/auth';
import Logo from '../../components/common/Logo';

// Email verification page.
// Link format: /verify-email?token=xxxx  (email se aata hai)
// Token ke bina: email daal kar dobara verification link bhej sakte hain.
export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const initialEmail = params.get('email') || '';
  const justSent = params.get('sent') === '1';

  const [status, setStatus] = useState(token ? 'verifying' : 'idle'); // idle | verifying | success | error
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [sending, setSending] = useState(false);
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;
    let alive = true;

    (async () => {
      try {
        const { data } = await authAPI.verifyEmail(token);
        if (!alive) return;
        setStatus('success');
        setMessage(data.message || 'Email verified successfully.');
      } catch (err) {
        if (!alive) return;
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification link is invalid or expired.');
      }
    })();

    return () => { alive = false; };
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Please enter your email');
    setSending(true);
    try {
      const { data } = await authAPI.resendVerification(email.trim());
      toast.success(data.message || 'Verification link sent.');
      setStatus('idle');
      setMessage('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send verification email.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="w-full max-w-[460px]">
        {/* Home + Logo */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Home
          </Link>
          <Logo size="small" />
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          {/* Verifying */}
          {status === 'verifying' && (
            <>
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-blue-50 flex items-center justify-center">
                <svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Verifying your email</h1>
              <p className="text-gray-500 text-sm">Please wait a moment...</p>
            </>
          )}

          {/* Success */}
          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-green-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Email verified!</h1>
              <p className="text-gray-500 text-sm mb-6">{message}</p>
              <Link to="/login" className="inline-block w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-2xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25">
                Go to Login
              </Link>
            </>
          )}

          {/* Error / no token / resend */}
          {(status === 'error' || status === 'idle') && (
            <>
              <div className={`w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center ${status === 'error' ? 'bg-red-50' : 'bg-blue-50'}`}>
                <svg className={`w-8 h-8 ${status === 'error' ? 'text-red-500' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>

              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
                {status === 'error' ? 'Link expired or invalid' : 'Verify your email'}
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                {status === 'error'
                  ? message
                  : justSent
                    ? 'We sent a verification link to your email. Click it to activate your account.'
                    : 'Enter your registered email and we will send a fresh verification link.'}
              </p>

              {justSent && status === 'idle' && (
                <div className="mb-5 text-left bg-green-50 border border-green-100 rounded-2xl px-4 py-3">
                  <p className="text-xs text-green-700 font-semibold">Verification email sent. Inbox ke saath spam folder bhi check karein.</p>
                </div>
              )}

              <form onSubmit={handleResend} className="space-y-4 text-left">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl text-sm focus:border-blue-500 focus:ring-0 outline-none bg-white transition-all placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-2xl font-bold text-sm disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                >
                  {sending ? 'Sending...' : 'Resend verification link'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-400 mt-6">
                Already verified?{' '}
                <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700">Login</Link>
              </p>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Link 24 ghante tak valid rehta hai. Dobara bhejne par purana link cancel ho jata hai.
        </p>
      </div>
    </div>
  );
}
