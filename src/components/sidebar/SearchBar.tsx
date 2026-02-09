import { useUIStore } from '../../stores/ui';

export default function SearchBar() {
  const { searchQuery, setSearchQuery } = useUIStore();

  return (
    <div className="px-3 py-2">
      <div className="relative">
        <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-blue-500 focus:outline-none transition-colors"
        />
      </div>
    </div>
  );
}
