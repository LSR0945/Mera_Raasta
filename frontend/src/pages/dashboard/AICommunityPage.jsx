import { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../../api/aiCommunity';
import { useLanguage } from '../../contexts/LanguageContext';
import BackButton from '../../components/common/BackButton';

function renderMarkdown(text) {
  if (!text) return text;
  const parts = [];
  const regex = /(```[\s\S]*?```|`[^`]+`|\*\*[^*]+\*\*)/g;
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    }
    const seg = match[0];
    if (seg.startsWith('```')) {
      const code = seg.slice(3, -3).replace(/^\w+\n/, '');
      parts.push(
        <pre key={key++} className="my-2 rounded-xl bg-black/40 border border-white/[0.06] p-3 overflow-x-auto">
          <code className="text-xs text-violet-300/80 font-mono whitespace-pre">{code}</code>
        </pre>
      );
    } else if (seg.startsWith('`')) {
      parts.push(
        <code key={key++} className="mx-0.5 px-1.5 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.06] text-violet-300/90 text-xs font-mono">
          {seg.slice(1, -1)}
        </code>
      );
    } else if (seg.startsWith('**')) {
      parts.push(<strong key={key++} className="text-white/95 font-semibold">{seg.slice(2, -2)}</strong>);
    }
    lastIndex = match.index + seg.length;
  }
  if (lastIndex < text.length) {
    parts.push(<span key={key++} className="whitespace-pre-wrap">{text.slice(lastIndex)}</span>);
  }
  return parts.length > 0 ? parts : <span className="whitespace-pre-wrap">{text}</span>;
}

export default function AICommunityPage() {
  const { lang, t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [waitingForFirst, setWaitingForFirst] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const streamRef = useRef(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, waitingForFirst]);

  // ChatGPT jaisa: page khulte hi purani chats list + NAYA khaali chat auto-open
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await aiAPI.listSessions();
        if (alive) setSessions(res?.data?.data?.sessions || []);
        const cr = await aiAPI.createSession();
        const sid = cr?.data?.data?.sessionId;
        if (alive && sid) setActiveSessionId(sid);
      } catch { /* offline — normal fresh chat */ }
    })();
    return () => { alive = false; };
  }, []);

  const refreshSessions = () => {
    aiAPI.listSessions()
      .then(r => setSessions(r?.data?.data?.sessions || []))
      .catch(() => {});
  };

  const sendMessage = async (overrideMsg) => {
    const msg = overrideMsg || input.trim();
    if (!msg || isStreaming) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg, id: Date.now() }]);
    setIsStreaming(true);
    setWaitingForFirst(true);
    setStreamingText('');
    streamRef.current = true;

    // Chat session — na ho toh naya bana lo
    let sid = activeSessionId;
    if (!sid) {
      try {
        const cr = await aiAPI.createSession();
        sid = cr?.data?.data?.sessionId;
        if (sid) setActiveSessionId(sid);
      } catch { /* ignore — backend khud bana dega */ }
    }

    let fullText = '';
    try {
      const stream = aiAPI.chatStream({ type: 'counselor', message: msg, sessionId: sid });
      for await (const data of stream) {
        if (!streamRef.current) break;
        if (data.sessionId && !sid) { sid = data.sessionId; setActiveSessionId(sid); }
        if (data.done) break;
        if (data.chunk) {
          if (waitingForFirst) setWaitingForFirst(false);
          fullText += data.chunk;
          setStreamingText(fullText);
        }
      }
      if (streamRef.current && fullText) {
        setMessages(prev => [...prev, { role: 'ai', content: fullText, id: Date.now() + 1 }]);
      } else if (streamRef.current && !fullText) {
        const errMsg = lang === 'hi' ? 'माफ़ कीजिए, कुछ गलत हो गया। कृपया दोबारा try करें।' : 'Sorry, something went wrong. Please try again.';
        setMessages(prev => [...prev, { role: 'ai', content: errMsg, id: Date.now() + 1 }]);
      }
    } catch (err) {
      console.error('AI Chat error:', err);
      let errMsg;
      if (err.response?.status === 401) {
        errMsg = lang === 'hi' ? 'आपका session खत्म हो गया है। कृपया दोबारा login करें।' : 'Your session has expired. Please login again.';
      } else if (err.response?.status === 429) {
        errMsg = lang === 'hi' ? 'बहुत ज़्यादा requests भेज दीं। कुछ देर रुककर दोबारा try करें।' : 'Too many requests. Please wait a moment and try again.';
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      } else {
        errMsg = lang === 'hi' ? 'सर्वर से जुड़ नहीं पा रहे। कृपया server check करें और दोबारा try करें।' : 'Cannot connect to server. Please check if the server is running and try again.';
      }
      setMessages(prev => [...prev, { role: 'ai', content: errMsg, id: Date.now() + 1 }]);
    } finally {
      setIsStreaming(false);
      setWaitingForFirst(false);
      setStreamingText('');
      streamRef.current = false;
      refreshSessions(); // sidebar me title/count update
    }
  };

  // Naya khaali chat (ChatGPT jaisa) — purani chats history me save rehti hain
  const newChat = async () => {
    streamRef.current = false;
    setIsStreaming(false);
    setWaitingForFirst(false);
    setStreamingText('');
    setMessages([]);
    setShowHistory(false);
    try {
      const cr = await aiAPI.createSession();
      const sid = cr?.data?.data?.sessionId;
      if (sid) setActiveSessionId(sid);
      refreshSessions();
    } catch { /* offline */ }
  };

  // Purani chat kholo (refresh ke baad bhi sab messages wapas)
  const openSession = async (id) => {
    if (isStreaming) return;
    setShowHistory(false);
    setLoadingSession(true);
    try {
      const r = await aiAPI.getSession(id);
      const d = r?.data?.data;
      setActiveSessionId(id);
      setMessages((d?.messages || []).map((m, i) => ({
        role: m.role === 'assistant' ? 'ai' : 'user',
        content: m.content,
        id: Date.now() + i,
      })));
    } catch { /* ignore */ }
    finally { setLoadingSession(false); }
  };

  // Chat delete karo
  const removeSession = async (e, id) => {
    e.stopPropagation();
    try {
      await aiAPI.deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (id === activeSessionId) {
        setMessages([]);
        const cr = await aiAPI.createSession();
        const sid = cr?.data?.data?.sessionId;
        if (sid) setActiveSessionId(sid);
      }
    } catch { /* ignore */ }
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

      <div className="flex items-center justify-between mb-6 gap-2 flex-wrap" style={{ animation: 'fadeUp 0.5s ease' }}>
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
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowHistory(v => !v); refreshSessions(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all hover:-translate-y-0.5 active:scale-95 ${showHistory ? 'bg-violet-500/15 border-violet-500/30 text-violet-200' : 'bg-white/[0.04] border-white/[0.06] text-white/50 hover:text-white/80 hover:bg-white/[0.08]'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {lang === 'hi' ? 'चैट्स' : 'Chats'}
            {sessions.length > 0 && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{sessions.length}</span>}
          </button>
          <button onClick={newChat}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm font-medium text-white/50 hover:text-white/80 hover:bg-white/[0.08] transition-all hover:-translate-y-0.5 active:scale-95">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t('newChat')}
          </button>
        </div>
      </div>

      {/* Recent chats — ChatGPT jaisa history panel */}
      {showHistory && (
        <div className="mb-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 max-h-72 overflow-y-auto" style={{ animation: 'fadeUp 0.2s ease' }}>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-2 mb-2">
            {lang === 'hi' ? 'पुरानी चैट्स' : 'Recent chats'}
          </p>
          {sessions.length === 0 && (
            <p className="text-xs text-white/25 px-2 py-3">{lang === 'hi' ? 'अभी कोई पुरानी चैट नहीं है।' : 'No previous chats yet.'}</p>
          )}
          {sessions.map(s => (
            <div key={s.id} onClick={() => openSession(s.id)}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all mb-1 ${s.id === activeSessionId ? 'bg-violet-500/10 border border-violet-500/20' : 'hover:bg-white/[0.05] border border-transparent'}`}>
              <span className="text-sm shrink-0">💬</span>
              <span className="flex-1 text-xs text-white/70 truncate">{s.title || 'New Chat'}</span>
              <span className="text-[10px] text-white/20 shrink-0">{s.messageCount} msg</span>
              <button onClick={(e) => removeSession(e, s.id)}
                className="text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0 p-1"
                title={lang === 'hi' ? 'चैट डिलीट करें' : 'Delete chat'}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative bg-white/[0.02] border border-white/[0.04] rounded-3xl overflow-hidden" style={{ animation: 'fadeUp 0.6s ease 0.1s both' }}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" style={{ animation: 'orbFloat 14s ease-in-out infinite' }} />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" style={{ animation: 'orbFloat 12s ease-in-out 4s infinite' }} />

        <div className="min-h-[420px] max-h-[520px] overflow-y-auto p-6 space-y-5 relative z-10 scroll-smooth">
          {loadingSession && (
            <p className="text-center text-xs text-white/30 py-8">{lang === 'hi' ? 'चैट लोड हो रही है...' : 'Loading chat...'}</p>
          )}

          {!loadingSession && messages.length === 0 && !isStreaming && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/10 rounded-3xl flex items-center justify-center text-5xl mb-6 relative" style={{ animation: 'fadeUp 0.5s ease' }}>
                🤖
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-[#0a0a1a] animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{lang === 'hi' ? 'नमस्ते! मैं आपका AI Agent हूँ' : "Hello! I'm your AI Agent"}</h3>
              <p className="text-sm text-white/25 text-center max-w-md mb-8 leading-relaxed">
                {lang === 'hi' ? 'मैं करियर, कौशल, शिक्षा और भविष्य के बारे में आपकी मदद कर सकता हूँ। नीचे किसी सवाल पर क्लिक करें या अपना सवाल टाइप करें।' : 'I can help you with careers, skills, education, and your future. Click any question below or type your own.'}
              </p>
              <div className="w-full max-w-lg space-y-2.5">
                <p className="text-[10px] font-bold text-white/15 uppercase tracking-[0.2em] mb-4">{t('quickQuestions')}</p>
                {quickPrompts.map((q, i) => (
                  <button key={i} onClick={() => sendMessage(q.text)}
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
              <div className={`rounded-2xl px-4 py-3 max-w-[78%] text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-gradient-to-br from-blue-600/25 to-indigo-600/25 border border-blue-500/10 text-white/90'
                  : 'bg-white/[0.03] border border-white/[0.05] text-white/70'
              }`}>
                {m.role === 'ai' ? renderMarkdown(m.content) : <span className="whitespace-pre-line">{m.content}</span>}
              </div>
            </div>
          ))}

          {waitingForFirst && (
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

          {isStreaming && streamingText && (
            <div className="flex items-start" style={{ animation: 'msgSlideIn 0.3s ease' }}>
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mr-2.5 shrink-0 shadow-lg shadow-violet-500/20 mt-0.5">
                <span className="text-white text-[9px] font-bold">AI</span>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl px-4 py-3 max-w-[78%] text-sm leading-relaxed text-white/70">
                {renderMarkdown(streamingText)}
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
                disabled={isStreaming}
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3.5 pr-12 text-sm text-white placeholder:text-white/20 focus:bg-white/[0.06] focus:border-violet-500/20 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all disabled:opacity-40" />
              {input.length > 0 && (
                <button onClick={() => setInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
            <button onClick={() => sendMessage()} disabled={!input.trim() || isStreaming}
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
