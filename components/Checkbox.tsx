'use client';

import { useState } from 'react';

interface CheckboxProps {
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

export default function Checkbox({ label, checked: controlledChecked, onChange }: CheckboxProps) {
  const [internalChecked, setInternalChecked] = useState(false);
  const isChecked = controlledChecked !== undefined ? controlledChecked : internalChecked;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = e.target.checked;
    if (controlledChecked === undefined) {
      setInternalChecked(newChecked);
    }
    onChange?.(newChecked);
  };

  return (
    <label className="flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleChange}
        className="sr-only"
      />
      <div className={`flex items-center justify-center w-5 h-5 border-2 border-gray-300 rounded bg-white transition-all duration-200 ${
        isChecked ? 'border-blue-500 bg-blue-500' : ''
      }`}>
        {isChecked && (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      <span className="ml-2 text-sm text-gray-700 font-sans select-none">
        {label}
      </span>
    </label>
  );
}

interface FilterGroupProps {
  title: string;
  children: React.ReactNode;
}

export function FilterGroup({ title, children }: FilterGroupProps) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 font-sans">
        {title}
      </h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}
