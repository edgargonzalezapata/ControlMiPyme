"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  className?: string;
  iconClassName?: string;
}

export function ThemeToggle({ className, iconClassName }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Solo renderizamos completamente el botón cuando estamos en el cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Evitamos diferencias de hidratación mostrando un placeholder durante SSR
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8 rounded-md", className)}
        disabled
      >
        <div className="h-4 w-4 opacity-0" />
        <span className="sr-only">Cargando tema</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "h-8 w-8 rounded-md transition-colors duration-200",
        theme === "light" 
          ? "hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800" 
          : "hover:bg-indigo-800/30 text-indigo-300 hover:text-indigo-200",
        className
      )}
      title={theme === "light" ? "Activar modo oscuro" : "Activar modo claro"}
    >
      {theme === "light" ? (
        <Moon className={cn("h-4 w-4", iconClassName)} />
      ) : (
        <Sun className={cn("h-4 w-4", iconClassName)} />
      )}
      <span className="sr-only">Cambiar tema</span>
    </Button>
  );
} 