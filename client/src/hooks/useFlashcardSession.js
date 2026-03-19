import { useState, useCallback } from 'react';
import api from '../services/api';

export const useFlashcardSession = (topicId, flashcards, onComplete) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const flipCard = useCallback(() => setIsFlipped(prev => !prev), []);

  const nextCard = useCallback((isKnown) => {
    if (isKnown) {
      setCorrectCount(prev => prev + 1);
    }
    
    setIsFlipped(false);
    
    setTimeout(async () => {
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setIsFinished(true);
        const finalScore = isKnown ? correctCount + 1 : correctCount;
        
        // Dispatch session to backend quietly
        try {
          await api.post('/sessions', {
             topicId,
             type: 'flashcards',
             score: finalScore,
             totalQuestions: flashcards.length
          });
        } catch (err) {
          console.error("Failed to save flashcard session metrics", err);
        }
        
        if (onComplete) {
           onComplete(finalScore, flashcards.length);
        }
      }
    }, 150); // Wait for the reverse flip transition
  }, [currentIndex, flashcards.length, correctCount, topicId, onComplete]);

  const resetSession = useCallback(() => {
     setCurrentIndex(0);
     setIsFlipped(false);
     setCorrectCount(0);
     setIsFinished(false);
  }, []);

  return {
    currentCard: flashcards[currentIndex],
    currentIndex,
    totalCards: flashcards.length,
    isFlipped,
    correctCount,
    isFinished,
    flipCard,
    nextCard,
    resetSession
  };
};
