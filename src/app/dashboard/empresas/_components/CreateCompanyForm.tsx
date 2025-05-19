"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/context/AuthProvider';
import { useActiveCompany } from '@/context/ActiveCompanyProvider';
import { signInWithGoogle } from '@/lib/authService';
import type { UserRole } from '@/lib/types';

export default function CreateCompanyForm() {
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading, isFirebaseReady } = useAuthContext();
  const { setActiveCompanyId } = useActiveCompany();

  useEffect(() => {
    console.log("CreateCompanyForm: Auth state", { 
      userExists: !!user, 
      userUid: user?.uid,
      authLoading,
      isFirebaseReady
    });
  }, [user, authLoading, isFirebaseReady]);

  const createCompanyDirectly = async (name: string, ownerUid: string) => {
    if (!db) {
      console.error("CreateCompanyForm: Firestore not initialized");
      throw new Error("Firestore no está inicializado.");
    }

    console.log("CreateCompanyForm: Creating company directly with Firestore", { db });
    
    try {
      const companyData = {
        name,
        ownerUid,
        members: {
          [ownerUid]: 'admin' as UserRole,
        },
        currency: 'CLP', // Default currency for Chilean peso
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'companies'), companyData);
      console.log("CreateCompanyForm: Company created successfully with ID:", docRef.id);
      return { id: docRef.id };
    } catch (error: any) {
      console.error("CreateCompanyForm: Error creating company directly:", error);
      throw new Error(`No se pudo crear la empresa: ${error.message || error}`);
    }
  };

  const ensureUserAuthenticated = async () => {
    if (!isFirebaseReady) {
      console.error("CreateCompanyForm: Firebase not initialized");
      toast({ 
        title: "Error de inicialización", 
        description: "No se pudo inicializar Firebase. Intente recargar la página.", 
        variant: "destructive" 
      });
      return false;
    }

    if (!user) {
      try {
        console.log("CreateCompanyForm: No user found, attempting to sign in with Google");
        await signInWithGoogle();
        toast({ 
          title: "Inicio de sesión exitoso", 
          description: "Ahora puedes crear tu empresa", 
          variant: "default" 
        });
        return true;
      } catch (error) {
        console.error("CreateCompanyForm: Failed to sign in with Google", error);
        toast({ 
          title: "Error de autenticación", 
          description: "No se pudo iniciar sesión. Intente nuevamente.", 
          variant: "destructive" 
        });
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("CreateCompanyForm: Form submitted", { companyName });
    
    if (!companyName.trim()) {
      toast({ title: "Error", description: "El nombre de la empresa no puede estar vacío.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    
    const isAuthenticated = await ensureUserAuthenticated();
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    // At this point, user should be authenticated, but let's double-check
    if (!user || !user.uid) {
      console.error("CreateCompanyForm: Still no authenticated user after login attempt");
      toast({ title: "Error", description: "Debes iniciar sesión para crear una empresa.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    // Try to create the company directly with Firestore instead of using the service
    try {
      console.log("CreateCompanyForm: Creating company directly", { companyName, userUid: user.uid, firestoreExists: !!db });
      
      const result = await createCompanyDirectly(companyName, user.uid);
      console.log("CreateCompanyForm: Direct company creation result", result);
      
      toast({ title: "Éxito", description: `Empresa "${companyName}" creada.` });
      setCompanyName('');
      setIsOpen(false);
      setActiveCompanyId(result.id);
      router.push(`/dashboard`); 
    } catch (error: any) {
      console.error("CreateCompanyForm: Failed to create company directly", error);
      toast({ 
        title: "Error al crear empresa", 
        description: error.message || "No se pudo crear la empresa. Intente nuevamente.", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
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
