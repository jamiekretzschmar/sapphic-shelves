import React from 'react';
import { motion } from 'framer-motion';

interface LogoLoaderProps {
  size?: number;
  className?: string;
  isSpinning?: boolean;
}

export default function LogoLoader({ size = 24, className = '', isSpinning = true }: LogoLoaderProps) {
  return (
    <motion.div
      className={`relative rounded-full overflow-hidden flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
      transition={isSpinning ? { repeat: Infinity, duration: 3, ease: "linear" } : {}}
    >
      <img 
        src="/logo.png" 
        alt="Loading..." 
        className="w-full h-full object-cover rounded-full"
        onError={(e) => {
          // Fallback if logo.png is not found
          (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>';
        }}
      />
      {/* Optional: Add a subtle inner shadow or border to enhance the circular look */}
      <div className="absolute inset-0 rounded-full border border-black/10 dark:border-white/10 pointer-events-none" />
    </motion.div>
  );
}
