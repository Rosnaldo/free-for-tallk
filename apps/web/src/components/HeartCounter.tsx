import React from 'react';
import { Heart } from 'lucide-react';

export interface HeartCounterProps {
  count: number;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  label?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const HeartCounter: React.FC<HeartCounterProps> = ({
  count,
  onClick,
  size = 'sm',
  label,
  disabled = false,
  className = '',
  id,
}) => {
  const sizeConfig = {
    xs: {
      icon: 'w-2.5 h-2.5',
      text: 'text-[10px]',
      gap: 'gap-0.5',
      padding: 'px-1 py-0.5',
    },
    sm: {
      icon: 'w-3.5 h-3.5',
      text: 'text-xs',
      gap: 'gap-1',
      padding: 'px-1.5 py-0.5',
    },
    md: {
      icon: 'w-4 h-4',
      text: 'text-sm',
      gap: 'gap-1.5',
      padding: 'px-2 py-1',
    },
    lg: {
      icon: 'w-5 h-5',
      text: 'text-base',
      gap: 'gap-2',
      padding: 'px-2.5 py-1',
    },
  }[size];

  const content = (
    <>
      <Heart className={`${sizeConfig.icon} fill-amber-400 text-amber-400 shrink-0`} />
      <span className={`font-semibold text-amber-400 tabular-nums ${sizeConfig.text}`}>
        {count}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={onClick}
        title={label || `Dar coração (${count})`}
        aria-label={label || `Dar coração (${count})`}
        className={`group inline-flex items-center ${sizeConfig.gap} ${sizeConfig.padding} rounded-full border border-transparent hover:border-white/10 hover:bg-white/10 active:scale-95 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      id={id}
      className={`group inline-flex items-center ${sizeConfig.gap} ${sizeConfig.padding} ${className}`}
      title={label || `${count} corações`}
    >
      {content}
    </div>
  );
};
