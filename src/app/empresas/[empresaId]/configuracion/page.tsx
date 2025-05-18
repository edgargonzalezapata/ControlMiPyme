
"use client"; // For form handling and potential client-side interactions
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Trash2, Save, Loader2, Users, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Company, CompanyMember, UserRole } from '@/lib/types';
import { getCompanyById, updateCompany, addCompanyMember, removeCompanyMember, deleteCompany, canUserManageCompany } from '@/lib/companyService';
import { useAuthContext } from '@/context/AuthProvider';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


export default function EmpresaConfiguracionPage() {
  const router = useRouter();
  const params = useParams();
  const empresaId = params.empresaId as string;
  const { user, loading: authLoading, isFirebaseReady } = useAuthContext();
  const { toast } = useToast();

  const [company, setCompany] = useState<Company | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('viewer');

  useEffect(() => {
    if (!isFirebaseReady || authLoading || !user?.uid) return; // Wait for auth to be ready

    const fetchCompany = async () => {
      setIsPageLoading(true);
      const fetchedCompany = await getCompanyById(empresaId);
      if (fetchedCompany) {
        // User must be a member to even see this page, further restricted by isAdmin for actions
        if (!(fetchedCompany.members && fetchedCompany.members[user.uid])) {
            toast({ title: "Acceso Denegado", description: "No eres miembro de esta empresa.", variant: "destructive" });
            router.push(`/empresas`);
            return;
        }
        const userIsAdmin = await canUserManageCompany(empresaId, user.uid);
        setCompany(fetchedCompany);
        setCompanyName(fetchedCompany.name);
        setIsAdmin(userIsAdmin); // This will control editability
      } else {
        toast({ title: "Error", description: "Empresa no encontrada.", variant: "destructive" });
        router.push('/empresas');
      }
      setIsPageLoading(false);
    };
    fetchCompany();
  }, [empresaId, user, authLoading, router, toast, isFirebaseReady]);

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !company) return;
    setIsLoading(true);
    const result = await updateCompany(company.id, companyName);
    setIsLoading(false);
    if ('success' in result) {
      toast({ title: "Éxito", description: "Nombre de la empresa actualizado." });
      setCompany(prev => prev ? { ...prev, name: companyName } : null);
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim() || !company) return;
    setIsLoading(true);
    const result = await addCompanyMember(company.id, newMemberEmail, newMemberRole);
    setIsLoading(false);
    if ('success' in result) {
      toast({ title: "Éxito", description: `Miembro ${newMemberEmail} añadido como ${newMemberRole}.` });
      const updatedCompany = await getCompanyById(empresaId);
      if(updatedCompany) setCompany(updatedCompany);
      setNewMemberEmail('');
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const handleRemoveMember = async (memberUid: string) => {
    if (!company) return;
    setIsLoading(true);
    const result = await removeCompanyMember(company.id, memberUid);
    setIsLoading(false);
    if ('success' in result) {
      toast({ title: "Éxito", description: "Miembro eliminado." });
      const updatedCompany = await getCompanyById(empresaId);
      if(updatedCompany) setCompany(updatedCompany);
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const handleDeleteCompany = async () => {
    if (!company || company.ownerUid !== user?.uid) {
        toast({ title: "Error", description: "Solo el propietario puede eliminar la empresa.", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    const result = await deleteCompany(company.id);
    setIsLoading(false);
    if ('success' in result) {
        toast({ title: "Éxito", description: "Empresa eliminada." });
        router.push('/empresas');
    } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  if (isPageLoading || authLoading || !isFirebaseReady) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Cargando configuración...</p>
      </div>
    );
  }

  if (!company) {
    return <p>Empresa no encontrada o acceso no autorizado.</p>; // Should be caught by useEffect redirect
  }

  // If user is not admin, show a read-only view or limited info
  if (!isAdmin) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><ShieldAlert className="mr-2 h-6 w-6 text-yellow-500" />Acceso Limitado a Configuración</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Tu rol actual es '{company.members[user?.uid || '']}'. Solo los administradores de la empresa pueden modificar la configuración.</p>
                 <p className="mt-4">Nombre de la empresa: <strong>{company.name}</strong></p>
            </CardContent>
        </Card>
    );
  }

  // Admin view from here
  const memberList: CompanyMember[] = company.members ? Object.entries(company.members).map(([uid, role]) => ({
    uid,
    role,
    email: uid.startsWith("placeholder_uid_for_") ? `${uid.replace("placeholder_uid_for_","")} (Placeholder)` : `UID: ${uid}`, // Simplified
  })) : [];


  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Información de la Empresa</CardTitle>
          <CardDescription>Actualiza el nombre de tu empresa.</CardDescription>
        </CardHeader>
        <form onSubmit={handleUpdateCompany}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companyNameConfig">Nombre de la Empresa</Label>
              <Input
                id="companyNameConfig"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={isLoading || !isAdmin}
              />
            </div>
          </CardContent>
          <CardFooter>
            {isAdmin && (
                <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar Cambios
                </Button>
            )}
          </CardFooter>
        </form>
      </Card>

      {isAdmin && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5"/>Administrar Miembros</CardTitle>
              <CardDescription>Invita y gestiona los roles de los miembros de tu empresa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleAddMember} className="flex items-end gap-2">
                <div className="flex-grow">
                  <Label htmlFor="newMemberEmail">Correo del Nuevo Miembro</Label>
                  <Input
                    id="newMemberEmail"
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="ejemplo@dominio.com"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="newMemberRole">Rol</Label>
                  <Select value={newMemberRole} onValueChange={(value) => setNewMemberRole(value as UserRole)} disabled={isLoading}>
                    <SelectTrigger id="newMemberRole" className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Lector</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  Añadir
                </Button>
              </form>
              <div className="space-y-2">
                <h4 className="font-medium">Miembros Actuales:</h4>
                {memberList.length > 0 ? (
                  <ul className="divide-y divide-border rounded-md border">
                    {memberList.map(member => (
                      <li key={member.uid} className="flex items-center justify-between p-3">
                        <div>
                          <p className="font-medium">{member.displayName || member.email}</p>
                          <p className="text-sm text-muted-foreground capitalize">{member.role} {company.ownerUid === member.uid && "(Propietario)"}</p>
                        </div>
                        {company.ownerUid !== member.uid && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <Button variant="ghost" size="icon" disabled={isLoading}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        ¿Estás seguro de que quieres eliminar a {member.email} de la empresa? Esta acción no se puede deshacer.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleRemoveMember(member.uid)} disabled={isLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Eliminar Miembro"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay otros miembros en esta empresa.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {company.ownerUid === user?.uid && (
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
                    <CardDescription>Acciones irreversibles. Procede con precaución.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isLoading}>
                                <Trash2 className="mr-2 h-4 w-4"/> Eliminar Empresa
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Confirmar eliminación de la empresa?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción es irreversible. Se eliminará la empresa "{company.name}" y todos sus datos asociados (cuentas, transacciones, archivos).
                                    Escribe el nombre de la empresa para confirmar: <span className="font-bold">{company.name}</span>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteCompany} disabled={isLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Sí, eliminar esta empresa"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <p className="text-xs text-muted-foreground mt-2">
                        Solo el propietario puede eliminar la empresa. Esta acción borrará todos los datos.
                    </p>
                </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
