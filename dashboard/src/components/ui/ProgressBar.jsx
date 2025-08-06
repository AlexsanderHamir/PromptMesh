export const ProgressBar = ({ progress, className = "" }) => (
  <div className={`bg-slate-700 rounded-full h-2 overflow-hidden ${className}`}>
    <div
      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500 ease-out"
      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
    />
  </div>
);
