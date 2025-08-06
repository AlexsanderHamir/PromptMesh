export const Card = ({ title, subtitle, children, className = "", icon }) => (
  <div
    className={`bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl shadow-xl ${className}`}
  >
    {(title || subtitle) && (
      <div className="px-6 py-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          {icon && <div className="text-blue-400">{icon}</div>}
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
            )}
            {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
          </div>
        </div>
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);
