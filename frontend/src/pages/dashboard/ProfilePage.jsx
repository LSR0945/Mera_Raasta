import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';

function PhotoUpload({ currentAvatar, onUpload, role }) {
  const [preview, setPreview] = useState(currentAvatar || null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const ROLE_GRADIENT = { student: 'from-blue-500 to-indigo-500', parent: 'from-emerald-500 to-teal-500', mentor: 'from-violet-500 to-purple-500' };
  const MAX_SIZE = 2 * 1024 * 1024;

  const compressImage = (file) => new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      const maxDim = 800;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Compression failed'));
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.7);
    };
    img.onerror = reject;
    img.src = url;
  });

  const processFile = async (file) => {
    if (!file) return;
    if (file.size > MAX_SIZE) return toast.error('Image too large! Max 2MB.');
    setUploading(true);
    try {
      const base64 = await compressImage(file);
      setPreview(base64);
      await onUpload(base64);
      toast.success('Photo updated!');
    } catch (err) {
      toast.error('Failed to upload photo: ' + (err.message || ''));
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const gradient = ROLE_GRADIENT[role] || ROLE_GRADIENT.student;

  return (
    <div className="flex flex-col items-center">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative group cursor-pointer w-32 h-32 rounded-3xl overflow-hidden border-4 transition-all duration-300 ${
          dragActive ? 'border-blue-500 scale-105 shadow-xl shadow-blue-500/25' : 'border-white shadow-xl hover:shadow-2xl hover:scale-105'
        }`}
      >
        {preview ? (
          <img src={preview} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <svg className="w-10 h-10 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          {uploading ? (
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <div className="text-center">
              <svg className="w-6 h-6 text-white mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
              <span className="text-[10px] font-bold text-white">Change Photo</span>
            </div>
          )}
        </div>

        <input ref={inputRef} type="file" accept="*/*" onChange={handleChange} className="hidden" />
      </div>

      <p className="text-xs text-gray-400 mt-3 text-center">
        Click or drag photo here<br />
        <span className="text-[10px]">Any size, any format — JPG, PNG, GIF, WebP, SVG, BMP, TIFF, AVIF, HEIC, ICO, RAW, PSD or any other</span>
      </p>

      {preview && preview !== currentAvatar && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setPreview(currentAvatar); inputRef.current.value = ''; }}
          className="mt-2 text-xs font-semibold text-red-500 hover:text-red-600"
        >
          Remove photo
        </button>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: user?.name || '', phone: '', bio: '', class: '', subjects: '' });
  const [saving, setSaving] = useState(false);

  const role = user?.role || 'student';
  const ROLE_GRADIENT = { student: 'from-blue-500 to-indigo-500', parent: 'from-emerald-500 to-teal-500', mentor: 'from-violet-500 to-purple-500' };
  const ROLE_TEXT = { student: 'text-blue-600', parent: 'text-emerald-600', mentor: 'text-violet-600' };
  const ROLE_BG = { student: 'bg-blue-50', parent: 'bg-emerald-50', mentor: 'bg-violet-50' };

  useEffect(() => {
    api.get('/profile').then(({ data }) => {
      const p = data.data.profile;
      if (p) {
        setProfile(p);
        setForm({
          name: user?.name || '',
          phone: p.phone || '',
          bio: p.bio || '',
          class: p.class || '',
          subjects: p.subjects?.join(', ') || '',
        });
      }
    }).catch(() => {});
  }, [user]);

  const handlePhotoUpload = async (base64) => {
    await updateProfile({ avatar: base64 });
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await updateProfile({
        name: form.name,
        phone: form.phone,
        bio: form.bio,
        class: form.class,
        subjects: form.subjects.split(',').map(s => s.trim()).filter(Boolean),
      });
      toast.success('Profile updated!');
    } catch (err) { toast.error('Failed to update'); } finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ── Profile Header Card ── */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
          <PhotoUpload currentAvatar={user?.avatar} onUpload={handlePhotoUpload} role={role} />
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-extrabold mb-1">{user?.name}</h1>
            <p className="text-gray-400 text-sm mb-3">{user?.email}</p>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${ROLE_BG[role]} ${ROLE_TEXT[role]}`}>{role}</span>
              {profile?.onboardingCompleted && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">✓ Verified</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Profile Form ── */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 lg:p-8">
        <h2 className="text-xl font-extrabold text-gray-900 mb-6">Edit Profile</h2>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:border-blue-500 focus:ring-0 outline-none transition-colors" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
              <input type="email" value={user?.email} disabled
                className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:border-blue-500 focus:ring-0 outline-none transition-colors" placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Class / Grade</label>
              <input type="text" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:border-blue-500 focus:ring-0 outline-none transition-colors" placeholder="e.g. 12th, B.Tech" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Subjects / Interests</label>
            <input type="text" value={form.subjects} onChange={(e) => setForm({ ...form, subjects: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:border-blue-500 focus:ring-0 outline-none transition-colors" placeholder="Math, Science, Programming (comma separated)" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Bio</label>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:border-blue-500 focus:ring-0 outline-none resize-none transition-colors" placeholder="Tell us about yourself and your goals..." />
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button type="submit" disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2">
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  Saving...
                </>
              ) : (
                <>
                  Save Changes
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Education Details ── */}
      {profile && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 lg:p-8">
          <h2 className="text-xl font-extrabold text-gray-900 mb-6">Education Details</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { label: 'Education Level', value: profile.educationLevel || 'Not set', icon: '🎓' },
              { label: 'Interests', value: profile.interests?.join(', ') || 'None', icon: '💡' },
              { label: 'Skills', value: profile.skills?.map(s => s.name).join(', ') || 'None', icon: '⚡' },
              { label: 'Onboarding', value: profile.onboardingCompleted ? '✅ Complete' : '❌ Pending', icon: '📋' },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-xs font-bold text-gray-400 uppercase">{item.label}</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
