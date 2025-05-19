"use client";

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Función auxiliar para comprobar si estamos en el cliente
const isClient = typeof window !== 'undefined';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Inicializar con un valor predeterminado que no cause problemas en SSR
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // Este efecto solo se ejecuta una vez en el cliente
  useEffect(() => {
    if (!isClient) return;
    
    setMounted(true);
    
    try {
      // Verificar si hay un tema guardado en localStorage
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      
      // Comprobar preferencia del sistema si no hay tema guardado
      if (!savedTheme) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
      } else {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.error('Error al inicializar el tema:', error);
    }
  }, []);

  // Este efecto aplica los cambios de tema en el cliente
  useEffect(() => {
    if (!mounted || !isClient) return;
    
    try {
      // Guardar el tema seleccionado en localStorage
      localStorage.setItem('theme', theme);
      
      // Aplicar la clase 'dark' al documento cuando sea necesario
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('Error al aplicar el tema:', error);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Proporcionamos el contexto incluso antes de montar, pero los efectos del DOM solo ocurren después del montaje
  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 