import { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../../api/aiCommunity';
import { useLanguage } from '../../contexts/LanguageContext';
import BackButton from '../../components/common/BackButton';

export default function AICommunityPage() {
  const { lang, t } = useLanguage();
  const [msg, setMsg] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat, loading]);

  const send = async () => {
    if (!msg.trim() || loading) return;
    const m = msg.trim(); setMsg('');
    setChat(p => [...p, { role: 'user', content: m }]);
    setLoading(true);
    try {
      const { data } = await aiAPI.chat({ type: 'counselor', message: m });
      setChat(p => [...p, { role: 'ai', content: data.data?.response || t('aiResponseDefault') }]);
    } catch {
      setChat(p => [...p, { role: 'ai', content: t('serviceUnavailable') }]);
    }
    setLoading(false);
  };

  const quickPrompts = [t('q1'), t('q2'), t('q3'), t('q4'), t('q5')];

  return (
    <div className="max-w-4xl mx-auto">
      <style>{`
        @keyframes msgIn { 0%{opacity:0;transform:translateY(10px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes aiPulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes orbMove { 0%,100%{transform:translate(0,0)} 33%{transform:translate(15px,-10px)} 66%{transform:translate(-10px,15px)} }
        @keyframes fadeInUp { 0%{opacity:0;transform:translateY(15px)} 100%{opacity:1;transform:translateY(0)} }
      `}</style>

      <BackButton to="/dashboard" label={t('back')} />

      {/* Header */}
      <div className="mb-6" style={{ animation: 'fadeInUp 0.5s ease' }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-violet-500/20">🤖</div>
          <div>
            <h1 className="text-2xl font-black text-white">{t('aiCoach')}</h1>
            <p className="text-sm text-white/30">{lang === 'hi' ? 'हिंदी और English दोनों में बात करें' : 'Talk in Hindi or English — I understand both!'}</p>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="relative bg-white/[0.02] border border-white/[0.04] rounded-3xl overflow-hidden" style={{ animation: 'fadeInUp 0.6s ease 0.1s both' }}>
        {/* Background orbs */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" style={{ animation: 'orbMove 12s ease-in-out infinite' }} />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" style={{ animation: 'orbMove 10s ease-in-out 3s infinite' }} />

        {/* Chat Messages */}
        <div className="min-h-[400px] max-h-[500px] overflow-y-auto p-6 space-y-4 relative z-10">
          {chat.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/10 rounded-3xl flex items-center justify-center text-4xl mb-6" style={{ animation: 'fadeInUp 0.5s ease' }}>🤖</div>
              <h3 className="text-lg font-bold text-white mb-2">{lang === 'hi' ? 'आपका AI करियर कोच' : 'Your AI Career Coach'}</h3>
              <p className="text-sm text-white/30 text-center max-w-md mb-8">
                {lang === 'hi' ? 'नीचे दिए गए किसी भी प्रश्न पर क्लिक करें या अपना सवाल टाइप करें।' : 'Click any question below or type your own. I respond in Hindi or English!'}
              </p>

              {/* Quick Prompts */}
              <div className="w-full max-w-lg space-y-2">
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-3">{t('quickQuestions')}</p>
                {quickPrompts.map((q, i) => (
                  <button key={i} onClick={() => { setMsg(q); inputRef.current?.focus(); }}
                    className="w-full text-left px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-sm text-white/50 hover:text-white/80 hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-300 flex items-center gap-3 group"
                    style={{ animation: `fadeInUp 0.4s ease ${0.2 + i * 0.08}s both` }}>
                    <span className="w-8 h-8 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/10 rounded-lg flex items-center justify-center text-xs shrink-0 group-hover:scale-110 transition-transform">💡</span>
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {chat.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`} style={{ animation: 'msgIn 0.3s ease' }}>
              {m.role === 'ai' && (
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mr-2.5 shrink-0 shadow-lg shadow-violet-500/20">
                  <span className="text-white text-[9px] font-bold">AI</span>
                </div>
              )}
              <div className={`rounded-2xl px-4 py-3 max-w-[75%] text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-gradient-to-br from-blue-600/30 to-indigo-600/30 border border-blue-500/10 text-white/90'
                  : 'bg-white/[0.03] border border-white/[0.05] text-white/70'
              }`}>
                <div className="whitespace-pre-line">{m.content}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start" style={{ animation: 'msgIn 0.3s ease' }}>
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mr-2.5 shrink-0 shadow-lg shadow-violet-500/20">
                <span className="text-white text-[9px] font-bold">AI</span>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-violet-400 rounded-full" style={{ animation: 'aiPulse 1.2s ease-in-out infinite' }} />
                  <div className="w-2 h-2 bg-violet-400 rounded-full" style={{ animation: 'aiPulse 1.2s ease-in-out 0.2s infinite' }} />
                  <div className="w-2 h-2 bg-violet-400 rounded-full" style={{ animation: 'aiPulse 1.2s ease-in-out 0.4s infinite' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-white/[0.04] p-4 bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <input ref={inputRef} value={msg} onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder={t('typeMessage')}
              disabled={loading}
              className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:bg-white/[0.06] focus:border-white/[0.12] outline-none transition-all disabled:opacity-50" />
            <button onClick={send} disabled={!msg.trim() || loading}
              className="w-11 h-11 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl flex items-center justify-center hover:from-violet-500 hover:to-purple-500 disabled:opacity-30 transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:-translate-y-0.5 active:scale-95">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-white/15 mt-2 text-center">
            {lang === 'hi' ? 'AI जवाब सटीक नहीं हो सकते। महत्वपूर्ण निर्णयों के लिए विशेषज्ञों से सलाह लें।' : 'AI responses may not be accurate. Consult experts for important decisions.'}
          </p>
        </div>
      </div>
    </div>
  );
}