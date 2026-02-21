import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Department } from '../../lib/types';
import { api } from '../../lib/api';

interface DepartmentSelectorProps {
  value: string;
  onChange: (departmentId: string) => void;
}

export function DepartmentSelector({ value, onChange }: DepartmentSelectorProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    api.fetch<Department[]>('/auth/departments').then(setDepartments).catch(() => {});
  }, []);

  const selected = departments.find((d) => d.id === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full px-3 py-2 bg-root-bg border border-white/10 rounded-lg text-sm text-root-text hover:border-root-accent/30 transition-colors"
      >
        <span className="flex-1 text-left truncate">{selected?.name || 'Select Department'}</span>
        <ChevronDown size={14} className={`text-root-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-root-card border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => { onChange(dept.id); setIsOpen(false); }}
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                dept.id === value
                  ? 'bg-root-accent/10 text-root-accent'
                  : 'text-root-text hover:bg-white/5'
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
