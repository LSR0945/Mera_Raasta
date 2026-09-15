import { useState, useEffect } from 'react';
import api from '../../api/axios';
import BackButton from '../../components/common/BackButton';

export default function MentorReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/mentor/reviews').then(({ data }) => setReviews(data.data.reviews || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>;

  return (
    <div className="space-y-6 max-w-[1200px]">
      <BackButton to="/dashboard" label="Back to Dashboard" />
      <h1 className="text-2xl font-extrabold text-gray-900">Reviews ⭐</h1>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <span className="text-6xl block mb-4">⭐</span>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No reviews yet</h3>
          <p className="text-sm text-gray-500">Reviews from students will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, i) => (
            <div key={i} className="bg-white rounded-2xl border p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {review.studentName?.[0] || '?'}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">{review.studentName}</h3>
                  <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className={`text-lg ${s <= (review.rating || 0) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-700">{review.comment || review.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
