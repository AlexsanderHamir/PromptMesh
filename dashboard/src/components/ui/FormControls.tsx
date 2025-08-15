import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string | null;
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  error?: string | null;
}

export const FormInput: React.FC<FormInputProps> = ({ label, error, required, ...props }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-slate-200">
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
    <input
      {...props}
      className={`w-full px-4 py-2 bg-slate-800/50 border rounded-lg text-slate-50 placeholder-slate-400 
        transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
        hover:border-slate-500 ${
          error ? 'border-red-500' : 'border-slate-600'
        }`}
    />
    {error && <p className="text-red-400 text-sm">{error}</p>}
  </div>
);

export const FormTextarea: React.FC<FormTextareaProps> = ({ label, error, required, ...props }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-slate-200">
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
    <textarea
      {...props}
      className={`w-full px-4 py-2 bg-slate-800/50 border rounded-lg text-slate-50 placeholder-slate-400 
        transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
        hover:border-slate-500 resize-none ${
          error ? 'border-red-500' : 'border-slate-600'
        }`}
    />
    {error && <p className="text-red-400 text-sm">{error}</p>}
  </div>
);

export const FormSelect: React.FC<FormSelectProps> = ({ label, options, error, required, ...props }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-slate-200">
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
    <select
      {...props}
      className={`w-full px-4 py-2 bg-slate-800/50 border rounded-lg text-slate-50 
        transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
        hover:border-slate-500 ${
          error ? 'border-red-500' : 'border-slate-600'
        }`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="text-red-400 text-sm">{error}</p>}
  </div>
);
