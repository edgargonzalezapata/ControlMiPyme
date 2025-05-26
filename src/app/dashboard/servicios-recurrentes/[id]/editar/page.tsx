"use client";

import { useState, useEffect, use } from 'react';
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
import { getRecurringService, updateRecurringService } from '@/lib/recurringServiceService';
import { useActiveCompany } from '@/context/ActiveCompanyProvider';
import type { RecurringService } from '@/lib/recurringServiceTypes';

// Esquema de validación para el formulario
const formSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  description: z.string().min(5, { message: 'La descripción debe tener al menos 5 caracteres' }),
  amount: z.coerce.number().positive({ message: 'El monto debe ser un número positivo' }),
  currency: z.string().min(1, { message: 'Selecciona una moneda' }),
  billingDay: z.coerce.number().min(1, { message: 'El día debe ser al menos 1' }).max(31, { message: 'El día no puede ser mayor a 31' }),
  status: z.enum(['active', 'inactive'], { message: 'Selecciona un estado válido' }),
});

export default function EditRecurringServicePage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  // Desenvolver los parámetros de ruta usando React.use()
  const unwrappedParams = typeof params === 'object' && !('then' in params) ? params : use(params);
  const serviceId = unwrappedParams.id;
  
  const { toast } = useToast();
  const router = useRouter();
  const { activeCompanyDetails: currentCompany } = useActiveCompany();
  const [service, setService] = useState<RecurringService | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Inicializar formulario con react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      amount: 0,
      currency: 'CLP',
      billingDay: 1,
      status: 'active',
    },
  });

  // Cargar datos del servicio
  useEffect(() => {
    const loadService = async () => {
      if (!serviceId) return;
      
      setLoading(true);
      try {
        const serviceResult = await getRecurringService(serviceId);
        
        if (!('error' in serviceResult)) {
          setService(serviceResult);
          
          // Actualizar valores del formulario
          form.reset({
            name: serviceResult.name,
            description: serviceResult.description,
            amount: serviceResult.amount,
            currency: serviceResult.currency,
            billingDay: serviceResult.billingDay,
            status: serviceResult.status,
          });
        } else {
          toast({
            title: "Error",
            description: serviceResult.error,
            variant: "destructive",
          });
          router.push('/dashboard/servicios-recurrentes');
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: `Error al cargar el servicio: ${error.message}`,
          variant: "destructive",
        });
        router.push('/dashboard/servicios-recurrentes');
      } finally {
        setLoading(false);
      }
    };
    
    loadService();
  }, [serviceId, form, router, toast]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentCompany?.id || !serviceId) {
      toast({
        title: "Error",
        description: "No hay una empresa seleccionada o el ID del servicio no es válido",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await updateRecurringService(serviceId, values);
      
      if ('success' in result) {
        toast({
          title: "Éxito",
          description: "Servicio recurrente actualizado correctamente",
        });
        router.push(`/dashboard/servicios-recurrentes/${serviceId}`);
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
        description: `Error al actualizar el servicio: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold">Cargando servicio...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold">Editar Servicio Recurrente</h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Información del Servicio</CardTitle>
          <CardDescription>
            Actualiza los detalles del servicio recurrente.
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
                        value={field.value}
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
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormDescription>
                        Día del mes en que se factura
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
                        value={field.value}
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
                        Estado del servicio
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
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
