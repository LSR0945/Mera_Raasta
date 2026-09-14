import { useState } from 'react';
import { aiAPI } from '../../api/aiCommunity';

export default function AICommunityPage() {
  const [msg, setMsg] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!msg.trim()) return;
    const m = msg.trim(); setMsg('');
    setChat(p => [...p, { role: 'user', content: m }]);
    setLoading(true);
    try {
      const { data } = await aiAPI.chat({ type: 'counselor', message: m });
      setChat(p => [...p, { role: 'ai', content: data.data?.response || 'I can help with that.' }]);
    } catch { setChat(p => [...p, { role: 'ai', content: 'Service unavailable.' }]); }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto"><h1 className="text-2xl font-bold mb-6">AI Career Coach</h1>
      <div className="bg-white rounded-2xl border p-6">
        <div className="min-h-[300px] max-h-[400px] overflow-y-auto space-y-3 mb-4">
          {chat.length === 0 && <div className="space-y-2">{['What should I learn next?', 'Which career suits my profile?', 'How can I improve my resume?'].map(q => (
            <button key={q} onClick={() => setMsg(q)} className="block w-full text-left text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5 hover:bg-primary-50 hover:text-primary-600 transition-colors">{q}</button>
          ))}</div>}
          {chat.map((m, i) => (<div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'ai' && <div className="w-6 h-6 bg-primary-600 rounded-lg flex items-center justify-center mr-2"><span className="text-white text-[9px] font-bold">AI</span></div>}
            <div className={`rounded-xl px-3 py-2 max-w-[80%] text-xs leading-relaxed ${m.role === 'user' ? 'bg-primary-50 text-gray-700' : 'bg-gray-50 text-gray-600 border'}`}>{m.content}</div>
          </div>))}
          {loading && <div className="flex items-center gap-2"><div className="w-6 h-6 bg-primary-600 rounded-lg flex items-center justify-center"><span className="text-white text-[9px] font-bold">AI</span></div><div className="bg-gray-50 rounded-xl px-3 py-2 text-[11px] text-gray-400 border">Thinking...</div></div>}
        </div>
        <div className="flex gap-2"><input value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Ask about careers, skills..." className="flex-1 text-xs bg-gray-50 border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
          <button onClick={send} disabled={loading} className="bg-primary-600 text-white px-3 py-2.5 rounded-xl hover:bg-primary-700 disabled:opacity-50">Send</button></div>
      </div></div>
  );
}
