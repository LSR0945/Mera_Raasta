import { useState, useEffect, useRef } from 'react';

export default function Captcha({ onVerify }) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [op, setOp] = useState('+');
  const [answer, setAnswer] = useState('');
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const canvasRef = useRef(null);
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  const getCorrect = (o, a, b) => {
    if (o === '+') return a + b;
    if (o === '-') return a - b;
    return a * b;
  };

  const generate = () => {
    const ops = ['+', '-', '×'];
    const o = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * 20) + 1;
    let b = Math.floor(Math.random() * 15) + 1;
    if (o === '-' && a < b) [a, b] = [b, a];
    setNum1(a); setNum2(b); setOp(o);
    setAnswer(''); setVerified(false); setError(''); setShake(false);
    onVerify(false);
  };

  useEffect(() => { generate(); }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = `rgba(${99 + Math.random()*40},${102 + Math.random()*40},${241 + Math.random()*14},${Math.random()*0.15})`;
      ctx.fillRect(Math.random()*w, Math.random()*h, Math.random()*18+2, Math.random()*3+1);
    }
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = `rgba(${99+Math.random()*60},${102+Math.random()*60},${241+Math.random()*14},${Math.random()*0.2+0.1})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.random()*w, Math.random()*h);
      ctx.lineTo(Math.random()*w, Math.random()*h);
      ctx.stroke();
    }
    for (let i = 0; i < 100; i++) {
      ctx.fillStyle = `rgba(99,102,241,${Math.random()*0.12})`;
      ctx.beginPath();
      ctx.arc(Math.random()*w, Math.random()*h, Math.random()*1.5, 0, Math.PI*2);
      ctx.fill();
    }

    const text = `${num1} ${op} ${num2}`;
    const colors = ['#4f46e5', '#7c3aed', '#2563eb', '#6366f1', '#8b5cf6'];
    ctx.font = 'bold 26px "SF Mono", "Cascadia Code", "Fira Code", monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    let x = (w - ctx.measureText(text).width) / 2;
    for (let i = 0; i < text.length; i++) {
      ctx.save();
      ctx.translate(x + ctx.measureText(text[i]).width/2, h/2 + (Math.random()-0.5)*6);
      ctx.rotate((Math.random()-0.5)*0.15);
      ctx.fillStyle = colors[Math.floor(Math.random()*colors.length)];
      ctx.globalAlpha = 0.8 + Math.random()*0.2;
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
      x += ctx.measureText(text[i]).width + 1;
    }

    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#a5b4fc';
    ctx.globalAlpha = 0.6;
    ctx.fillText('=', w - 30, h/2);
    ctx.globalAlpha = 1;
  }, [num1, num2, op]);

  useEffect(() => {
    if (verified || !answer) return;
    const correct = getCorrect(op, num1, num2);
    if (parseInt(answer) === correct) {
      setVerified(true); setError('');
      onVerify(true);
    } else if (answer.length >= String(Math.abs(correct)).length) {
      setError('Wrong!');
      setShake(true);
      onVerify(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => { generate(); }, 600);
    }
  }, [answer, verified, op, num1, num2, onVerify]);

  return (
    <div className="space-y-3">
      <style>{`
        @keyframes captchaShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
        @keyframes captchaSuccess { 0%{transform:scale(1)} 50%{transform:scale(1.02)} 100%{transform:scale(1)} }
        @keyframes successPulse { 0%{box-shadow:0 0 0 0 rgba(34,197,94,0.4)} 100%{box-shadow:0 0 0 12px rgba(34,197,94,0)} }
      `}</style>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Verification</label>

      <div className={`flex items-center gap-3 p-2 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 transition-all duration-300 ${verified ? 'border-emerald-300 shadow-lg shadow-emerald-500/10' : 'hover:border-indigo-200 hover:shadow-md'}`}
        style={shake ? { animation: 'captchaShake 0.4s ease' } : verified ? { animation: 'captchaSuccess 0.3s ease, successPulse 0.8s ease' } : {}}>
        <canvas ref={canvasRef} width={180} height={60} className="rounded-xl flex-shrink-0" />
        <button type="button" onClick={generate}
          className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-indigo-50 flex items-center justify-center transition-all duration-300 shrink-0 group hover:rotate-180" title="New captcha">
          <svg className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={answer}
          onChange={(e) => { setAnswer(e.target.value.replace(/[^0-9\-]/g, '')); setError(''); }}
          placeholder="Type answer..."
          disabled={verified}
          className={`w-full px-4 py-3 border-2 rounded-2xl text-sm focus:ring-0 outline-none transition-all duration-300 pr-12 font-mono font-bold ${
            verified ? 'border-emerald-400 bg-emerald-50 text-emerald-700' :
            error ? 'border-red-400 bg-red-50 focus:border-red-400' :
            'border-gray-200 focus:border-indigo-500 hover:border-gray-300 focus:shadow-lg focus:shadow-indigo-500/10'
          }`}
        />
        {verified && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center" style={{ animation: 'successPulse 0.8s ease' }}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl border border-red-100" style={{ animation: 'captchaShake 0.4s ease' }}>
          <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          <p className="text-xs text-red-600 font-semibold">{error}</p>
        </div>
      )}
    </div>
  );
}
