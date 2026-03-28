import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
  isLoading?: boolean;
  className?: string;
  size?: number;
}

export default function Logo({ isLoading = false, className = "", size = 32 }: LogoProps) {
  return (
    <motion.div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="maroon-foil" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5A0A18" />
            <stop offset="25%" stopColor="#9E1B34" />
            <stop offset="50%" stopColor="#D92B5A" />
            <stop offset="75%" stopColor="#9E1B34" />
            <stop offset="100%" stopColor="#38040E" />
          </linearGradient>
          <linearGradient id="maroon-foil-alt" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38040E" />
            <stop offset="30%" stopColor="#D92B5A" />
            <stop offset="70%" stopColor="#7A1226" />
            <stop offset="100%" stopColor="#5A0A18" />
          </linearGradient>
        </defs>

      

        {/* Inner S / Bookshelf */}
        <motion.path
          d="M 65 35 C 65 25, 35 25, 35 40 C 35 55, 65 45, 65 60 C 65 75, 35 75, 35 65"
          stroke="url(#maroon-foil-alt)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          animate={isLoading ? { scale: [1, 0.8, 1], opacity: [1, 0.6, 1] } : { scale: 1, opacity: 1 }}
          transition={isLoading ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : { duration: 0.8, ease: "easeOut" }}
          style={{ originX: "50px", originY: "50px" }}
        />
        
        {/* Accent Dots (Books) */}
        <motion.circle
          cx="35"
          cy="35"
          r="5"
          fill="#D92B5A"
          animate={isLoading ? { scale: [1, 0, 1], opacity: [1, 0, 1] } : { scale: 1, opacity: 1 }}
          transition={isLoading ? { duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 } : { duration: 0.8, ease: "easeOut" }}
          style={{ originX: "35px", originY: "35px" }}
        />
      
      </svg>
    </motion.div>
  );
}
