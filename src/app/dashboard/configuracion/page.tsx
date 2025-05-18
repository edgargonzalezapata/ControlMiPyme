
"use client"; 
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Trash2, Save, Loader2, Users, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Company, CompanyMember, UserRole } from '@/lib/types';
import { updateCompany, addCompanyMember, removeCompanyMember, deleteCompany } from '@/lib/companyService';
import { useAuthContext } from '@/context/AuthProvider';
import { useActiveCompany } from '@/context/ActiveCompanyProvider';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { doc, getDoc } from 'firebase/firestore'; // Direct Firestore access
import { db } from '@/lib/firestore';

export default function ConfiguracionEmpresaDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, isFirebaseReady } = useAuthContext();
  const { activeCompanyId, activeCompanyDetails, isLoadingActiveCompany, setActiveCompanyId, refreshActiveCompanyDetails } = useActiveCompany();
  const { toast } = useToast();

  // Local state for this page, driven by activeCompanyDetails
  const [companyForConfig, setCompanyForConfig] = useState<Company | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  const [isLoadingPageData, setIsLoadingPageData] = useState(true); // For this page's specific data loading

  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('viewer');
  const [formSubmitting, setFormSubmitting] = useState(false);


  useEffect(() => {
    if (isLoadingActiveCompany || authLoading || !isFirebaseReady) {
      setIsLoadingPageData(true);
      return;
    }

    if (!activeCompanyId) {
      setCompanyForConfig(null);
      setIsLoadingPageData(false);
      return;
    }
    
    if (activeCompanyDetails && activeCompanyDetails.id === activeCompanyId) {
        // Ensure the details are for the current activeCompanyId
        setCompanyForConfig(activeCompanyDetails);
        setCompanyName(activeCompanyDetails.name);
        if (user && activeCompanyDetails.members && activeCompanyDetails.members[user.uid]) {
          setIsCurrentUserAdmin(activeCompanyDetails.members[user.uid] === 'admin');
        } else {
          // User is not a member of the active company, or details are stale
          setIsCurrentUserAdmin(false);
          // Potentially redirect or show access denied if provider hasn't cleared it
        }
        setIsLoadingPageData(false);
    } else if (activeCompanyId && !activeCompanyDetails && !isLoadingActiveCompany) {
        // Active ID exists, but no details yet, and provider is not loading (could be an issue)
        // This might indicate the user is not a member of activeCompanyId or it's invalid
        // The ActiveCompanyProvider should handle clearing activeCompanyId if user is not a member
        setCompanyForConfig(null); 
        setIsLoadingPageData(false);
    }

  }, [activeCompanyId, activeCompanyDetails, user, authLoading, isLoadingActiveCompany, isFirebaseReady]);


  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !companyForConfig) return;
    setFormSubmitting(true);
    const result = await updateCompany(companyForConfig.id, companyName);
    setFormSubmitting(false);
    if ('success' in result) {
      toast({ title: "Éxito", description: "Nombre de la empresa actualizado." });
      refreshActiveCompanyDetails(); // Refresh global context
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim() || !companyForConfig) return;
    setFormSubmitting(true);
    const result = await addCompanyMember(companyForConfig.id, newMemberEmail, newMemberRole);
    setFormSubmitting(false);
    if ('success' in result) {
      toast({ title: "Éxito", description: `Miembro ${newMemberEmail} añadido como ${newMemberRole}.` });
      refreshActiveCompanyDetails();
      setNewMemberEmail('');
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const handleRemoveMember = async (memberUid: string) => {
    if (!companyForConfig) return;
    setFormSubmitting(true);
    const result = await removeCompanyMember(companyForConfig.id, memberUid);
    setFormSubmitting(false);
    if ('success' in result) {
      toast({ title: "Éxito", description: "Miembro eliminado." });
      refreshActiveCompanyDetails();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const handleDeleteCompany = async () => {
    if (!companyForConfig || companyForConfig.ownerUid !== user?.uid) {
        toast({ title: "Error", description: "Solo el propietario puede eliminar la empresa.", variant: "destructive" });
        return;
    }
    setFormSubmitting(true);
    const result = await deleteCompany(companyForConfig.id);
    setFormSubmitting(false);
    if ('success' in result) {
        toast({ title: "Éxito", description: "Empresa eliminada." });
        setActiveCompanyId(null); // Clear active company
        router.push('/dashboard/empresas'); 
    } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  if (isLoadingPageData || authLoading || isLoadingActiveCompany) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Cargando configuración...</p>
      </div>
    );
  }

  if (!activeCompanyId || !companyForConfig) {
    return (
         <Card className="text-center py-10 border-destructive">
            <CardHeader>
                <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
                <CardTitle className="text-xl text-destructive">No hay empresa activa</CardTitle>
                <CardDescription>Por favor, selecciona una empresa para configurar.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Button onClick={() => router.push('/dashboard')}>Volver al Dashboard</Button>
            </CardContent>
        </Card>
    );
  }
  
  // Additional check to ensure user is actually a member after all loading states
  if (user && companyForConfig.members && !companyForConfig.members[user.uid]) {
     return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><ShieldAlert className="mr-2 h-6 w-6 text-yellow-500" />Acceso Denegado</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">No eres miembro de la empresa activa. Selecciona otra empresa o contacta al administrador.</p>
                 <Button onClick={() => router.push('/dashboard')} className="mt-4">Volver al Dashboard</Button>
            </CardContent>
        </Card>
    );
  }


  if (!isCurrentUserAdmin) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><ShieldAlert className="mr-2 h-6 w-6 text-yellow-500" />Acceso Limitado</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Tu rol actual es '{companyForConfig.members[user?.uid || '']}'. Solo los administradores pueden modificar la configuración de <span className="font-semibold">{companyForConfig.name}</span>.</p>
                 <p className="mt-4">Nombre de la empresa: <strong>{companyForConfig.name}</strong></p>
            </CardContent>
        </Card>
    );
  }

  const memberList: CompanyMember[] = companyForConfig.members ? Object.entries(companyForConfig.members).map(([uid, role]) => ({
    uid,
    role,
    // TODO: Fetch member display names/emails if needed, this is a placeholder
    email: uid.startsWith("placeholder_uid_for_") ? `${uid.replace("placeholder_uid_for_","")} (Placeholder)` : `UID: ${uid}`, 
  })) : [];


  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Configuración de: {companyForConfig.name}</CardTitle>
          <CardDescription>Actualiza el nombre y gestiona los miembros de tu empresa.</CardDescription>
        </CardHeader>
        <form onSubmit={handleUpdateCompany}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companyNameConfig">Nombre de la Empresa</Label>
              <Input
                id="companyNameConfig"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={formSubmitting || !isCurrentUserAdmin}
              />
            </div>
          </CardContent>
          <CardFooter>
            {isCurrentUserAdmin && (
                <Button type="submit" disabled={formSubmitting}>
                {formSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar Cambios
                </Button>
            )}
          </CardFooter>
        </form>
      </Card>

      {isCurrentUserAdmin && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5"/>Administrar Miembros</CardTitle>
              <CardDescription>Invita y gestiona los roles de los miembros.</CardDescription>
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
                    disabled={formSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="newMemberRole">Rol</Label>
                  <Select value={newMemberRole} onValueChange={(value) => setNewMemberRole(value as UserRole)} disabled={formSubmitting}>
                    <SelectTrigger id="newMemberRole" className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Lector</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={formSubmitting}>
                  {formSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
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
                          <p className="text-sm text-muted-foreground capitalize">{member.role} {companyForConfig.ownerUid === member.uid && "(Propietario)"}</p>
                        </div>
                        {companyForConfig.ownerUid !== member.uid && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <Button variant="ghost" size="icon" disabled={formSubmitting}>
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
                                    <AlertDialogCancel disabled={formSubmitting}>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleRemoveMember(member.uid)} disabled={formSubmitting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        {formSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Eliminar Miembro"}
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

          {companyForConfig.ownerUid === user?.uid && (
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
                    <CardDescription>Acciones irreversibles. Procede con precaución.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={formSubmitting}>
                                <Trash2 className="mr-2 h-4 w-4"/> Eliminar Empresa
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Confirmar eliminación de la empresa?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción es irreversible. Se eliminará la empresa "{companyForConfig.name}" y todos sus datos asociados.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={formSubmitting}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteCompany} disabled={formSubmitting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    {formSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Sí, eliminar esta empresa"}
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
