'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Period = {
  month: number;
  year: number;
};

interface ActivePeriodContextType {
  activePeriod: Period;
  setActivePeriod: (period: Period) => void;
  isLoading: boolean;
}

const ActivePeriodContext = createContext<ActivePeriodContextType | undefined>(undefined);

export function useActivePeriod() {
  const context = useContext(ActivePeriodContext);
  if (context === undefined) {
    throw new Error('useActivePeriod must be used within an ActivePeriodProvider');
  }
  return context;
}

const STORAGE_KEY = 'activePeriod';

export function ActivePeriodProvider({ children }: { children: React.ReactNode }) {
  const [activePeriod, setActivePeriodState] = useState<Period>(() => {
    // Valor por defecto: mes y año actuales
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });
  const [isLoading, setIsLoading] = useState(true);

  // Cargar el periodo activo desde localStorage al iniciar
  useEffect(() => {
    const storedPeriod = localStorage.getItem(STORAGE_KEY);
    if (storedPeriod) {
      try {
        const parsedPeriod = JSON.parse(storedPeriod);
        if (parsedPeriod && typeof parsedPeriod.month === 'number' && typeof parsedPeriod.year === 'number') {
          setActivePeriodState(parsedPeriod);
        }
      } catch (error) {
        console.error('Error parsing stored period:', error);
      }
    }
    setIsLoading(false);
  }, []);

  // Guardar el periodo activo en localStorage cuando cambie
  const setActivePeriod = (period: Period) => {
    setActivePeriodState(period);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(period));
  };

  return (
    <ActivePeriodContext.Provider value={{ activePeriod, setActivePeriod, isLoading }}>
      {children}
    </ActivePeriodContext.Provider>
  );
}
