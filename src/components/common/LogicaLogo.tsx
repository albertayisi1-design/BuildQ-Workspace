import React from 'react';

interface LogicaLogoProps {
  variant?: 'full' | 'stacked' | 'icon' | 'badge';
  theme?: 'dark' | 'light' | 'auto';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  subtitle?: string;
  className?: string;
}

export const LogicaLogo: React.FC<LogicaLogoProps> = ({
  variant = 'full',
  theme = 'light',
  size = 'md',
  subtitle,
  className = '',
}) => {
  // Sizing scales
  const iconSizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const titleSizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const softworksSizes = {
    xs: 'text-[7px] tracking-[0.22em]',
    sm: 'text-[9px] tracking-[0.24em]',
    md: 'text-[11px] tracking-[0.26em]',
    lg: 'text-[15px] tracking-[0.28em]',
    xl: 'text-[18px] tracking-[0.3em]',
  };

  const isDark = theme === 'dark';

  // Standalone vector icon mark (matching the green dialogue/ribbon frame)
  const renderIconMark = (customClass?: string) => (
    <svg
      viewBox="0 0 100 100"
      className={customClass || iconSizes[size]}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Logica Softworks Mark"
    >
      <path
        d="M 14 62 L 14 24 A 12 12 0 0 1 26 12 L 74 12 A 12 12 0 0 1 86 24 L 86 74 A 12 12 0 0 1 74 86 L 28 86 L 8 86 L 22 72"
        stroke="#00E575"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  // If icon-only is requested
  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {renderIconMark()}
      </div>
    );
  }

  // Authentic dark badge variant (1:1 with the original image on black background)
  if (variant === 'badge') {
    const badgePadding = {
      xs: 'px-2.5 py-1.5 rounded-lg gap-2',
      sm: 'px-3.5 py-2 rounded-xl gap-2.5',
      md: 'px-5 py-3 rounded-2xl gap-3.5',
      lg: 'px-6 py-4 rounded-2xl gap-4',
      xl: 'px-8 py-5 rounded-3xl gap-5',
    };

    return (
      <div
        className={`inline-flex flex-col items-center justify-center bg-black text-white ${badgePadding[size]} border border-slate-800 shadow-md ${className}`}
      >
        <div className={`flex items-center ${size === 'xs' || size === 'sm' ? 'gap-2.5' : 'gap-4'}`}>
          {renderIconMark(iconSizes[size])}
          <div className="flex flex-col select-none">
            <span
              className={`font-black text-[#2979FF] leading-none uppercase tracking-tight ${titleSizes[size]}`}
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              LOGICA
            </span>
            <span
              className={`font-bold text-white uppercase leading-tight mt-0.5 ${softworksSizes[size]}`}
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                WebkitTextStroke: '0.6px #2979FF',
              }}
            >
              SOFTWORKS
            </span>
          </div>
        </div>
        {subtitle && (
          <div className="mt-2 pt-1.5 border-t border-slate-800/80 w-full text-center">
            <p className="text-[10px] font-mono text-slate-400 font-medium">
              {subtitle}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Stacked variant (icon centered on top, wordmark below)
  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <div className="mb-2.5">{renderIconMark(iconSizes[size])}</div>
        <div className="flex flex-col items-center select-none">
          <span
            className={`font-black uppercase leading-none tracking-tight ${
              isDark ? 'text-[#2979FF]' : 'text-[#2563EB]'
            } ${titleSizes[size]}`}
          >
            LOGICA
          </span>
          <span
            className={`font-bold uppercase leading-tight mt-1 ${
              isDark
                ? 'text-white'
                : 'text-slate-800'
            } ${softworksSizes[size]}`}
            style={
              isDark
                ? { WebkitTextStroke: '0.6px #2979FF' }
                : undefined
            }
          >
            SOFTWORKS
          </span>
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 font-medium mt-1.5">
            {subtitle}
          </p>
        )}
      </div>
    );
  }

  // Default 'full' horizontal lockup (Icon left, text right)
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className="shrink-0">{renderIconMark(iconSizes[size])}</div>
      <div className="flex flex-col select-none min-w-0">
        <span
          className={`font-black uppercase leading-none tracking-tight text-[#2979FF] ${titleSizes[size]}`}
        >
          LOGICA
        </span>
        <span
          className={`font-bold uppercase leading-tight mt-0.5 truncate ${
            isDark
              ? 'text-white'
              : 'text-slate-900'
          } ${softworksSizes[size]}`}
          style={
            isDark
              ? { WebkitTextStroke: '0.6px #2979FF' }
              : undefined
          }
        >
          SOFTWORKS
        </span>
        {subtitle && (
          <span className="text-[10px] text-slate-400 font-mono tracking-tight mt-0.5">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
