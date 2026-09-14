import { Link } from 'react-router-dom';

export default function Logo({ size = 'default', className = '' }) {
  const sizes = {
    small: { box: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-base' },
    default: { box: 'w-9 h-9', icon: 'w-5 h-5', text: 'text-xl' },
    large: { box: 'w-11 h-11', icon: 'w-6 h-6', text: 'text-2xl' },
  };
  const s = sizes[size] || sizes.default;

  return (
    <Link to="/" className={`flex items-center gap-2.5 group ${className}`}>
      <div className={`${s.box} bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 group-hover:scale-110 transition-all duration-300 relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <svg className={`${s.icon} text-white relative z-10`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19L8 5" />
          <path d="M16 5L20 19" />
          <path d="M4 19H20" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <path d="M12 6V10" />
        </svg>
      </div>
      <span className={`${s.text} font-extrabold tracking-tight group-hover:opacity-80 transition-opacity duration-300`}>
        <span className="text-gray-900">Mera </span>
        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Raasta</span>
      </span>
    </Link>
  );
}
