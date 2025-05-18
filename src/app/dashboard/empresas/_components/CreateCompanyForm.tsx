
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, Loader2 } from 'lucide-react';
import { createCompany } from '@/lib/companyService';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/context/AuthProvider';
import { useActiveCompany } from '@/context/ActiveCompanyProvider'; // Import useActiveCompany

export default function CreateCompanyForm() {
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthContext();
  const { setActiveCompanyId } = useActiveCompany(); // Get setActiveCompanyId

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast({ title: "Error", description: "El nombre de la empresa no puede estar vacío.", variant: "destructive" });
      return;
    }

    if (!user || !user.uid) {
      toast({ title: "Error", description: "Debes iniciar sesión para crear una empresa.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const result = await createCompany(companyName, user.uid);
    setIsLoading(false);

    if ('id' in result) {
      toast({ title: "Éxito", description: `Empresa "${companyName}" creada.` });
      setCompanyName('');
      setIsOpen(false);
      setActiveCompanyId(result.id); // Set the new company as active
      router.push(`/dashboard`); // Navigate to the main dashboard for the new active company
    } else {
      toast({ title: "Error al crear empresa", description: result.error, variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Nueva Empresa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Empresa</DialogTitle>
          <DialogDescription>
            Ingresa el nombre para tu nueva empresa. Se convertirá en tu empresa activa.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="companyName" className="text-right">
                Nombre
              </Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="col-span-3"
                placeholder="Mi Grandiosa Empresa S.A."
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" disabled={isLoading || !user} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Crear y Activar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
