import { useState, useCallback } from 'react';
import api from '../services/api';

export const useQuizSession = (topicId, quiz, onComplete) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const selectAnswer = useCallback((option) => {
    if (selectedAnswer) return; // Lock multiple selections in same question
    setSelectedAnswer(option);
    
    const currentQuestion = quiz[currentIndex];
    if (option === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }
  }, [currentIndex, quiz, selectedAnswer]);

  const nextQuestion = useCallback(async () => {
    if (currentIndex < quiz.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setIsFinished(true);
      
      const currentQuestionScore = (selectedAnswer === quiz[currentIndex].correctAnswer) ? 1 : 0;
      const finalScore = score + currentQuestionScore;
      
      try {
          await api.post('/sessions', {
             topicId,
             type: 'quiz',
             score: finalScore,
             totalQuestions: quiz.length
          });
      } catch (err) {
          console.error("Failed to save quiz session metrics", err);
      }
      
      if (onComplete) onComplete(finalScore, quiz.length);
    }
  }, [currentIndex, quiz, score, selectedAnswer, topicId, onComplete]);

  const resetSession = useCallback(() => {
     setCurrentIndex(0);
     setSelectedAnswer(null);
     setScore(0);
     setIsFinished(false);
  }, []);

  return {
    currentQuestion: quiz[currentIndex],
    currentIndex,
    totalQuestions: quiz.length,
    selectedAnswer,
    score,
    isFinished,
    selectAnswer,
    nextQuestion,
    resetSession
  };
};
