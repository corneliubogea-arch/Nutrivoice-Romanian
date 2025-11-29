import React from 'react';

interface VisualizerProps {
  isActive: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ isActive }) => {
  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Base Circle */}
      <div className={`absolute w-48 h-48 bg-emerald-500 rounded-full transition-all duration-500 ${isActive ? 'opacity-100 scale-100 shadow-[0_0_50px_rgba(16,185,129,0.5)]' : 'opacity-30 scale-90'}`}></div>
      
      {/* Pulse Effects (only when active) */}
      {isActive && (
        <>
          <div className="absolute w-48 h-48 border-4 border-emerald-200 rounded-full animate-pulse-ring"></div>
          <div className="absolute w-48 h-48 border-4 border-emerald-300 rounded-full animate-pulse-ring" style={{ animationDelay: '1s' }}></div>
        </>
      )}
      
      {/* Icon/Center */}
      <div className="z-10 text-white">
         {isActive ? (
            <svg className="w-16 h-16 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
            </svg>
         ) : (
             <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
             </svg>
         )}
      </div>
    </div>
  );
};