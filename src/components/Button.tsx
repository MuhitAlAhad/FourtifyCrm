import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit';
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  onClick,
  className = '',
  type = 'button'
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center transition-all duration-200 clip-corner';
  
  const variants = {
    primary: 'bg-[#3dd68c] text-[#0f1419] hover:bg-[#2ab872]',
    secondary: 'bg-[#2a2f38] text-[#e2e8f0] hover:bg-[#363c48]',
    outline: 'border-2 border-[#3dd68c] text-[#3dd68c] hover:bg-[#3dd68c] hover:text-[#0f1419]',
    ghost: 'bg-transparent text-[#94a3b8] hover:bg-[#2a2f38]/50 hover:text-[#3dd68c]'
  };
  
  const sizes = {
    sm: 'px-4 py-2',
    md: 'px-6 py-3',
    lg: 'px-8 py-4'
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}