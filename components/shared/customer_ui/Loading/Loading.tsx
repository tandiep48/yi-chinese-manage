import React from 'react';
import { LOADING_DESIGN, LOADING_TEXT } from './constants';

interface LoadingProps {
  text?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Loading({ 
  text = LOADING_TEXT.default, 
  className = '', 
  size = 'md' 
}: LoadingProps) {
  const dotSize = LOADING_DESIGN.dotSizes[size];

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-[#738a72] ${className}`}>
      <div className="flex items-center justify-center space-x-1.5 mb-3">
        <span className={`block ${dotSize} rounded-full bg-[#576856] opacity-40 animate-dot-bounce`}></span>
        <span className={`block ${dotSize} rounded-full bg-[#576856] opacity-40 animate-dot-bounce [animation-delay:0.2s]`}></span>
        <span className={`block ${dotSize} rounded-full bg-[#576856] opacity-40 animate-dot-bounce [animation-delay:0.4s]`}></span>
      </div>
      {text && (
        <div className="text-sm font-semibold text-[#576856]">{text}</div>
      )}
    </div>
  );
}
