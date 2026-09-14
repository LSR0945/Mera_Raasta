export default function PlaceholderPage({ title, description, icon }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <span className="text-6xl mb-4">{icon || '🚧'}</span>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title || 'Coming Soon'}</h1>
      <p className="text-gray-500 max-w-md">{description || 'This feature is under development.'}</p>
    </div>
  );
}
