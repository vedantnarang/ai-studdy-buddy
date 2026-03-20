import React from "react";

const FlashcardItem = ({ card, isFlipped, onFlip, themeColor }) => {
  const fallbackColor = "#0053db";
  const effectiveColor = themeColor || fallbackColor;

  return (
    <div
      className="relative w-full aspect-[4/3] md:aspect-[3/2] flex items-center justify-center group cursor-pointer"
      onClick={onFlip}
      style={{ perspective: "1000px" }}
    >
      {/* Background Decoration (The Editorial Depth from Stitch) */}
      <div className="absolute inset-0 bg-surface-container-low dark:bg-gray-900 rounded-[2rem] scale-95 translate-y-4 opacity-70"></div>

      {/* The 3D Rotating Container */}
      <div
        className="relative w-full h-full rounded-[2rem] flex flex-col transition-transform duration-500 hover:scale-[1.01] active:scale-[0.99] shadow-lg dark:shadow-none"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          boxShadow: `0 20px 40px -15px ${effectiveColor}30`,
        }}
      >
        {/* Front - Question */}
        <div
          className="absolute inset-0 rounded-[2rem] p-6 md:p-8 flex flex-col items-center justify-between text-center text-white overflow-hidden shadow-2xl z-10"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            background: `linear-gradient(135deg, ${effectiveColor} 0%, ${effectiveColor}cc 100%)`,
          }}
        >
          {/* Card Indicator (Design System Signature) */}
          <div className="w-12 h-1 bg-white/30 rounded-full shrink-0 mb-2"></div>

          {/* Scrollable Center Content */}
          <div className="flex-1 w-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-2 flex flex-col">
            <div className="m-auto w-full flex flex-col items-center">
              <h2 className="font-headline text-base md:text-sm font-medium leading-snug select-none px-2 text-balance text-center">
                {card.question}
              </h2>
            </div>
          </div>

          {/* Flip Animation Hint */}
          <div className="flex items-center gap-2 text-white/70 font-label text-xs font-medium shrink-0 mt-2 pt-0.5">
            <span className="material-symbols-outlined text-base">flip</span>
            Tap to reveal
          </div>
        </div>

        {/* Back - Answer */}
        <div
          className="absolute inset-0 bg-white dark:bg-gray-800 rounded-[2rem] p-6 md:p-8 flex flex-col items-center justify-between text-center overflow-hidden border-2"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            borderColor: `${effectiveColor}40`,
          }}
        >
          {/* Subtle Background Glow */}
          <div
            className="absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: effectiveColor }}
          ></div>

          {/* Card Indicator Header */}
          <div
            className="w-12 h-1 opacity-30 rounded-full shrink-0 mb-4"
            style={{ backgroundColor: effectiveColor }}
          ></div>


          {/* Scrollable Center Content */}
          <div className="flex-1 w-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1 z-10 flex flex-col">
            <div className="m-auto w-full">
              <p className="font-body text-sm font-medium text-on-surface dark:text-gray-100 leading-relaxed select-text text-balance">
                {card.answer}
              </p>
            </div>
          </div>

          {/* Flip Animation Hint Back */}
          <div className="flex items-center gap-2 text-on-surface-variant/60 dark:text-gray-400 font-label text-xs md:text-sm font-medium shrink-0 mt-2 z-10 bg-white/80 dark:bg-gray-800/80 pt-1 px-4 py-1.5 rounded-full backdrop-blur">
            <span className="material-symbols-outlined text-base md:text-lg">
              flip
            </span>
            Tap to conceal
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardItem;
