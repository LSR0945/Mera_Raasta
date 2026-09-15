import { useState, useEffect } from 'react';
import api from '../../api/axios';
import BackButton from '../../components/common/BackButton';

export default function ResumeInterviewPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => { api.get('/quizzes').then(({ data }) => setQuizzes(data.data.quizzes || [])).catch(() => {}); }, []);

  const startQuiz = async (slug) => {
    try {
      const { data } = await api.get(`/quizzes/${slug}`);
      setQuestions(data.data.questions || []);
      setSelectedQuiz(slug);
      setCurrentQ(0);
      setAnswers({});
      setSubmitted(false);
      setScore(0);
    } catch (e) { console.error(e); }
  };

  const selectAnswer = (qIdx, aIdx) => setAnswers(prev => ({ ...prev, [qIdx]: aIdx }));

  const submitQuiz = () => {
    let s = 0;
    questions.forEach((q, i) => { if (answers[i] === q.correctAnswerIndex) s++; });
    setScore(s);
    setSubmitted(true);
  };

  if (selectedQuiz && questions.length > 0) {
    const q = questions[currentQ];
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <BackButton to="/dashboard/resume-interview" label="Back to Quizzes" />
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Quiz: {selectedQuiz}</h2>
            <span className="text-xs text-gray-400">Q {currentQ + 1}/{questions.length}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full mb-6"><div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} /></div>
          {!submitted ? (
            <div className="bg-white rounded-2xl border p-6 shadow-sm">
              <p className="text-sm font-semibold text-gray-900 mb-4">{q.question}</p>
              <div className="space-y-2">
                {(q.options || []).map((opt, i) => (
                  <button key={i} onClick={() => selectAnswer(currentQ, i)}
                    className={`w-full text-left p-3 rounded-xl text-sm border transition-all ${answers[currentQ] === i ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
                    {String.fromCharCode(65 + i)}. {opt}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-6">
                <button onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0} className="px-4 py-2 text-sm text-gray-500 disabled:opacity-30">Previous</button>
                {currentQ < questions.length - 1 ? (
                  <button onClick={() => setCurrentQ(currentQ + 1)} className="px-6 py-2 bg-primary-500 text-white text-sm font-semibold rounded-xl hover:bg-primary-600">Next</button>
                ) : (
                  <button onClick={submitQuiz} className="px-6 py-2 bg-green-500 text-white text-sm font-semibold rounded-xl hover:bg-green-600">Submit</button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border p-8 text-center shadow-sm">
              <div className="text-5xl mb-4">{score >= questions.length * 0.8 ? '🎉' : score >= questions.length * 0.5 ? '👍' : '💪'}</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{score}/{questions.length}</h3>
              <p className="text-sm text-gray-500 mb-6">{score >= questions.length * 0.8 ? 'Excellent! You nailed it!' : score >= questions.length * 0.5 ? 'Good effort! Keep practicing.' : 'Keep learning and try again!'}</p>
              <button onClick={() => { setSelectedQuiz(null); setQuestions([]); }} className="px-6 py-2 bg-primary-500 text-white text-sm font-semibold rounded-xl hover:bg-primary-600">Back to Quizzes</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <BackButton to="/dashboard" label="Back to Dashboard" />
      <h1 className="text-2xl font-bold mb-6">Resume & Interview Prep</h1>

      <div className="bg-white rounded-2xl border p-6 mb-6">
        <h2 className="text-sm font-bold text-gray-400 uppercase mb-4">Interview Quizzes</h2>
        {quizzes.length === 0 ? (
          <p className="text-sm text-gray-400">No quizzes available yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {quizzes.map((q, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 border hover:border-primary-300 transition-all cursor-pointer group" onClick={() => startQuiz(q.slug || q._id)}>
                <h3 className="font-bold text-sm group-hover:text-primary-600 transition-colors">{q.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{q.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-2 text-[10px] font-medium">
                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{q.category}</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{q.difficulty}</span>
                  </div>
                  <span className="text-[10px] text-primary-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Start →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border p-6">
        <h2 className="text-sm font-bold text-gray-400 uppercase mb-4">Resume Tips</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { tip: 'Keep it to 1 page', icon: '📄', desc: 'Recruiters spend 6 seconds scanning your resume.' },
            { tip: 'Use action verbs', icon: '⚡', desc: 'Led, Built, Designed, Implemented — not "Responsible for".' },
            { tip: 'Quantify achievements', icon: '📊', desc: '"Increased sales by 40%" is better than "Improved sales".' },
            { tip: 'Tailor for each role', icon: '🎯', desc: 'Match keywords from the job description.' },
            { tip: 'Proofread carefully', icon: '✅', desc: 'Typos = instant rejection. Read it backward.' },
          ].map((r, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <span className="text-lg mt-0.5">{r.icon}</span>
              <div><p className="text-sm font-semibold text-gray-800">{r.tip}</p><p className="text-[11px] text-gray-500">{r.desc}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
