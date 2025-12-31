import React, { useEffect } from 'react';
// @ts-ignore
import confetti from 'canvas-confetti';

interface CelebrationProps {
  onComplete: () => void;
  message?: string;
}

const Celebration: React.FC<CelebrationProps> = ({ onComplete, message = "Great Job!" }) => {
  useEffect(() => {
    // Fire confetti sequence
    const count = 200;
    const defaults = {
      origin: { y: 0.7 }
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ['#0d9488', '#14b8a6'] // Teals
    });
    fire(0.2, {
      spread: 60,
      colors: ['#fcd34d', '#fbbf24'] // Golds
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });

    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[100] animate-in fade-in duration-300">
      <div className="bg-white/90 p-8 rounded-3xl shadow-2xl backdrop-blur-sm border-4 border-teal-100 transform animate-[bounce_1s_infinite]">
        <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-700 text-center">
            🎉 {message} 🎉
        </div>
      </div>
    </div>
  );
};

export default Celebration;