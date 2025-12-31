import React, { useEffect } from 'react';

interface CelebrationProps {
  onComplete: () => void;
  message?: string;
}

const Celebration: React.FC<CelebrationProps> = ({ onComplete, message = "Great Job!" }) => {
  useEffect(() => {
    // Simple timer to close the overlay
    const timer = setTimeout(onComplete, 1500); // Shorter duration
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[100] animate-in fade-in duration-300">
      <div className="bg-white/95 p-8 rounded-3xl shadow-xl backdrop-blur-sm border-2 border-cyan-50 transform scale-100 transition-all">
        <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 text-center">
            ✨ {message} ✨
        </div>
      </div>
    </div>
  );
};

export default Celebration;