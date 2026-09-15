import { useNavigate } from 'react-router-dom';

export default function BackButton({ to, label = 'Back', className = '' }) {
  const navigate = useNavigate();
  const handleClick = () => to ? navigate(to) : navigate(-1);

  return (
    <button onClick={handleClick}
      className={`inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all ${className}`}>
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </button>
  );
}
