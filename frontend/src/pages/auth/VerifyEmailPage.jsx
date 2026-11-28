import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../../api/auth';
import Logo from '../../components/common/Logo';

// Email verification page.
// Case 1: Phone/Email link se khula -> /verify-email?token=xxxx (direct token verification)
// Case 2: Laptop/Desktop par register kiya -> /verify-email?email=xxx&sent=1
//         Yahan page live poll karta hai: jaise hi phone par user link click karega,
//         ye screen automatically verify hokar dashboard open kar degi!
export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const initialEmail = params.get('email') || '';
  const justSent = params.get('sent') === '1';

  const [status, setStatus] = useState(token ? 'verifying' : 'idle'); // idle | verifying | success | error
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const attempted = useRef(false);

  // Success handler: token save karke dashboard redirect
  const handleSuccess = useCallback((tokenValue, msg) => {
    if (tokenValue) {
      localStorage.setItem('accessToken', tokenValue);
    }
    setStatus('success');
    setMessage(msg || 'Email verified successfully! Opening your dashboard...');
    toast.success('Email verify ho gaya! Welcome to Mera Raasta.');
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1800);
  }, []);

  // Case 1: Direct link click with ?token=...
  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;
    let alive = true;

    (async () => {
      try {
        const { data } = await authAPI.verifyEmail(token);
        if (!alive) return;
        handleSuccess(data.data?.accessToken, data.message);
      } catch (err) {
        if (!alive) return;
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification link is invalid or expired.');
      }
    })();

    return () => { alive = false; };
  }, [token, handleSuccess]);

  // Case 2: Phone Verification Auto-Detection (Polling)
  // Laptop par user wait kar raha hai aur phone se link click karta hai
  useEffect(() => {
    if (token || !email || status === 'success') return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const { data } = await authAPI.checkVerificationStatus(email.trim());
        if (!isMounted) return;
        if (data.data?.verified) {
          clearInterval(interval);
          handleSuccess(data.data.accessToken, 'Phone se email verify ho gaya! Dashboard khul raha hai...');
        }
      } catch {
        // Silently retry polling
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token, email, status, handleSuccess]);

  // Manual Check Now Button
  const handleManualCheck = async () => {
    if (!email.trim()) return toast.error('Kripya registered email enter karein');
    setChecking(true);
    try {
      const { data } = await authAPI.checkVerificationStatus(email.trim());
      if (data.data?.verified) {
        handleSuccess(data.data.accessToken, 'Phone se email verify ho chuka hai! Dashboard khul raha hai...');
      } else {
        toast('Abhi phone par email link click nahi hua hai. Inbox ya Spam folder check karein.', {
          icon: '📱',
          duration: 3500,
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status check nahi ho paya');
    } finally {
      setChecking(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const cleanOtp = otpInput.replace(/\D/g, '').substring(0, 6);
    if (cleanOtp.length !== 6) return toast.error('Kripya 6-digit OTP enter karein');
    setSending(true);
    try {
      const { data } = await authAPI.verifyEmail(email, cleanOtp);
      if (data.success) {
        handleSuccess(data.data?.accessToken, data.message || 'OTP verify ho gaya!');
      } else {
        toast.error(data.message || 'OTP verify nahi hua');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verify nahi ho paya');
    } finally {
      setSending(false);
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Please enter your email');
    setSending(true);
    try {
      const { data } = await authAPI.resendVerification(email.trim());
      if (data?.data?.verified && data?.data?.accessToken) {
        handleSuccess(data.data.accessToken, data.message || 'Account verified!');
        return;
      }
      toast.success(data.message || 'Verification link dobara bhej diya gaya hai.');
      setStatus('idle');
      setMessage('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification email nahi bheja ja saka.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="w-full max-w-[480px]">
        {/* Home + Logo */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Home
          </Link>
          <Logo size="small" />
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-7 sm:p-9 text-center">
          {/* Verifying Spinner */}
          {status === 'verifying' && (
            <>
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-blue-50 flex items-center justify-center">
                <svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-2">Verifying your email</h1>
              <p className="text-gray-500 text-sm">Please wait a moment...</p>
            </>
          )}

          {/* Success State */}
          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-emerald-50 flex items-center justify-center animate-bounce">
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-2">Email Verified! 🎉</h1>
              <p className="text-gray-600 text-sm mb-6 font-medium">{message}</p>
              <button
                onClick={() => { window.location.href = '/dashboard'; }}
                className="inline-block w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-2xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 cursor-pointer"
              >
                Go to Dashboard Now →
              </button>
            </>
          )}

          {/* Idle / Waiting for verification / Resend Form */}
          {(status === 'error' || status === 'idle') && (
            <>
              <div className={`w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center ${status === 'error' ? 'bg-red-50' : 'bg-blue-50'}`}>
                <svg className={`w-8 h-8 ${status === 'error' ? 'text-red-500' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>

              <h1 className="text-2xl font-black text-gray-900 mb-2">
                {status === 'error' ? 'Link Expired ya Invalid' : 'Verify your email'}
              </h1>
              <p className="text-gray-500 text-sm mb-5">
                {status === 'error'
                  ? message
                  : 'Aapki email par verification link bhej diya gaya hai.'}
              </p>

              {/* ═══ MANUAL OTP ENTRY ═══ */}
              {status === 'idle' && email && (
                <div className="mb-5 bg-gradient-to-r from-orange-50/80 to-orange-100 border border-orange-200/60 rounded-2xl p-4 text-left shadow-sm">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                    </span>
                    <span className="text-xs font-bold text-gray-900">OTP daalein</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed mb-3">
                    Gmail se aaya 6-digit OTP daalein check karein. Agar phone par link click nahi kiya to ye dalein.
                  </p>
                  <form onSubmit={handleOtpSubmit} className="space-y-3 text-left">
                    <input
                      type="text"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, '').padStart(6, '0'))}
                      maxLength={6}
                      required
                      className="w-full px-4 py-3.5 border-2 border-orange-300 rounded-2xl text-sm focus:border-orange-500 focus:ring-0 outline-none bg-white transition-all placeholder:text-gray-400"
                      placeholder="123456"
                    />
                    <button
                      type="submit"
                      disabled={sending}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3.5 rounded-2xl font-bold text-sm disabled:opacity-50 transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40"
                    >
                      {sending ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </form>
                  <p className="text-center text-xs text-gray-400 mt-2">
                    OTP 10 minute tak valid rehta hai.
                  </p>
                </div>
              )}

              {/* ═══ LIVE PHONE VERIFICATION LISTENER BOX ═══ */}
              {status === 'idle' && email && (
                <div className="mb-5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/60 rounded-2xl p-4 text-left shadow-sm">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold text-gray-900">
                      Phone se verify karne ka intezaar hai...
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed mb-3">
                    Apne phone me Gmail open karein aur <strong>Verify Email</strong> par click karein. Jaise hi aap phone par click karenge, <strong>ye screen automatically dashboard par chali jayegi!</strong>
                  </p>
                  <button
                    type="button"
                    onClick={handleManualCheck}
                    disabled={checking}
                    className="w-full py-2.5 px-3 rounded-xl bg-white border border-blue-300 hover:bg-blue-50 text-blue-700 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {checking ? (
                      <>
                        <svg className="animate-spin w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Checking status...
                      </>
                    ) : (
                      <>
                        <span>📱 Maine Phone Se Verify Kar Liya → Abhi Kholein</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {justSent && status === 'idle' && (
                <div className="mb-5 text-left bg-emerald-50 border border-emerald-200/80 rounded-2xl px-4 py-3 flex items-start gap-2.5">
                  <span className="text-emerald-600 text-base mt-0.5">📩</span>
                  <p className="text-xs text-emerald-800 font-semibold leading-relaxed">
                    Verification email bhej diya gaya hai. Kripya Inbox ke saath <strong>Spam / Promotions</strong> folder bhi check karein.
                  </p>
                </div>
              )}

              {/* Resend Section */}
              <form onSubmit={handleResend} className="space-y-3.5 text-left pt-2 border-t border-gray-100">
                <label className="block text-xs font-semibold text-gray-600">
                  Email dobara bhejne ke liye:
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:border-blue-500 focus:ring-0 outline-none bg-white transition-all placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-2xl font-bold text-xs disabled:opacity-50 transition-all shadow-md cursor-pointer"
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

        <p className="text-center text-xs text-gray-400 mt-5">
          Link 24 ghante tak valid rehta hai. Dobara bhejne par purana link cancel ho jata hai.
        </p>
      </div>
    </div>
  );
}
