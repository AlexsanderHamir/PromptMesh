import React from 'react';
import { UI } from '../../constants';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  rightAction?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ 
  title, 
  subtitle, 
  children, 
  className = "", 
  icon,
  rightAction 
}) => {
  const hasHeader = title || subtitle || rightAction;
  const cardClasses = `bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl shadow-xl ${className}`;
  
  return (
    <div className={cardClasses}>
      {hasHeader && (
        <div className={`px-${UI.SPACING.LARGE} py-${UI.SPACING.MEDIUM} border-b border-slate-700/50`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {icon && <div className="text-blue-400">{icon}</div>}
              <div>
                {title && (
                  <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
                )}
                {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
              </div>
            </div>
            {rightAction && <div>{rightAction}</div>}
          </div>
        </div>
      )}
      <div className={`p-${UI.SPACING.LARGE}`}>{children}</div>
    </div>
  );
};
