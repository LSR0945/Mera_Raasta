import { useState, useRef, useEffect, useCallback } from 'react';
import { aiAPI } from '../../api/aiCommunity';
import { useLanguage } from '../../contexts/LanguageContext';
import BackButton from '../../components/common/BackButton';

export default function AICommunityPage() {
  const { lang, t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingText]);

  const typeMessage = useCallback((text, onComplete) => {
    setIsTyping(true);
    setTypingText('');
    let i = 0;
    const speed = 10;
    const chunkSize = 4;

    typingRef.current = setInterval(() => {
      if (i < text.length) {
        const nextChunk = text.slice(i, i + chunkSize);
        setTypingText(prev => prev + nextChunk);
        i += chunkSize;
      } else {
        clearInterval(typingRef.current);
        typingRef.current = null;
        setIsTyping(false);
        setTypingText('');
        onComplete(text);
      }
    }, speed);
  }, []);

  useEffect(() => {
    return () => {
      if (typingRef.current) clearInterval(typingRef.current);
    };
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading || isTyping) return;
    const msg = input.trim();
    setInput('');

    setMessages(prev => [...prev, { role: 'user', content: msg, id: Date.now() }]);
    setLoading(true);

    try {
      const { data } = await aiAPI.chat({ type: 'counselor', message: msg });

      if (data.success && data.data?.response) {
        typeMessage(data.data.response, (fullText) => {
          setMessages(prev => [...prev, { role: 'ai', content: fullText, id: Date.now() + 1 }]);
          setLoading(false);
        });
      } else {
        const errMsg = lang === 'hi'
          ? 'माफ़ कीजिए, कुछ गलत हो गया। कृपया दोबारा try करें।'
          : 'Sorry, something went wrong. Please try again.';
        typeMessage(errMsg, (fullText) => {
          setMessages(prev => [...prev, { role: 'ai', content: fullText, id: Date.now() + 1 }]);
          setLoading(false);
        });
      }
    } catch (err) {
      console.error('AI Chat error:', err);
      let errMsg;
      if (err.response?.status === 401) {
        errMsg = lang === 'hi'
          ? 'आपका session खत्म हो गया है। कृपया दोबारा login करें।'
          : 'Your session has expired. Please login again.';
      } else if (err.response?.status === 429) {
        errMsg = lang === 'hi'
          ? 'बहुत ज़्यादा requests भेज दीं। कुछ देर रुककर दोबारा try करें।'
          : 'Too many requests. Please wait a moment and try again.';
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      } else {
        errMsg = lang === 'hi'
          ? 'सर्वर से जुड़ नहीं पा रहे। कृपया server check करें और दोबारा try करें।'
          : 'Cannot connect to server. Please check if the server is running and try again.';
      }
      typeMessage(errMsg, (fullText) => {
        setMessages(prev => [...prev, { role: 'ai', content: fullText, id: Date.now() + 1 }]);
        setLoading(false);
      });
    }
  };

  const newChat = async () => {
    if (typingRef.current) clearInterval(typingRef.current);
    typingRef.current = null;
    setIsTyping(false);
    setTypingText('');
    setLoading(false);
    setMessages([]);
    try { await aiAPI.clearHistory(); } catch {}
  };

  const quickPrompts = [
    { icon: '🎯', text: t('q1') },
    { icon: '💼', text: t('q2') },
    { icon: '📄', text: t('q3') },
    { icon: '🧠', text: t('q4') },
    { icon: '🎤', text: t('q5') },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <style>{`
        @keyframes msgSlideIn { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes orbFloat { 0%,100%{transform:translate(0,0)} 33%{transform:translate(12px,-8px)} 66%{transform:translate(-8px,12px)} }
        @keyframes fadeUp { 0%{opacity:0;transform:translateY(12px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes dotBounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
      `}</style>

      <BackButton to="/dashboard" label={t('back')} />

      <div className="flex items-center justify-between mb-6" style={{ animation: 'fadeUp 0.5s ease' }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-violet-500/20 relative">
            🤖
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-[#0a0a1a]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">{t('aiCoach')}</h1>
            <p className="text-sm text-white/30">{lang === 'hi' ? 'हिंदी और English दोनों में बात करें' : 'Talk in Hindi or English — I understand both!'}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={newChat}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm font-medium text-white/50 hover:text-white/80 hover:bg-white/[0.08] transition-all hover:-translate-y-0.5 active:scale-95">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t('newChat')}
          </button>
        )}
      </div>

      <div className="relative bg-white/[0.02] border border-white/[0.04] rounded-3xl overflow-hidden" style={{ animation: 'fadeUp 0.6s ease 0.1s both' }}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" style={{ animation: 'orbFloat 14s ease-in-out infinite' }} />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" style={{ animation: 'orbFloat 12s ease-in-out 4s infinite' }} />

        <div className="min-h-[420px] max-h-[520px] overflow-y-auto p-6 space-y-5 relative z-10 scroll-smooth">
          {messages.length === 0 && !isTyping && !loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/10 rounded-3xl flex items-center justify-center text-5xl mb-6 relative" style={{ animation: 'fadeUp 0.5s ease' }}>
                🤖
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-[#0a0a1a] animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{lang === 'hi' ? 'नमस्ते! मैं आपका AI करियर कोच हूँ' : 'Hello! I\'m your AI Career Coach'}</h3>
              <p className="text-sm text-white/25 text-center max-w-md mb-8 leading-relaxed">
                {lang === 'hi' ? 'मैं करियर, कौशल, शिक्षा और भविष्य के बारे में आपकी मदद कर सकता हूँ। नीचे किसी भी सवाल पर क्लिक करें या अपना सवाल टाइप करें।' : 'I can help you with careers, skills, education, and your future. Click any question below or type your own.'}
              </p>
              <div className="w-full max-w-lg space-y-2.5">
                <p className="text-[10px] font-bold text-white/15 uppercase tracking-[0.2em] mb-4">{t('quickQuestions')}</p>
                {quickPrompts.map((q, i) => (
                  <button key={i} onClick={() => { setInput(q.text); inputRef.current?.focus(); }}
                    className="w-full text-left px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] text-sm text-white/45 hover:text-white/80 hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-300 flex items-center gap-3 group"
                    style={{ animation: `fadeUp 0.4s ease ${0.15 + i * 0.06}s both` }}>
                    <span className="w-9 h-9 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/10 rounded-xl flex items-center justify-center text-sm shrink-0 group-hover:scale-110 transition-transform">{q.icon}</span>
                    <span className="flex-1">{q.text}</span>
                    <svg className="w-4 h-4 text-white/10 group-hover:text-white/30 transition-all group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`} style={{ animation: 'msgSlideIn 0.3s ease' }}>
              {m.role === 'ai' && (
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mr-2.5 shrink-0 shadow-lg shadow-violet-500/20 mt-0.5">
                  <span className="text-white text-[9px] font-bold">AI</span>
                </div>
              )}
              <div className={`rounded-2xl px-4 py-3 max-w-[78%] text-sm leading-relaxed whitespace-pre-line ${
                m.role === 'user'
                  ? 'bg-gradient-to-br from-blue-600/25 to-indigo-600/25 border border-blue-500/10 text-white/90'
                  : 'bg-white/[0.03] border border-white/[0.05] text-white/70'
              }`}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && !isTyping && (
            <div className="flex items-start" style={{ animation: 'msgSlideIn 0.3s ease' }}>
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mr-2.5 shrink-0 shadow-lg shadow-violet-500/20">
                <span className="text-white text-[9px] font-bold">AI</span>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-violet-400 rounded-full" style={{ animation: 'dotBounce 1.2s ease-in-out infinite' }} />
                  <div className="w-2 h-2 bg-violet-400 rounded-full" style={{ animation: 'dotBounce 1.2s ease-in-out 0.15s infinite' }} />
                  <div className="w-2 h-2 bg-violet-400 rounded-full" style={{ animation: 'dotBounce 1.2s ease-in-out 0.3s infinite' }} />
                </div>
              </div>
            </div>
          )}

          {isTyping && (
            <div className="flex items-start" style={{ animation: 'msgSlideIn 0.3s ease' }}>
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mr-2.5 shrink-0 shadow-lg shadow-violet-500/20 mt-0.5">
                <span className="text-white text-[9px] font-bold">AI</span>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl px-4 py-3 max-w-[78%] text-sm leading-relaxed whitespace-pre-line text-white/70">
                {typingText}
                <span className="inline-block w-[2px] h-4 bg-violet-400 ml-0.5 align-middle" style={{ animation: 'blink 0.8s step-end infinite' }} />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        <div className="border-t border-white/[0.04] p-4 bg-white/[0.01] relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={t('askAnything')}
                disabled={loading || isTyping}
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3.5 pr-12 text-sm text-white placeholder:text-white/20 focus:bg-white/[0.06] focus:border-violet-500/20 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all disabled:opacity-40" />
              {input.length > 0 && (
                <button onClick={() => setInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
            <button onClick={sendMessage} disabled={!input.trim() || loading || isTyping}
              className="w-12 h-12 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl flex items-center justify-center hover:from-violet-500 hover:to-purple-500 disabled:opacity-25 transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:-translate-y-0.5 active:scale-90">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-white/15 mt-2.5 text-center">
            {lang === 'hi' ? 'AI जवाब सटीक नहीं हो सकते। महत्वपूर्ण निर्णयों के लिए विशेषज्ञों से सलाह लें।' : 'AI responses may not be accurate. Consult experts for important decisions.'}
          </p>
        </div>
      </div>
    </div>
  );
}