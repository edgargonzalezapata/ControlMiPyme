"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { createRecurringService } from '@/lib/recurringServiceService';
import { useActiveCompany } from '@/context/ActiveCompanyProvider';

// Esquema de validación para el formulario
const formSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  description: z.string().min(5, { message: 'La descripción debe tener al menos 5 caracteres' }),
  amount: z.coerce.number().positive({ message: 'El monto debe ser un número positivo' }),
  currency: z.string().min(1, { message: 'Selecciona una moneda' }),
  billingDay: z.coerce.number().min(1, { message: 'El día debe ser al menos 1' }).max(31, { message: 'El día no puede ser mayor a 31' }),
  status: z.enum(['active', 'inactive'], { message: 'Selecciona un estado válido' }),
});

export default function NewRecurringServicePage() {
  const { toast } = useToast();
  const router = useRouter();
  const { activeCompanyDetails: currentCompany } = useActiveCompany();
  const [submitting, setSubmitting] = useState(false);

  // Inicializar formulario con react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      amount: 0,
      currency: currentCompany?.currency || 'CLP',
      billingDay: 1,
      status: 'active',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentCompany?.id) {
      toast({
        title: "Error",
        description: "No hay una empresa seleccionada",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await createRecurringService(currentCompany.id, values);
      
      if ('id' in result) {
        toast({
          title: "Éxito",
          description: "Servicio recurrente creado correctamente",
        });
        router.push('/dashboard/servicios-recurrentes');
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al crear el servicio: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold">Nuevo Servicio Recurrente</h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Información del Servicio</CardTitle>
          <CardDescription>
            Ingresa los detalles del servicio que deseas facturar mensualmente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Servicio</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Hosting Web" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nombre identificativo del servicio
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ej: Servicio de hosting web para la página corporativa" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Breve descripción del servicio
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto Mensual</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Monto a facturar mensualmente
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moneda</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una moneda" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CLP">Peso Chileno (CLP)</SelectItem>
                          <SelectItem value="USD">Dólar Estadounidense (USD)</SelectItem>
                          <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Moneda en la que se factura
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="billingDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Día de Facturación</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1} 
                          max={31} 
                          placeholder="1" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormDescription>
                        Día del mes en que se debe facturar (1-31)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="inactive">Inactivo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Estado actual del servicio
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full md:w-auto"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {submitting ? 'Guardando...' : 'Guardar Servicio'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
