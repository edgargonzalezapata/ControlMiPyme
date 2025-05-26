# Control MiPyme

Control MiPyme es una aplicación web diseñada para ayudar a pequeñas y medianas empresas (PYMEs) a gestionar sus finanzas, realizar seguimiento de transacciones, administrar facturación y servicios recurrentes, y supervisar múltiples entidades comerciales desde una plataforma única e intuitiva.

## Tecnologías Utilizadas (Tech Stack)

*   **Framework:** Next.js 15 (App Router)
*   **Lenguaje:** TypeScript
*   **Estilos:** Tailwind CSS
*   **Componentes UI:** Shadcn/ui
*   **Backend & Base de Datos:** Firebase (Authentication, Firestore)
*   **Gestión de Estado:** React Context API
*   **Visualización de Datos:** Recharts
*   **Validación de Formularios:** React Hook Form, Zod
*   **Procesamiento de Documentos:** xml2js, xlsx
*   **Generación de PDF:** @react-pdf/renderer
*   **Gestión de Fechas:** date-fns

## Estructura del Proyecto

El proyecto sigue una estructura estándar de Next.js con el App Router:

*   `README.md`: Este archivo.
*   `next.config.ts`: Configuración de Next.js.
*   `tailwind.config.ts`: Configuración de Tailwind CSS.
*   `tsconfig.json`: Configuración de TypeScript.
*   `package.json`: Dependencias y scripts del proyecto.
*   `public/`: Archivos estáticos (ej. imágenes, favicon).
*   `src/`: Código principal de la aplicación.
    *   `app/`: Contiene todas las rutas, layouts y páginas.
        *   `api/`: Manejadores de rutas API.
        *   `dashboard/`: Rutas y componentes específicos del panel de control del usuario autenticado.
            *   `layout.tsx`: Layout para la sección del panel de control, incluyendo la barra lateral principal.
            *   `page.tsx`: Página principal del panel de control que muestra resúmenes financieros.
            *   `empresas/`: Páginas para la gestión de empresas.
            *   `cuentas/`: Páginas para la gestión de cuentas bancarias.
            *   `transacciones/`: Páginas para la gestión de transacciones.
            *   `facturacion/`: Páginas para la gestión de facturas (dashboard, lista, importación).
            *   `servicios-recurrentes/`: Páginas para la gestión de servicios con facturación mensual.
            *   `periodo/`: Páginas para la gestión de períodos contables.
            *   `perfil/`: Página de perfil del usuario.
            *   `configuracion/`: Página de configuración de la empresa.
        *   `globals.css`: Estilos globales y capas base/componentes/utilidades de Tailwind CSS, incluyendo variables de tema.
        *   `layout.tsx`: Layout raíz para toda la aplicación.
        *   `page.tsx`: Página de inicio/login.
    *   `components/`: Componentes React reutilizables.
        *   `ui/`: Componentes de UI, muchos de Shadcn/ui, incluyendo `Button`, `Card`, `Input`, `Sidebar`, `ThemeToggle`, etc.
        *   `layout/`: Componentes específicos de layout como `Navbar`.
        *   `facturacion/`: Componentes específicos para la gestión de facturas, como `FacturasList`, `FacturaDetalle`, `TopEmisoresChart`, etc.
        *   `FirebaseInitializer.tsx`: Componente para inicializar Firebase.
    *   `context/`: Proveedores de React Context API para la gestión de estado global.
        *   `AuthProvider.tsx`: Gestiona el estado de autenticación del usuario.
        *   `ActiveCompanyProvider.tsx`: Gestiona la empresa activa actualmente seleccionada.
        *   `ThemeProvider.tsx`: Gestiona el estado del tema claro/oscuro.
        *   `ActivePeriodProvider.tsx`: Gestiona el período contable activo.
    *   `hooks/`: Hooks React personalizados (ej. `useToast`, `useIsMobile`).
    *   `lib/`: Funciones de utilidad, capas de servicio y definiciones de tipos.
        *   `authService.ts`: Funciones para la autenticación con Firebase (Google Sign-In, Sign Out).
        *   `companyService.ts`: Funciones para operaciones CRUD de empresas y gestión de miembros.
        *   `accountService.ts`: Funciones para la gestión de cuentas bancarias.
        *   `transactionService.ts`: Funciones para la gestión de transacciones financieras.
        *   `facturaService.ts`: Funciones para la gestión de facturas.
        *   `recurringServiceService.ts`: Funciones para la gestión de servicios recurrentes y su facturación.
        *   `parseFacturasTxt.ts`: Funciones para importar facturas desde archivos de texto.
        *   `firebase.ts`: Inicialización de la aplicación Firebase.
        *   `firestore.ts`: Instancia de la base de datos Firestore.
        *   `initializeFirestore.ts`: Funciones para inicializar Firestore.
        *   `types.ts`: Definiciones de tipos TypeScript para las principales estructuras de datos.
        *   `recurringServiceTypes.ts`: Tipos para servicios recurrentes y facturación.
        *   `utils.ts`: Funciones de utilidad generales (ej. `cn` para classnames).
*   `firebase.json`: Configuración del proyecto Firebase para hosting y Firestore.
*   `firestore.rules`: Reglas de seguridad para Firestore.
*   `firestore.indexes.json`: Definiciones de índices de Firestore.

## Funcionalidades Clave

*   **Autenticación de Usuarios:** Inicio de sesión/registro seguro usando Google (Firebase Authentication).
*   **Panel de Control (Dashboard):** Vista centralizada para usuarios autenticados.
    *   **Navegación con Barra Lateral Adaptable (Responsive Sidebar):** (`src/components/ui/sidebar.tsx`, integrada en `src/app/dashboard/layout.tsx`) Navegación colapsable y amigable con dispositivos móviles.
    *   **Contenido Dinámico:** Muestra información relevante para la empresa seleccionada o datos generales del usuario.
*   **Gestión de Empresas:**
    *   Crear, ver, actualizar y eliminar empresas.
    *   Gestionar miembros de la empresa y sus roles (administrador/lector).
    *   Seleccionar una empresa "activa" para enfocar las vistas del panel de control.
*   **Seguimiento Financiero (Por Empresa):**
    *   Gestionar cuentas bancarias.
    *   Registrar y categorizar ingresos y gastos.
    *   Ver resúmenes financieros (ingresos totales, gastos, saldo).
    *   Filtrado de datos financieros por fecha.
*   **Gestión de Facturación:**
    *   Importar facturas emitidas y recibidas desde archivos XML o TXT.
    *   Visualizar facturas en formato detallado.
    *   Dashboard con gráficos de principales emisores y montos.
    *   Listado de facturas con filtros por estado y período.
*   **Servicios Recurrentes:**
    *   Registrar servicios con montos fijos que se facturan mensualmente.
    *   Configurar día específico del mes para la facturación.
    *   Recibir notificaciones cuando se debe facturar un servicio.
    *   Marcar facturas como pagadas o pendientes.
    *   Ver historial de facturación de cada servicio.
*   **Gestión de Períodos Contables:**
    *   Definir y seleccionar períodos contables para filtrar información financiera.
    *   Visualizar datos específicos por período.
*   **Personalización de Tema:**
    *   Soporte para modo claro y oscuro (`src/context/ThemeProvider.tsx`, `src/components/ui/theme-toggle.tsx`).
    *   Preferencia de tema guardada en `localStorage`.
*   **Notificaciones:** Retroalimentación al usuario mediante toasts (`src/components/ui/toaster.tsx`, `src/hooks/use-toast.ts`).

## Cómo Empezar (Getting Started)

1.  **Prerrequisitos:**
    *   Node.js (versión especificada en `.nvmrc` o la última LTS)
    *   npm o yarn

2.  **Configuración de Firebase:**
    *   Crea un proyecto de Firebase en [https://console.firebase.google.com/](https://console.firebase.google.com/).
    *   Habilita la Autenticación con Google en la consola de Firebase (Authentication -> Sign-in method).
    *   Habilita la base de datos Firestore.
    *   Copia la configuración de tu proyecto Firebase (Configuración del proyecto -> General -> Tus apps -> App web) y pégala en `src/lib/firebase.ts`. Asegúrate de que las variables de entorno estén configuradas correctamente (ej. usando un archivo `.env.local`, consulta `src/lib/firebase.ts` para las variables requeridas).
    *   Despliega las reglas de Firestore (`firestore.rules`) y los índices (`firestore.indexes.json`) usando Firebase CLI o configúralos manualmente en la consola. El archivo `firebase.json` está configurado para desplegar estos.

3.  **Instalar Dependencias:**
    ```bash
    npm install
    # o
    yarn install
    ```

4.  **Ejecutar el Servidor de Desarrollo:**
    ```bash
    npm run dev
    # o
    yarn dev
    ```
    La aplicación estará disponible en `http://localhost:3000`.

## Scripts

*   `dev`: Inicia el servidor de desarrollo de Next.js.
*   `build`: Compila la aplicación para producción.
*   `start`: Inicia el servidor de producción.
*   `lint`: Ejecuta ESLint para verificar problemas de calidad de código.

## Desarrollo Futuro (Further Development)

*   Mejorar los informes financieros con más gráficos y análisis detallados.
*   Implementar un sistema de presupuestos y seguimiento de gastos.
*   Añadir funcionalidad de exportación de datos en múltiples formatos.
*   Expandir roles y permisos de usuario con niveles más granulares.
*   Implementar autenticación basada en correo electrónico junto con Google Sign-In.
*   Añadir integración con APIs de bancos para importación automática de transacciones.
*   Desarrollar un sistema de alertas y recordatorios para pagos pendientes.
*   Refinar las acciones de servidor (server actions) y la seguridad para las interacciones con Firebase (ej. usando Admin SDK para operaciones sensibles).

---

Este README proporciona una visión general completa. Siéntete libre de expandir secciones específicas a medida que el proyecto evolucione.
