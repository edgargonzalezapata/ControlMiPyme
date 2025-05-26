'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock } from 'lucide-react';
import { useActivePeriod } from '@/context/ActivePeriodProvider';

export default function PeriodoPage() {
  const { toast } = useToast();
  const { activePeriod, setActivePeriod } = useActivePeriod();
  
  const [selectedMonth, setSelectedMonth] = useState<number>(activePeriod.month);
  const [selectedYear, setSelectedYear] = useState<number>(activePeriod.year);
  
  // Actualizar los valores seleccionados cuando cambie el periodo activo
  useEffect(() => {
    setSelectedMonth(activePeriod.month);
    setSelectedYear(activePeriod.year);
  }, [activePeriod]);
  
  // Generar años desde 2020 hasta el año actual + 1
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2020 + 2 }, (_, i) => 2020 + i);
  
  // Lista de meses
  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];
  
  // Manejar el guardado del periodo
  const handleSavePeriod = () => {
    setActivePeriod({ month: selectedMonth, year: selectedYear });
    toast({
      title: 'Periodo actualizado',
      description: `El periodo activo ha sido actualizado a ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}.`,
    });
  };
  
  // Establecer el periodo actual
  const handleSetCurrentPeriod = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    setSelectedMonth(currentMonth);
    setSelectedYear(currentYear);
    setActivePeriod({ month: currentMonth, year: currentYear });
    
    toast({
      title: 'Periodo actualizado',
      description: `El periodo activo ha sido actualizado al mes y año actuales.`,
    });
  };
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuración de Periodo</h1>
          <p className="text-muted-foreground">
            Establece el mes y año activos para filtrar en facturación y transacciones
          </p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>Periodo Activo</CardTitle>
          </div>
          <CardDescription>
            El periodo seleccionado se utilizará como filtro predeterminado en los módulos de facturación y transacciones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="month" className="text-sm font-medium">Mes</label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger id="month" className="w-full">
                  <SelectValue placeholder="Selecciona un mes" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="year" className="text-sm font-medium">Año</label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger id="year" className="w-full">
                  <SelectValue placeholder="Selecciona un año" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-8">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Periodo activo actual: {months.find(m => m.value === activePeriod.month)?.label} {activePeriod.year}</span>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleSetCurrentPeriod}>
                Establecer periodo actual
              </Button>
              <Button onClick={handleSavePeriod}>
                Guardar cambios
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>¿Cómo funciona?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            El periodo activo se utiliza como filtro predeterminado en los siguientes módulos:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Facturación:</strong> Las facturas se filtrarán automáticamente por el mes y año seleccionados.
            </li>
            <li>
              <strong>Transacciones:</strong> Las transacciones bancarias se mostrarán según el periodo activo.
            </li>
          </ul>
          <p>
            Puedes cambiar el periodo en cualquier momento desde esta página. El cambio se aplicará inmediatamente en todos los módulos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
