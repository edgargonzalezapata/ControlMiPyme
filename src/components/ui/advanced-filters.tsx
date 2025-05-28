"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  X, 
  Calendar, 
  Search, 
  DollarSign, 
  RotateCcw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'select';
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface AdvancedFiltersProps {
  fields: FilterField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onClear: () => void;
  onQuickFilter?: (preset: string) => void;
  quickFilters?: { key: string; label: string; action: () => void }[];
  className?: string;
  title?: string;
  collapsible?: boolean;
}

export function AdvancedFilters({
  fields,
  values,
  onChange,
  onClear,
  onQuickFilter,
  quickFilters = [],
  className,
  title = "Filtros",
  collapsible = true
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Count active filters
  const activeFiltersCount = Object.values(values).filter(value => value && value !== 'todos').length;
  
  // Get icon for field type
  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'text': return <Search className="h-4 w-4" />;
      case 'date': return <Calendar className="h-4 w-4" />;
      case 'number': return <DollarSign className="h-4 w-4" />;
      default: return <Filter className="h-4 w-4" />;
    }
  };

  const FilterContent = () => (
    <CardContent className="space-y-4">
      {/* Quick filters */}
      {quickFilters.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Filtros rápidos
          </Label>
          <div className="flex flex-wrap gap-2">
            {quickFilters.map((filter) => (
              <Button
                key={filter.key}
                variant="outline"
                size="sm"
                onClick={filter.action}
                className="h-7 px-2 text-xs"
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Filter fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <Label 
              htmlFor={field.key} 
              className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"
            >
              {getFieldIcon(field.type)}
              {field.label}
            </Label>
            
            {field.type === 'select' ? (
              <select
                id={field.key}
                value={values[field.key] || ''}
                onChange={(e) => onChange(field.key, e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="">Todos</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id={field.key}
                type={field.type}
                placeholder={field.placeholder}
                value={values[field.key] || ''}
                onChange={(e) => onChange(field.key, e.target.value)}
                className="text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            )}
          </div>
        ))}
      </div>

      {/* Clear filters button */}
      {activeFiltersCount > 0 && (
        <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} activo{activeFiltersCount !== 1 ? 's' : ''}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Limpiar filtros
          </Button>
        </div>
      )}
    </CardContent>
  );

  if (!collapsible) {
    return (
      <Card className={cn("shadow-sm", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            {title}
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <FilterContent />
      </Card>
    );
  }

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader 
        className="pb-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Filter className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          {title}
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFiltersCount}
            </Badge>
          )}
          <div className="ml-auto flex items-center gap-2">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && <FilterContent />}
    </Card>
  );
} 