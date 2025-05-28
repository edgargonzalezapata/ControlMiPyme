"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showClearButton?: boolean;
  debounceMs?: number;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Buscar...",
  className,
  showClearButton = true,
  debounceMs = 300
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, onChange, debounceMs]);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className="pl-10 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        {showClearButton && localValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Limpiar búsqueda</span>
          </Button>
        )}
      </div>
    </div>
  );
} 