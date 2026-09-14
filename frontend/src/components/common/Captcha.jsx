import { useState, useEffect, useRef } from 'react';

export default function Captcha({ onVerify }) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [op, setOp] = useState('+');
  const [answer, setAnswer] = useState('');
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);

  const generate = () => {
    const ops = ['+', '-', '×'];
    const o = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * 20) + 1;
    let b = Math.floor(Math.random() * 15) + 1;
    if (o === '-' && a < b) [a, b] = [b, a];
    setNum1(a); setNum2(b); setOp(o);
    setAnswer(''); setVerified(false); setError('');
    onVerify(false);
  };

  useEffect(() => { generate(); }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;

    // Background noise
    ctx.fillStyle = '#f0f4f8';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(${Math.random()*200},${Math.random()*200},${Math.random()*200},0.5)`;
      ctx.fillRect(Math.random()*w, Math.random()*h, Math.random()*20+2, Math.random()*4+1);
    }

    // Random lines
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(${Math.random()*150+50},${Math.random()*150+50},${Math.random()*150+50},0.4)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.random()*w, Math.random()*h);
      ctx.lineTo(Math.random()*w, Math.random()*h);
      ctx.stroke();
    }

    // Dots
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random()*0.3})`;
      ctx.beginPath();
      ctx.arc(Math.random()*w, Math.random()*h, 1, 0, Math.PI*2);
      ctx.fill();
    }

    // Text
    const text = `${num1} ${op} ${num2} = ?`;
    const colors = ['#1e40af', '#7c3aed', '#047857', '#b91c1c', '#c2410c'];
    ctx.font = 'bold 28px monospace';
    ctx.textBaseline = 'middle';
    let x = 20;
    for (let i = 0; i < text.length; i++) {
      ctx.save();
      ctx.translate(x, h/2 + (Math.random()-0.5)*8);
      ctx.rotate((Math.random()-0.5)*0.2);
      ctx.fillStyle = colors[Math.floor(Math.random()*colors.length)];
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
      x += ctx.measureText(text[i]).width + 2;
    }
  }, [num1, num2, op]);

  const handleVerify = () => {
    let correct;
    if (op === '+') correct = num1 + num2;
    else if (op === '-') correct = num1 - num2;
    else correct = num1 * num2;

    if (parseInt(answer) === correct) {
      setVerified(true); setError('');
      onVerify(true);
    } else {
      setError('Wrong answer!');
      onVerify(false);
      generate();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleVerify(); }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-bold text-gray-900">Verification</label>
      <div className="flex items-center gap-3">
        <canvas ref={canvasRef} width={180} height={60} className="rounded-xl border-2 border-gray-200" />
        <button type="button" onClick={generate} className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all shrink-0" title="Refresh">
          <svg className={`w-4 h-4 text-gray-500 transition-transform ${verified ? '' : 'hover:rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={answer}
          onChange={(e) => { setAnswer(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
          placeholder="Enter answer"
          disabled={verified}
          className={`flex-1 px-4 py-2.5 border-2 rounded-xl text-sm focus:ring-0 outline-none transition-all ${
            verified ? 'border-green-400 bg-green-50 text-green-700' :
            error ? 'border-red-400 bg-red-50 focus:border-red-400' :
            'border-gray-200 focus:border-blue-500'
          }`}
        />
        {!verified && (
          <button type="button" onClick={handleVerify} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold text-gray-700 transition-all shrink-0">
            Verify
          </button>
        )}
        {verified && (
          <span className="px-3 py-2.5 bg-green-100 text-green-700 rounded-xl text-sm font-bold flex items-center gap-1 shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            Verified
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
    </div>
  );
}
