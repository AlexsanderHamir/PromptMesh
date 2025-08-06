export const FormInput = ({ label, error, className = "", ...props }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-slate-300 mb-2">
      {label}
      {props.required && <span className="text-red-400 ml-1">*</span>}
    </label>
    <input
      {...props}
      className={`w-full px-4 py-3 bg-slate-900 border rounded-lg text-slate-50 placeholder-slate-400 
        transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 
        ${
          error ? "border-red-500" : "border-slate-600 hover:border-slate-500"
        }`}
    />
    {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
  </div>
);

export const FormTextarea = ({ label, error, className = "", ...props }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-slate-300 mb-2">
      {label}
      {props.required && <span className="text-red-400 ml-1">*</span>}
    </label>
    <textarea
      {...props}
      className={`w-full px-4 py-3 bg-slate-900 border rounded-lg text-slate-50 placeholder-slate-400 
        transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-vertical
        ${
          error ? "border-red-500" : "border-slate-600 hover:border-slate-500"
        }`}
    />
    {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
  </div>
);

export const FormSelect = ({
  label,
  options,
  error,
  className = "",
  ...props
}) => (
  <div className={className}>
    <label className="block text-sm font-medium text-slate-300 mb-2">
      {label}
      {props.required && <span className="text-red-400 ml-1">*</span>}
    </label>
    <select
      {...props}
      className={`w-full px-4 py-3 bg-slate-900 border rounded-lg text-slate-50 
        transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50
        ${
          error ? "border-red-500" : "border-slate-600 hover:border-slate-500"
        }`}
    >
      <option value="">Select {label}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
  </div>
);
