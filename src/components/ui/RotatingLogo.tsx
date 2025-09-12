import React from 'react';
import { cn } from '@/lib/utils';

interface RotatingLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  speed?: 'very-slow' | 'slow' | 'normal' | 'fast';
}

const RotatingLogo: React.FC<RotatingLogoProps> = ({ 
  className, 
  size = 'md', 
  speed = 'normal' 
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const speedClasses = {
    'very-slow': 'animate-spin-very-slow',
    slow: 'animate-spin-slow',
    normal: 'animate-spin',
    fast: 'animate-spin-fast'
  };

  return (
    <img
      src="/logo.png"
      alt="StarBeverage Logo"
      className={cn(
        sizeClasses[size],
        speedClasses[speed],
        className
      )}
    />
  );
};

export default RotatingLogo;
