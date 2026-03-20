import React from 'react';

const FlashcardItem = ({ card, isFlipped, onFlip, themeColor }) => {
  const fallbackColor = '#0053db';
  const effectiveColor = themeColor || fallbackColor;

  return (
    <div 
      className="relative w-full aspect-[4/3] md:aspect-[3/2] flex items-center justify-center group cursor-pointer"
      onClick={onFlip}
      style={{ perspective: '1000px' }}
    >
      {/* Background Decoration (The Editorial Depth from Stitch) */}
      <div className="absolute inset-0 bg-surface-container-low dark:bg-gray-900 rounded-[2rem] scale-95 translate-y-4 opacity-70"></div>
      
      {/* The 3D Rotating Container */}
      <div 
        className="relative w-full h-full rounded-[2rem] flex flex-col transition-transform duration-500 hover:scale-[1.01] active:scale-[0.99] shadow-lg dark:shadow-none"
        style={{ 
          transformStyle: 'preserve-3d', 
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          boxShadow: `0 20px 40px -15px ${effectiveColor}30` 
        }}
      >
        {/* Front - Question */}
        <div 
          className="absolute inset-0 rounded-[2rem] p-8 md:p-12 flex flex-col items-center justify-center text-center text-white overflow-hidden shadow-2xl z-10"
          style={{ 
            backfaceVisibility: 'hidden', 
            WebkitBackfaceVisibility: 'hidden', 
            background: `linear-gradient(135deg, ${effectiveColor} 0%, ${effectiveColor}cc 100%)`
          }}
        >
          {/* Card Indicator (Design System Signature) */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/30 rounded-full"></div>
          
          <div className="space-y-4 md:space-y-6 flex flex-col items-center w-full">
            <span className="material-symbols-outlined text-4xl md:text-5xl opacity-80 decoration-0">lightbulb</span>
            <h2 className="font-headline text-lg md:text-2xl font-bold leading-tight select-none">
              {card.question}
            </h2>
          </div>
          
          {/* Flip Animation Hint */}
          <div className="absolute bottom-6 flex items-center gap-2 text-white/70 font-label text-xs md:text-sm font-medium">
            <span className="material-symbols-outlined text-base md:text-lg">flip</span>
            Tap to reveal
          </div>
        </div>

        {/* Back - Answer */}
        <div 
          className="absolute inset-0 bg-white dark:bg-gray-800 rounded-[2rem] p-8 md:p-12 flex flex-col items-center justify-center text-center overflow-hidden border-2"
          style={{ 
            backfaceVisibility: 'hidden', 
            WebkitBackfaceVisibility: 'hidden', 
            transform: 'rotateY(180deg)',
            borderColor: `${effectiveColor}40`
          }}
        >
          {/* Subtle Background Glow */}
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ backgroundColor: effectiveColor }}></div>
          
          {/* Card Indicator */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-12 h-1 opacity-30 rounded-full" style={{ backgroundColor: effectiveColor }}></div>
          
          <div className="w-full max-h-full overflow-y-auto scrollbar-thin flex flex-col items-center justify-center space-y-4 md:space-y-6 z-10 pb-8">
            <span 
              className="px-3 py-1 bg-surface-container-high dark:bg-gray-700 text-xs font-bold rounded-full uppercase tracking-widest mt-2 shrink-0"
              style={{ color: effectiveColor }}
            >
              Answer
            </span>
            <p className="font-body text-base md:text-xl font-medium text-on-surface dark:text-gray-100 leading-relaxed select-text">
              {card.answer}
            </p>
          </div>
          
          {/* Flip Animation Hint Back */}
          <div className="absolute bottom-6 flex items-center gap-2 text-on-surface-variant/50 dark:text-gray-500 font-label text-xs md:text-sm font-medium z-10 bg-white/80 dark:bg-gray-800/80 px-4 py-1 rounded-full backdrop-blur">
            <span className="material-symbols-outlined text-base md:text-lg">flip</span>
            Tap to conceal
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardItem;
