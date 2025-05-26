'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FacturaConEstado } from '@/types/factura';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { FileText } from 'lucide-react';

interface TopEmisoresChartProps {
  facturas: FacturaConEstado[];
  onEmisorClick?: (rutEmisor: string) => void;
}

interface EmisorData {
  rut: string;
  name: string;
  originalName: string;
  value: number;
  labelValue?: string;
}

export function TopEmisoresChart({ facturas, onEmisorClick }: TopEmisoresChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedRut, setSelectedRut] = useState<string | null>(null);
  
  // Función para formatear el monto en pesos chilenos
  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  };
  
  // Procesar los datos para obtener el top 10 de emisores por monto total
  const procesarDatos = (facturas: FacturaConEstado[]): EmisorData[] => {
    const emisoresMap = new Map<string, { nombre: string; monto: number }>();

    facturas.forEach((factura) => {
      const key = factura.rutEmisor || 'sin-rut';
      const nombre = factura.razonSocialEmisor || 'Sin nombre';
      const monto = factura.montoTotal || 0;

      if (emisoresMap.has(key)) {
        emisoresMap.get(key)!.monto += monto;
      } else {
        emisoresMap.set(key, { nombre, monto });
      }
    });

    // Convertir a array, ordenar por monto y tomar los primeros 10
    return Array.from(emisoresMap.entries())
      .map(([rut, { nombre, monto }]) => ({
        rut,
        name: nombre.length > 20 ? `${nombre.substring(0, 20)}...` : nombre,
        originalName: nombre,
        value: monto,
        labelValue: formatearMoneda(monto)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  };

  const data = procesarDatos(facturas);

  if (data.length === 0) {
    return null;
  }

  // Configuración del gráfico
  const chartConfig = {
    emisores: {
      label: "Emisores",
      color: "hsl(var(--primary))",
      icon: FileText,
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Top 10 Emisores por Monto</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ right: 50, left: 130, top: 10, bottom: 10 }}
            barGap={6}
            barSize={22}
          >
            <defs>
              <linearGradient id="emisorGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--primary)/0.7)" />
              </linearGradient>
            </defs>
            <CartesianGrid horizontal={false} stroke="hsl(var(--border)/0.3)" />
            <XAxis 
              type="number" 
              dataKey="value" 
              tickFormatter={(value) => formatearMoneda(value)}
              tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}}
              axisLine={{stroke: 'hsl(var(--border))'}}
              tickLine={{stroke: 'hsl(var(--border))'}}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={150}
              interval={0} 
              tick={{fill: 'hsl(var(--foreground))', fontSize: 11}}
              axisLine={false}
              tickLine={false}
              className="text-xs font-medium"
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted)/0.8)" }}
              content={<ChartTooltipContent 
                formatter={(value) => formatearMoneda(Number(value))} 
                nameKey="Emisor" 
              />}
            />
            <Bar 
              dataKey="value" 
              name="Emisor" 
              fill="url(#emisorGradient)"
              radius={[0, 4, 4, 0]} 
              onClick={(data) => {
                if (data && data.payload && data.payload.rut) {
                  const rutEmisor = data.payload.rut;
                  
                  // Si ya está seleccionado el mismo emisor, quitar el filtro
                  if (selectedRut === rutEmisor) {
                    setActiveIndex(null);
                    setSelectedRut(null);
                    if (onEmisorClick) {
                      onEmisorClick(''); // Enviar cadena vacía para quitar el filtro
                    }
                  } else {
                    // Seleccionar nuevo emisor
                    setActiveIndex(data.index);
                    setSelectedRut(rutEmisor);
                    if (onEmisorClick) {
                      onEmisorClick(rutEmisor);
                    }
                  }
                }
              }}
              label={(props: any) => {
                const { x, y, width, height, value, payload } = props;
                const labelValue = payload?.labelValue;
                if (!labelValue || width < 40) return <g />;
                return (
                  <g>
                    <text
                      x={x + width - 8}
                      y={y + height / 2}
                      fill="hsl(var(--muted-foreground))"
                      textAnchor="end"
                      dominantBaseline="middle"
                      fontSize={11}
                      fontWeight={500}
                    >
                      {labelValue}
                    </text>
                  </g>
                );
              }}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export default TopEmisoresChart;
