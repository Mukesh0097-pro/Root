import React from 'react';

interface LogoProps {
  className?: string;
  barWidth?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-6", barWidth = "w-1.5" }) => {
  return (
    <div className={`flex items-end gap-[3px] ${className}`}>
      <div className={`${barWidth} bg-root-accent h-[35%] rounded-full shadow-[0_0_8px_rgba(204,255,0,0.3)]`}></div>
      <div className={`${barWidth} bg-root-accent h-full rounded-full shadow-[0_0_8px_rgba(204,255,0,0.3)]`}></div>
      <div className={`${barWidth} bg-root-accent h-[60%] rounded-full shadow-[0_0_8px_rgba(204,255,0,0.3)]`}></div>
      <div className={`${barWidth} bg-root-accent h-[50%] rounded-full shadow-[0_0_8px_rgba(204,255,0,0.3)]`}></div>
      <div className={`${barWidth} bg-root-accent h-[25%] rounded-full shadow-[0_0_8px_rgba(204,255,0,0.3)]`}></div>
    </div>
  );
};