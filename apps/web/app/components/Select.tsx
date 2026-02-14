import { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, className = '', children, ...props }: SelectProps) {
  const selectWrapper = (
    <div className="relative w-full sm:w-auto">
      <select
        {...props}
        className={`block w-full sm:w-auto appearance-none rounded-md border border-gray-300 bg-white pl-3 pr-10 py-[9px] text-sm text-gray-900 focus:border-slate-500 focus:ring-slate-500 ${className}`}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
        <svg
          className="h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );

  if (!label) return selectWrapper;

  return (
    <div className="w-full sm:w-auto">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {selectWrapper}
    </div>
  );
}
