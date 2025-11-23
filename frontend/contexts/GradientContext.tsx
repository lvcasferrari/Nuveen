import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSettings } from '../utils/storage';

type GradientStyle = 'dawn' | 'amber' | 'warm' | 'dark';

interface GradientContextType {
  gradientStyle: GradientStyle;
  setGradientStyle: (style: GradientStyle) => void;
  loading: boolean;
}

const GradientContext = createContext<GradientContextType | undefined>(undefined);

export const GradientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gradientStyle, setGradientStyle] = useState<GradientStyle>('dawn');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGradientStyle();
  }, []);

  const loadGradientStyle = async () => {
    try {
      const settings = await getSettings();
      setGradientStyle(settings.gradientStyle || 'dawn');
    } catch (error) {
      console.error('Error loading gradient style:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientContext.Provider value={{ gradientStyle, setGradientStyle, loading }}>
      {children}
    </GradientContext.Provider>
  );
};

export const useGradient = (): GradientContextType => {
  const context = useContext(GradientContext);
  if (!context) {
    throw new Error('useGradient must be used within GradientProvider');
  }
  return context;
};
