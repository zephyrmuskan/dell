import React from 'react';
import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`glass-card rounded-2xl p-6 transition-all duration-300 ${
        onClick ? 'cursor-pointer active:scale-[0.99] select-none' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default GlassCard;
