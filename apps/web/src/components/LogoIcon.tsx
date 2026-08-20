import React from 'react';

interface LogoIconProps {
  className?: string;
  size?: number;
}

export const LogoIcon: React.FC<LogoIconProps> = ({ className = 'w-6 h-6', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="16" cy="16" r="14" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="30 20" strokeLinecap="round" />
      <path
        d="M16 8C11.5817 8 8 11.5817 8 16C8 18.5 9.5 20.8 11.8 22"
        stroke="#fbbf24"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="4.5" fill="#fbbf24" />
    </svg>
  );
};
