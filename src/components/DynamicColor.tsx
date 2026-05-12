import React, { useRef, useEffect } from 'react';

interface DynamicColorProps {
  color: string;
  children?: React.ReactNode;
  className?: string;
  isBackground?: boolean;
}

/**
 * Un composant utilitaire pour appliquer des couleurs dynamiques via une référence (ref)
 * afin d'éviter d'utiliser l'attribut 'style' dans le JSX principal.
 */
export const DynamicColor: React.FC<DynamicColorProps> = ({ 
  color, 
  children, 
  className, 
  isBackground = false 
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      if (isBackground) {
        ref.current.style.backgroundColor = color;
      } else {
        ref.current.style.color = color;
      }
    }
  }, [color, isBackground]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};
