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

export const useThemeColors = () => {
  const { gradientStyle } = useGradient();
  const dark = gradientStyle === 'dark';
  return {
    text:       dark ? '#F4C07A'                    : '#0C0C0C',
    textFaded:  dark ? 'rgba(244,192,122,0.65)'     : 'rgba(12,12,12,0.6)',
    textLight:  dark ? 'rgba(244,192,122,0.35)'     : 'rgba(12,12,12,0.35)',
    card:       dark ? 'rgba(244,192,122,0.08)'     : 'rgba(12,12,12,0.1)',
    cardStrong: dark ? 'rgba(244,192,122,0.14)'     : 'rgba(12,12,12,0.15)',
    border:     dark ? 'rgba(244,192,122,0.15)'     : 'rgba(12,12,12,0.1)',
    accent:     '#F4C07A',
    isDark:     dark,
  };
};
