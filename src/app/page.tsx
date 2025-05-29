"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthProvider';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  BarChart3, 
  Wallet, 
  Building, 
  Users, 
  TrendingUp,
  Shield,
  Clock,
  Zap,
  Star,
  ArrowRight,
  Play,
  X,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

export default function LandingPage() {
  const { user, loading, isFirebaseReady } = useAuthContext();
  const router = useRouter();
  
  // Estado para el modal del tour
  const [showTourModal, setShowTourModal] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(0);

  const tourSteps = [
    {
      title: "Bienvenido a Control MiPyme",
      description: "Descubre cómo nuestro sistema revoluciona la gestión financiera de tu empresa en 5 simples pasos.",
      image: "dashboard",
      icon: <Building className="h-8 w-8" />
    },
    {
      title: "1. Conecta tus cuentas bancarias",
      description: "Importa todas tus cuentas bancarias de forma segura. Soportamos los principales bancos de Chile y múltiples monedas.",
      image: "accounts",
      icon: <Wallet className="h-8 w-8" />
    },
    {
      title: "2. Importa tus transacciones",
      description: "Sube tus cartolas bancarias en Excel y automáticamente organizamos todos tus movimientos. Sin digitación manual.",
      image: "transactions",
      icon: <BarChart3 className="h-8 w-8" />
    },
    {
      title: "3. Captura y gestiona facturas",
      description: "Importa automáticamente tus facturas electrónicas desde los XML del SII. El sistema lee y procesa todos los datos tributarios oficiales.",
      image: "invoices",
      icon: <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    },
    {
      title: "4. Visualiza reportes inteligentes",
      description: "Obtén insights automáticos sobre tu flujo de caja, tendencias de gastos y oportunidades de ahorro.",
      image: "reports",
      icon: <TrendingUp className="h-8 w-8" />
    },
    {
      title: "5. Toma decisiones informadas",
      description: "Con toda tu información financiera organizada, toma decisiones estratégicas basadas en datos reales.",
      image: "insights",
      icon: <Shield className="h-8 w-8" />
    }
  ];

  const handleOpenTour = () => {
    setShowTourModal(true);
    setCurrentTourStep(0);
  };

  const handleCloseTour = () => {
    setShowTourModal(false);
    setCurrentTourStep(0);
  };

  const handleNextStep = () => {
    if (currentTourStep < tourSteps.length - 1) {
      setCurrentTourStep(currentTourStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentTourStep > 0) {
      setCurrentTourStep(currentTourStep - 1);
    }
  };

  useEffect(() => {
    if (isFirebaseReady && !loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router, isFirebaseReady]);

  if (loading || !isFirebaseReady) {
    return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4 text-center">
        <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center max-w-md mx-auto border border-indigo-100 animate-scale-in">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-6 text-xl font-medium text-gray-800 animate-fade-in-up">Cargando...</p>
      </div>
    </div>
  );
  }

  if (user) {
    router.push('/dashboard');
    return null;
  }

    return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50 animate-slide-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3 animate-fade-in-left">
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-xl p-2 shadow-lg hover-glow animate-pulse-glow">
                <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4L4 8L12 12L20 8L12 4Z" fill="currentColor" />
                    <path d="M4 12L12 16L20 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 16L12 20L20 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              <span className="text-2xl font-bold text-gray-900">Control MiPyme</span>
            </div>
            <div className="flex items-center space-x-4 animate-fade-in-right">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/ingresa')}
                className="text-gray-600 hover:text-indigo-600 transition-all duration-300 hover:scale-105"
              >
                Iniciar Sesión
              </Button>
              <Button 
                onClick={() => router.push('/ingresa')}
                className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 animate-bounce-gentle"
              >
                Empieza Gratis
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-indigo-400 to-blue-400 rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full filter blur-3xl animate-float-delayed"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight animate-fade-in-up">
                  Controla tus finanzas como un 
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 animate-gradient"> experto</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed animate-fade-in-up delay-200">
                  Plataforma todo en uno para la gestión de tus ingresos, gastos y decisiones empresariales. 
                  <span className="font-semibold text-gray-800">Sin complicaciones.</span>
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-300">
                <Button 
                  size="lg"
                  onClick={() => router.push('/ingresa')}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] hover-glow"
                >
                  Empieza gratis ahora
                  <ArrowRight className="ml-2 h-5 w-5 animate-bounce-gentle" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={handleOpenTour}
                  className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 hover:scale-105"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Descubre cómo funciona
                </Button>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-600 animate-fade-in-up delay-400">
                <div className="flex items-center space-x-2 hover:scale-105 transition-transform">
                  <CheckCircle className="h-5 w-5 text-green-500 animate-bounce-gentle" />
                  <span>Sin tarjeta de crédito</span>
                </div>
                <div className="flex items-center space-x-2 hover:scale-105 transition-transform">
                  <CheckCircle className="h-5 w-5 text-green-500 animate-bounce-gentle delay-100" />
                  <span>Configuración en 2 minutos</span>
                </div>
              </div>
            </div>
            
            <div className="relative animate-fade-in-right delay-200">
              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-4 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500 hover-lift animate-float">
                <div className="bg-white rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Panel de Control</h3>
                    <div className="flex space-x-1">
                      <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse delay-100"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse delay-200"></div>
                    </div>
                  </div>
                  <div className="space-y-3 stagger-animation">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-300 hover:scale-105">
                      <span className="text-sm font-medium text-gray-700">Ingresos del mes</span>
                      <span className="text-lg font-bold text-green-600">$45,230</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-300 hover:scale-105">
                      <span className="text-sm font-medium text-gray-700">Gastos del mes</span>
                      <span className="text-lg font-bold text-blue-600">$32,180</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors duration-300 hover:scale-105">
                      <span className="text-sm font-medium text-gray-700">Ganancia neta</span>
                      <span className="text-lg font-bold text-indigo-600">$13,050</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir Control MiPyme?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Diseñado específicamente para emprendedores y pequeñas empresas que buscan profesionalizar su gestión financiera
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-animation">
            <div className="group p-8 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover-lift">
              <div className="bg-indigo-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-200 transition-colors group-hover:scale-110 duration-300">
                <Clock className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Ahorra tiempo</h3>
              <p className="text-gray-600">Automatiza tareas repetitivas y enfócate en hacer crecer tu negocio en lugar de perder tiempo en papeleo.</p>
            </div>

            <div className="group p-8 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover-lift">
              <div className="bg-green-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-200 transition-colors group-hover:scale-110 duration-300">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Evita errores</h3>
              <p className="text-gray-600">Validaciones automáticas y controles inteligentes que previenen errores costosos en tu contabilidad.</p>
            </div>

            <div className="group p-8 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover-lift">
              <div className="bg-blue-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors group-hover:scale-110 duration-300">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Enfócate en crecer</h3>
              <p className="text-gray-600">Con las finanzas bajo control, dedica tu energía a estrategias de crecimiento y nuevas oportunidades.</p>
            </div>

            <div className="group p-8 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover-lift">
              <div className="bg-purple-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-200 transition-colors group-hover:scale-110 duration-300">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Decisiones informadas</h3>
              <p className="text-gray-600">Reportes claros y análisis detallados para tomar decisiones basadas en datos reales.</p>
            </div>

            <div className="group p-8 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover-lift">
              <div className="bg-orange-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-200 transition-colors group-hover:scale-110 duration-300">
                <Building className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Múltiples negocios</h3>
              <p className="text-gray-600">Gestiona varios negocios desde una única plataforma centralizada y organizada.</p>
            </div>

            <div className="group p-8 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover-lift">
              <div className="bg-teal-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-teal-200 transition-colors group-hover:scale-110 duration-300">
                <Zap className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Fácil de usar</h3>
              <p className="text-gray-600">Interfaz intuitiva diseñada para personas sin conocimientos contables avanzados.</p>
            </div>
          </div>
        </div>
      </section>

      {/* System Screenshots Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Mira el sistema en acción
            </h2>
            <p className="text-xl text-gray-600">
              Capturas reales de nuestro dashboard y herramientas
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-center mb-16">
            <div className="space-y-6 animate-fade-in-left">
              <h3 className="text-3xl font-bold text-gray-900">Dashboard Empresarial</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                Obtén una vista completa de la salud financiera de tu negocio. Visualiza ingresos, gastos y tendencias en tiempo real.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-800 font-medium">Resumen financiero en tiempo real</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-800 font-medium">Gráficos interactivos de tendencias</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-800 font-medium">Métricas clave de rendimiento</span>
                </li>
              </ul>
            </div>
            <div className="animate-fade-in-right">
              <div className="bg-white rounded-xl shadow-xl p-6 hover-lift border border-gray-200">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Dashboard Empresarial</h4>
                    <span className="text-sm text-gray-600 font-medium">Enero 2025</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                      <p className="text-sm text-green-700 font-semibold">Ingresos</p>
                      <p className="text-2xl font-bold text-green-800">$85,420</p>
                      <p className="text-xs text-green-700 font-medium">↗ +12%</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center">
                      <p className="text-sm text-red-700 font-semibold">Gastos</p>
                      <p className="text-2xl font-bold text-red-800">$62,180</p>
                      <p className="text-xs text-red-700 font-medium">↘ -5%</p>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg text-center">
                      <p className="text-sm text-indigo-700 font-semibold">Ganancia</p>
                      <p className="text-2xl font-bold text-indigo-800">$23,240</p>
                      <p className="text-xs text-green-700 font-medium">↗ +15%</p>
                    </div>
                  </div>
                  <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-800">Flujo de caja mensual</span>
                      <span className="text-sm text-gray-600 font-medium">Últimos 6 meses</span>
                    </div>
                    <div className="h-32 bg-white rounded border border-gray-300 p-3 relative overflow-hidden">
                      <div className="flex items-end justify-between h-full space-x-2">
                        <div className="flex flex-col items-center space-y-1">
                          <div className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t" style={{width: '20px', height: '45%'}}></div>
                          <span className="text-xs text-gray-600 font-medium">Ago</span>
                        </div>
                        <div className="flex flex-col items-center space-y-1">
                          <div className="bg-gradient-to-t from-green-500 to-green-400 rounded-t" style={{width: '20px', height: '60%'}}></div>
                          <span className="text-xs text-gray-600 font-medium">Sep</span>
                        </div>
                        <div className="flex flex-col items-center space-y-1">
                          <div className="bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t" style={{width: '20px', height: '75%'}}></div>
                          <span className="text-xs text-gray-600 font-medium">Oct</span>
                        </div>
                        <div className="flex flex-col items-center space-y-1">
                          <div className="bg-gradient-to-t from-purple-500 to-purple-400 rounded-t" style={{width: '20px', height: '55%'}}></div>
                          <span className="text-xs text-gray-600 font-medium">Nov</span>
                        </div>
                        <div className="flex flex-col items-center space-y-1">
                          <div className="bg-gradient-to-t from-teal-500 to-teal-400 rounded-t" style={{width: '20px', height: '85%'}}></div>
                          <span className="text-xs text-gray-600 font-medium">Dic</span>
                        </div>
                        <div className="flex flex-col items-center space-y-1">
                          <div className="bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t shadow-lg" style={{width: '20px', height: '90%'}}></div>
                          <span className="text-xs text-gray-600 font-medium">Ene</span>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                          ↗ Tendencia positiva
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
            
          <div className="grid lg:grid-cols-2 gap-8 items-center mb-16">
            <div className="order-2 lg:order-1 animate-fade-in-left">
              <div className="bg-white rounded-xl shadow-xl p-6 hover-lift border border-gray-200">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Gestión de Transacciones</h4>
                    <div className="flex space-x-2">
                      <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs font-medium">Filtros</span>
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-800 border border-indigo-200 rounded text-xs font-medium">145 registros</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 border-l-4 border-green-500 bg-green-50 rounded-r border border-green-200">
                      <div>
                        <p className="font-semibold text-gray-900">Transferencia recibida</p>
                        <p className="text-sm text-gray-700">Banco Estado • 15 Ene 2025</p>
                      </div>
                      <span className="text-lg font-bold text-green-700">+$25,000</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border-l-4 border-red-500 bg-red-50 rounded-r border border-red-200">
                      <div>
                        <p className="font-semibold text-gray-900">Pago proveedores</p>
                        <p className="text-sm text-gray-700">Banco Chile • 14 Ene 2025</p>
                      </div>
                      <span className="text-lg font-bold text-red-700">-$8,500</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border-l-4 border-blue-500 bg-blue-50 rounded-r border border-blue-200">
                  <div>
                        <p className="font-semibold text-gray-900">Servicios básicos</p>
                        <p className="text-sm text-gray-700">Santander • 13 Ene 2025</p>
                      </div>
                      <span className="text-lg font-bold text-blue-700">-$1,200</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-600 font-medium">Mostrando 3 de 145 transacciones</span>
                    <button className="text-sm text-indigo-700 hover:text-indigo-900 font-semibold">Ver todas →</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-6 animate-fade-in-right">
              <h3 className="text-3xl font-bold text-gray-900">Gestión de Transacciones</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                Importa y organiza todas tus transacciones bancarias. Categoriza, filtra y busca movimientos de forma intuitiva.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-800 font-medium">Importación automática desde Excel</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-800 font-medium">Filtros avanzados por fecha y tipo</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-800 font-medium">Búsqueda instantánea de movimientos</span>
                </li>
              </ul>
                </div>
              </div>
              
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6 animate-fade-in-left">
              <h3 className="text-3xl font-bold text-gray-900">Cuentas Bancarias</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                Conecta y administra múltiples cuentas bancarias. Mantén el control de saldos y movimientos de todas tus cuentas.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-800 font-medium">Múltiples bancos y monedas</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-800 font-medium">Saldos actualizados en tiempo real</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-800 font-medium">Historial completo de movimientos</span>
                </li>
              </ul>
            </div>
            <div className="animate-fade-in-right">
              <div className="bg-white rounded-xl shadow-xl p-6 hover-lift border border-gray-200">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Mis Cuentas Bancarias</h4>
                    <button className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded font-medium">+ Nueva</button>
                  </div>
                  <div className="space-y-4">
                    <div className="border border-gray-300 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-6 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">VISA</div>
                          <div>
                            <p className="font-semibold text-gray-900">Cuenta Corriente</p>
                            <p className="text-sm text-gray-700 font-medium">Banco Estado • ****4567</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">$2,450,000</p>
                          <p className="text-sm text-gray-700 font-medium">CLP</p>
                        </div>
                      </div>
                    </div>
                    <div className="border border-gray-300 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-6 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">MC</div>
                  <div>
                            <p className="font-semibold text-gray-900">Cuenta Ahorro</p>
                            <p className="text-sm text-gray-700 font-medium">Banco Chile • ****8901</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">$850,000</p>
                          <p className="text-sm text-gray-700 font-medium">CLP</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-700 font-medium">Total en todas las cuentas</p>
                    <p className="text-xl font-bold text-gray-900">$3,300,000 CLP</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-gradient-to-r from-indigo-300 to-blue-300 rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full filter blur-3xl animate-float-delayed"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Lo que dicen nuestros usuarios
            </h2>
            <p className="text-xl text-gray-600">
              Más de 1,000 emprendedores confían en Control MiPyme
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 stagger-animation">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover-lift transition-all duration-300 hover:shadow-2xl">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current animate-bounce-gentle" style={{animationDelay: `${i * 0.1}s`}} />
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                "Antes perdía horas organizando facturas y gastos. Ahora todo está automatizado y puedo ver el estado real de mi negocio en tiempo real."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold animate-pulse-glow">
                  MC
                </div>
                <div className="ml-4">
                  <p className="font-semibold text-gray-900">María Contreras</p>
                  <p className="text-sm text-gray-600">Dueña de Boutique Fashion</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover-lift transition-all duration-300 hover:shadow-2xl">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current animate-bounce-gentle" style={{animationDelay: `${i * 0.1}s`}} />
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                "La facilidad para manejar múltiples negocios desde una sola plataforma es increíble. Mis tres restaurantes nunca habían estado tan organizados."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold animate-pulse-glow">
                  JR
                </div>
                <div className="ml-4">
                  <p className="font-semibold text-gray-900">José Rodríguez</p>
                  <p className="text-sm text-gray-600">Propietario de Restaurantes</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover-lift transition-all duration-300 hover:shadow-2xl">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current animate-bounce-gentle" style={{animationDelay: `${i * 0.1}s`}} />
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                "Los reportes me ayudaron a identificar gastos innecesarios y optimizar mi flujo de caja. En 3 meses aumenté mi rentabilidad un 25%."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold animate-pulse-glow">
                  AS
                </div>
                <div className="ml-4">
                  <p className="font-semibold text-gray-900">Ana Sánchez</p>
                  <p className="text-sm text-gray-600">Consultora Independiente</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Funcionalidades que marcan la diferencia
            </h2>
            <p className="text-xl text-gray-600">
              Todo lo que necesitas para profesionalizar tu gestión financiera
            </p>
              </div>
              
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-fade-in-left">
                <div className="flex items-start space-x-4 hover:scale-105 transition-transform duration-300">
                <div className="bg-indigo-100 p-3 rounded-xl hover:bg-indigo-200 transition-colors duration-300 hover:scale-110">
                  <Wallet className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Control financiero completo</h3>
                  <p className="text-gray-600">Gestiona ingresos, gastos y flujos de caja con interfaces intuitivas y reportes automáticos.</p>
                </div>
              </div>
              
                <div className="flex items-start space-x-4 hover:scale-105 transition-transform duration-300">
                <div className="bg-blue-100 p-3 rounded-xl hover:bg-blue-200 transition-colors duration-300 hover:scale-110">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Análisis inteligente</h3>
                  <p className="text-gray-600">Dashboards personalizados con métricas clave para entender el rendimiento de tu negocio.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 hover:scale-105 transition-transform duration-300">
                <div className="bg-green-100 p-3 rounded-xl hover:bg-green-200 transition-colors duration-300 hover:scale-110">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Colaboración en equipo</h3>
                  <p className="text-gray-600">Invita a tu contador o equipo para trabajar juntos con permisos personalizados.</p>
                </div>
              </div>
            </div>

            <div className="relative animate-fade-in-right">
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-8 hover-lift">
                <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-shadow duration-500">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-4">
                      <h4 className="text-lg font-semibold text-gray-900">Reportes y Análisis</h4>
                      <div className="flex space-x-2">
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">Mes actual</span>
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">Exportar</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-green-700">ROI Mensual</span>
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                        <p className="text-2xl font-bold text-green-700">24.5%</p>
                        <p className="text-xs text-green-600">↗ +3.2% vs anterior</p>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-700">Flujo Efectivo</span>
                          <BarChart3 className="h-4 w-4 text-blue-600" />
                        </div>
                        <p className="text-2xl font-bold text-blue-700">$15,420</p>
                        <p className="text-xs text-blue-600">Promedio semanal</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-gray-700">Tendencia de Gastos</span>
                        <span className="text-sm text-gray-500">Últimos 3 meses</span>
                      </div>
                      <div className="h-24 bg-white rounded border border-gray-200 p-2 relative overflow-hidden">
                        <div className="flex items-end justify-around h-full">
                          <div className="flex flex-col items-center space-y-1">
                            <div className="bg-gradient-to-t from-red-500 to-red-400 rounded-t shadow-sm" style={{width: '16px', height: '80%'}}></div>
                            <span className="text-xs text-gray-600">Oct</span>
                          </div>
                          <div className="flex flex-col items-center space-y-1">
                            <div className="bg-gradient-to-t from-orange-500 to-orange-400 rounded-t shadow-sm" style={{width: '16px', height: '65%'}}></div>
                            <span className="text-xs text-gray-600">Nov</span>
                          </div>
                          <div className="flex flex-col items-center space-y-1">
                            <div className="bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t shadow-sm" style={{width: '16px', height: '50%'}}></div>
                            <span className="text-xs text-gray-600">Dic</span>
                          </div>
                          <div className="flex flex-col items-center space-y-1">
                            <div className="bg-gradient-to-t from-green-500 to-green-400 rounded-t shadow-sm" style={{width: '16px', height: '35%'}}></div>
                            <span className="text-xs text-gray-600">Ene</span>
                          </div>
                        </div>
                        <div className="absolute top-1 right-2">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            -35%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Eficiencia</p>
                        <p className="text-lg font-bold text-indigo-600">87%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Crecimiento</p>
                        <p className="text-lg font-bold text-green-600">+15%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Ahorro</p>
                        <p className="text-lg font-bold text-purple-600">$8,240</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-blue-700 relative overflow-hidden animate-gradient">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-300 rounded-full filter blur-3xl animate-float-delayed"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl font-bold text-white mb-6 animate-fade-in-up">
            ¿Listo para transformar tu negocio?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 animate-fade-in-up delay-200">
            Únete a miles de emprendedores que ya están tomando el control de sus finanzas
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
            <Button 
              size="lg"
              onClick={() => router.push('/ingresa')}
              className="bg-white text-indigo-600 hover:bg-gray-50 px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] hover-glow"
            >
              Comienza hoy
              <ArrowRight className="ml-2 h-5 w-5 animate-bounce-gentle" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-indigo-600 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 hover:scale-105"
            >
              Ver demo gratuita
            </Button>
          </div>

          <p className="text-indigo-200 text-sm mt-6 animate-fade-in-up delay-400">
            Sin compromisos • Cancela cuando quieras • Soporte 24/7
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 stagger-animation">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 hover:scale-105 transition-transform duration-300">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-xl p-2 animate-pulse-glow">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4L4 8L12 12L20 8L12 4Z" fill="currentColor" />
                    <path d="M4 12L12 16L20 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 16L12 20L20 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-xl font-bold">Control MiPyme</span>
              </div>
              <p className="text-gray-400">
                La plataforma de gestión financiera diseñada para emprendedores y pequeñas empresas.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Producto</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform duration-200">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform duration-200">Precios</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform duration-200">Integraciones</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform duration-200">API</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Soporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform duration-200">Centro de ayuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform duration-200">Contacto</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform duration-200">Agenda una llamada</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform duration-200">Estado del servicio</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform duration-200">Acerca de</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform duration-200">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform duration-200">Términos</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform duration-200">Privacidad</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 animate-fade-in-up">© 2025 Control MiPyme. Todos los derechos reservados.</p>
            <div className="flex space-x-6 mt-4 md:mt-0 animate-fade-in-up delay-200">
              <a href="#" className="text-gray-400 hover:text-white transition-colors hover:scale-110 transform duration-200">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors hover:scale-110 transform duration-200">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors hover:scale-110 transform duration-200">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Tour Modal */}
      {showTourModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] animate-scale-in flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-xl p-2">
                  {tourSteps[currentTourStep].icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{tourSteps[currentTourStep].title}</h2>
                  <p className="text-sm text-gray-600">Paso {currentTourStep + 1} de {tourSteps.length}</p>
                </div>
              </div>
              <button 
                onClick={handleCloseTour}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="grid lg:grid-cols-2 gap-8 items-start h-full">
                <div className="space-y-6">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {tourSteps[currentTourStep].description}
                  </p>
                  
                  {currentTourStep === 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-indigo-600" />
                        <span className="text-indigo-800 font-medium">Setup en menos de 5 minutos</span>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-green-800 font-medium">Sin conocimientos técnicos</span>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                        <span className="text-blue-800 font-medium">Resultados inmediatos</span>
                      </div>
                    </div>
                  )}

                  {currentTourStep === 1 && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">1</div>
                        <span className="text-gray-700 font-medium">Selecciona tu banco</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">2</div>
                        <span className="text-gray-700 font-medium">Ingresa datos básicos de la cuenta</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">3</div>
                        <span className="text-gray-700 font-medium">¡Listo! Tu cuenta está conectada</span>
                      </div>
                    </div>
                  )}

                  {currentTourStep === 2 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-3">Formatos soportados:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white p-2 rounded text-center">
                          <span className="text-green-600 font-medium">Excel (.xlsx)</span>
                        </div>
                        <div className="bg-white p-2 rounded text-center">
                          <span className="text-green-600 font-medium">CSV</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentTourStep === 3 && (
                    <div className="w-full space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 text-center">Importación XML SII</h3>
                      <div className="bg-white rounded-xl border-2 border-dashed border-blue-300 p-6 shadow-sm">
                        <div className="text-center space-y-4">
                          {/* Simulación de XML SII */}
                          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 w-16 h-16 rounded-xl flex items-center justify-center mx-auto animate-pulse-glow shadow-lg">
                            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                          </div>
                          <p className="text-blue-700 font-semibold">Procesando XML SII</p>
                          <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-left">
                            <p className="text-xs text-gray-800 font-mono font-medium">&lt;DTE version="1.0"&gt;</p>
                            <p className="text-xs text-gray-800 font-mono font-medium ml-2">&lt;Documento&gt;</p>
                            <p className="text-xs text-gray-800 font-mono font-medium ml-4">&lt;Folio&gt;12345&lt;/Folio&gt;</p>
                            <p className="text-xs text-gray-800 font-mono font-medium ml-4">&lt;MntTotal&gt;45000&lt;/MntTotal&gt;</p>
                            <p className="text-xs text-gray-800 font-mono font-medium ml-2">&lt;/Documento&gt;</p>
                            <p className="text-xs text-gray-800 font-mono font-medium">&lt;/DTE&gt;</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Resultado de extracción */}
                      <div className="bg-white rounded-lg border border-gray-300 p-4 space-y-3 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-gray-800">Datos extraídos del XML:</span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 border border-green-300 rounded text-xs font-semibold">✓ Validado SII</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-700 font-medium">Folio:</span>
                            <span className="font-semibold text-gray-900">12345</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700 font-medium">Fecha:</span>
                            <span className="font-semibold text-gray-900">15/01/2025</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700 font-medium">Monto:</span>
                            <span className="font-semibold text-red-700">$45,000</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700 font-medium">RUT Emisor:</span>
                            <span className="font-semibold text-gray-900">12.345.678-9</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700 font-medium">Estado SII:</span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 border border-green-300 rounded text-xs font-semibold">Aceptado</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentTourStep === 4 && (
                    <div className="w-full space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 text-center">Dashboard de Reportes</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-lg border border-gray-300 text-center shadow-sm">
                          <p className="text-sm text-green-700 font-semibold">Ingresos</p>
                          <p className="text-lg font-bold text-green-800">$85,420</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-gray-300 text-center shadow-sm">
                          <p className="text-sm text-red-700 font-semibold">Gastos</p>
                          <p className="text-lg font-bold text-red-800">$62,180</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg border border-gray-300 p-3 shadow-sm">
                        <div className="flex items-end justify-between h-20 space-x-2">
                          <div className="bg-gradient-to-t from-indigo-600 to-indigo-500 rounded-t shadow-sm" style={{width: '12px', height: '60%'}}></div>
                          <div className="bg-gradient-to-t from-blue-600 to-blue-500 rounded-t shadow-sm" style={{width: '12px', height: '80%'}}></div>
                          <div className="bg-gradient-to-t from-green-600 to-green-500 rounded-t shadow-sm" style={{width: '12px', height: '70%'}}></div>
                          <div className="bg-gradient-to-t from-purple-600 to-purple-500 rounded-t shadow-sm" style={{width: '12px', height: '90%'}}></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentTourStep === 5 && (
                    <div className="text-center space-y-6">
                      <div className="bg-gradient-to-br from-green-500 to-emerald-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                        <CheckCircle className="h-10 w-10 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">¡Todo listo!</h3>
                        <p className="text-gray-700 mt-2 font-medium">Comienza a tomar el control de tus finanzas</p>
                      </div>
                      <div className="flex justify-center space-x-4">
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Visual Demo */}
                <div className="bg-gray-50 rounded-xl p-6 min-h-[400px] flex items-center justify-center">
                  {currentTourStep === 0 && (
                    <div className="text-center space-y-4">
                      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto animate-pulse-glow">
                        <Building className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">Control MiPyme</h3>
                      <p className="text-gray-600">Tu plataforma financiera integral</p>
                    </div>
                  )}

                  {currentTourStep === 1 && (
                    <div className="w-full max-w-sm space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 text-center mb-6">Agregar Cuenta Bancaria</h3>
                      <div className="space-y-3">
                        <div className="bg-white border-2 border-indigo-300 rounded-lg p-4 animate-pulse-glow shadow-md">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-8 bg-gradient-to-r from-blue-700 to-blue-800 rounded text-white text-xs flex items-center justify-center font-bold shadow-sm">VISA</div>
                            <span className="font-semibold text-gray-900">Banco Estado</span>
                          </div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 opacity-60 hover:opacity-80 transition-opacity">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-8 bg-gradient-to-r from-red-600 to-red-700 rounded text-white text-xs flex items-center justify-center font-bold shadow-sm">MC</div>
                            <span className="font-semibold text-gray-800">Banco Chile</span>
                          </div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 opacity-60 hover:opacity-80 transition-opacity">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-8 bg-gradient-to-r from-red-700 to-red-800 rounded text-white text-xs flex items-center justify-center font-bold shadow-sm">ST</div>
                            <span className="font-semibold text-gray-800">Santander</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentTourStep === 2 && (
                    <div className="w-full max-w-sm">
                      <div className="bg-white rounded-lg border-2 border-dashed border-indigo-300 p-8 text-center hover:border-indigo-500 transition-colors shadow-sm">
                        <div className="bg-indigo-100 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
                          <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-800 font-semibold">Arrastra tu cartola bancaria aquí</p>
                        <p className="text-sm text-gray-700 mt-2 font-medium">o haz clic para seleccionar</p>
                      </div>
                    </div>
                  )}

                  {currentTourStep === 3 && (
                    <div className="w-full space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 text-center">Importación XML SII</h3>
                      <div className="bg-white rounded-xl border-2 border-dashed border-blue-300 p-6 shadow-sm">
                        <div className="text-center space-y-4">
                          {/* Simulación de XML SII */}
                          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 w-16 h-16 rounded-xl flex items-center justify-center mx-auto animate-pulse-glow shadow-lg">
                            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                          </div>
                          <p className="text-blue-700 font-semibold">Procesando XML SII</p>
                          <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-left">
                            <p className="text-xs text-gray-800 font-mono font-medium">&lt;DTE version="1.0"&gt;</p>
                            <p className="text-xs text-gray-800 font-mono font-medium ml-2">&lt;Documento&gt;</p>
                            <p className="text-xs text-gray-800 font-mono font-medium ml-4">&lt;Folio&gt;12345&lt;/Folio&gt;</p>
                            <p className="text-xs text-gray-800 font-mono font-medium ml-4">&lt;MntTotal&gt;45000&lt;/MntTotal&gt;</p>
                            <p className="text-xs text-gray-800 font-mono font-medium ml-2">&lt;/Documento&gt;</p>
                            <p className="text-xs text-gray-800 font-mono font-medium">&lt;/DTE&gt;</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Resultado de extracción */}
                      <div className="bg-white rounded-lg border border-gray-300 p-4 space-y-3 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-gray-800">Datos extraídos del XML:</span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 border border-green-300 rounded text-xs font-semibold">✓ Validado SII</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-700 font-medium">Folio:</span>
                            <span className="font-semibold text-gray-900">12345</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700 font-medium">Fecha:</span>
                            <span className="font-semibold text-gray-900">15/01/2025</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700 font-medium">Monto:</span>
                            <span className="font-semibold text-red-700">$45,000</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700 font-medium">RUT Emisor:</span>
                            <span className="font-semibold text-gray-900">12.345.678-9</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700 font-medium">Estado SII:</span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 border border-green-300 rounded text-xs font-semibold">Aceptado</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentTourStep === 4 && (
                    <div className="w-full space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 text-center">Dashboard de Reportes</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-lg border border-gray-300 text-center shadow-sm">
                          <p className="text-sm text-green-700 font-semibold">Ingresos</p>
                          <p className="text-lg font-bold text-green-800">$85,420</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-gray-300 text-center shadow-sm">
                          <p className="text-sm text-red-700 font-semibold">Gastos</p>
                          <p className="text-lg font-bold text-red-800">$62,180</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg border border-gray-300 p-3 shadow-sm">
                        <div className="flex items-end justify-between h-20 space-x-2">
                          <div className="bg-gradient-to-t from-indigo-600 to-indigo-500 rounded-t shadow-sm" style={{width: '12px', height: '60%'}}></div>
                          <div className="bg-gradient-to-t from-blue-600 to-blue-500 rounded-t shadow-sm" style={{width: '12px', height: '80%'}}></div>
                          <div className="bg-gradient-to-t from-green-600 to-green-500 rounded-t shadow-sm" style={{width: '12px', height: '70%'}}></div>
                          <div className="bg-gradient-to-t from-purple-600 to-purple-500 rounded-t shadow-sm" style={{width: '12px', height: '90%'}}></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentTourStep === 5 && (
                    <div className="text-center space-y-6">
                      <div className="bg-gradient-to-br from-green-500 to-emerald-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                        <CheckCircle className="h-10 w-10 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">¡Todo listo!</h3>
                        <p className="text-gray-700 mt-2 font-medium">Comienza a tomar el control de tus finanzas</p>
                      </div>
                      <div className="flex justify-center space-x-4">
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer - Siempre visible */}
            <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex space-x-2">
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentTourStep ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={currentTourStep === 0}
                  className="disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                
                {currentTourStep < tourSteps.length - 1 ? (
                  <Button 
                    onClick={handleNextStep} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleCloseTour}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
                  >
                    Finalizar tour
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}