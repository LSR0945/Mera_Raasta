import { useState, useEffect } from 'react';
import api from '../../api/axios';
import BackButton from '../../components/common/BackButton';

export default function ResumeInterviewPage() {
  const [quizzes, setQuizzes] = useState([]);
  useEffect(() => { api.get('/quizzes').then(({ data }) => setQuizzes(data.data.quizzes || [])).catch(() => {}); }, []);
  return (
    <div className="space-y-6"><BackButton to="/dashboard" label="Back to Dashboard" />
      <h1 className="text-2xl font-bold">Resume & Interview Prep</h1>
      <div className="bg-white rounded-2xl border p-6"><h2 className="text-sm font-bold text-gray-400 uppercase mb-4">Interview Quizzes</h2>
        <div className="grid sm:grid-cols-2 gap-4">{quizzes.map((q, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 border"><h3 className="font-bold text-sm">{q.title}</h3><p className="text-xs text-gray-500 mt-1">{q.description}</p><div className="flex gap-2 mt-2 text-[10px] font-medium"><span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{q.category}</span><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{q.difficulty}</span></div></div>
        ))}</div></div>
      <div className="bg-white rounded-2xl border p-6"><h2 className="text-sm font-bold text-gray-400 uppercase mb-4">Resume Tips</h2><ul className="space-y-2 text-sm text-gray-600"><li>• Keep it to 1 page</li><li>• Use action verbs</li><li>• Quantify achievements</li><li>• Tailor for each application</li><li>• Proofread carefully</li></ul></div>
    </div>
  );
}
