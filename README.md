# Control MiPyme

Sistema de gestión financiera empresarial desarrollado con Next.js, Firebase y Tailwind CSS.

## Características Principales

- **Gestión de Empresas**: Crear y administrar múltiples empresas
- **Cuentas Bancarias**: Gestión de cuentas y saldos
- **Transacciones**: Importación y seguimiento de movimientos financieros
- **Facturación**: Sistema de facturación integrado
- **Reportes**: Análisis financiero y reportes detallados
- **Modo Oscuro**: Interfaz adaptable con tema claro y oscuro
- **Responsive Design**: Optimizado para dispositivos móviles y desktop

## Optimizaciones Móviles

### 🚀 Mejoras Implementadas

#### 1. **Layout Responsive**
- Breakpoints personalizados: `xs: 475px`, `sm: 640px`, `md: 768px`, etc.
- Sidebar colapsible en móvil con overlay
- Navegación adaptativa con menú hamburguesa

#### 2. **Componentes Optimizados**
- **Navbar**: Menú lateral deslizable en móvil
- **CompanySelector**: Ancho adaptativo y texto truncado
- **Dashboard**: Cards responsive con grid adaptativo
- **Sidebar**: Navegación touch-friendly con botones de tamaño adecuado

#### 3. **Estilos CSS Móviles**
```css
/* Touch targets mejorados */
.touch-target {
  @apply min-h-[44px] min-w-[44px] flex items-center justify-center;
}

/* Scroll suave en móvil */
.smooth-scroll {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

/* Optimizaciones táctiles */
.mobile-optimized {
  @apply touch-manipulation;
  -webkit-tap-highlight-color: transparent;
}
```

#### 4. **Clases Utility Responsive**
- `.btn-responsive`: Botones adaptativos
- `.input-responsive`: Inputs con altura variable
- `.card-responsive`: Cards con padding adaptativo
- `.responsive-grid`: Grid que se adapta al tamaño de pantalla
- `.text-responsive`: Tipografía escalable

#### 5. **Meta Tags PWA**
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<meta name="theme-color" content="#4F46E5" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
```

### 📱 Características Móviles

#### **Navegación Móvil**
- Sidebar deslizable desde la izquierda
- Overlay semi-transparente para cerrar
- Botón flotante para abrir menú
- Auto-cierre al seleccionar elemento

#### **Interfaz Adaptativa**
- Texto truncado en espacios reducidos
- Iconos y botones de tamaño táctil (44px mínimo)
- Espaciado responsive (padding/margin adaptativos)
- Grid de cards que se reorganiza automáticamente

#### **Optimizaciones de Performance**
- Hook `useIsMobile()` para detección eficiente de dispositivos
- Transiciones CSS optimizadas
- Lazy loading de componentes pesados
- Scroll nativo optimizado para iOS/Android

### 🛠️ Uso de Clases Responsive

```jsx
// Ejemplo de uso en componentes
<div className="p-2 sm:p-4 lg:p-6"> {/* Padding responsive */}
  <h1 className="text-lg sm:text-xl lg:text-2xl"> {/* Texto responsive */}
    <Button className="btn-responsive touch-target"> {/* Botón optimizado */}
      <span className="hidden xs:inline">Texto completo</span>
      <span className="xs:hidden">Corto</span> {/* Texto condicional */}
    </Button>
  </h1>
</div>
```

### 📋 Checklist de Optimización Móvil

- ✅ Viewport meta tag configurado
- ✅ Touch targets de 44px mínimo
- ✅ Navegación touch-friendly
- ✅ Texto legible en pantallas pequeñas
- ✅ Botones y enlaces fáciles de tocar
- ✅ Scroll suave y natural
- ✅ Transiciones optimizadas
- ✅ Grid responsive
- ✅ Imágenes adaptativas
- ✅ Formularios móvil-friendly

## Tecnologías Utilizadas

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Deployment**: Netlify
- **Icons**: Lucide React

## Instalación y Desarrollo

```bash
# Clonar el repositorio
git clone [repository-url]

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Ejecutar en desarrollo
npm run dev
```

## Estructura del Proyecto

```
src/
├── app/                 # App Router de Next.js
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes base (shadcn/ui)
│   └── layout/         # Componentes de layout
├── context/            # Context providers
├── hooks/              # Custom hooks
├── lib/                # Utilidades y configuraciones
└── types/              # Definiciones de TypeScript
```

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.
