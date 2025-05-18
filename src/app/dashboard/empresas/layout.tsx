
"use client";

// Este layout ahora está anidado dentro de DashboardLayout,
// por lo que la protección de ruta principal y la estructura del sidebar
// son manejadas por DashboardLayout.
// Este layout puede usarse para estructura específica de la sección de empresas si es necesario,
// o puede ser simplemente un passthrough.

export default function EmpresasDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No se necesita lógica de autenticación aquí, ya que DashboardLayout la maneja.
  // No se necesita lógica de 'isInsideDashboardLayout', ya que siempre lo estará.
  return <>{children}</>;
}
