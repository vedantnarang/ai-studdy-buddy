import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useQuizSession = (topicId) => {
  const [quiz, setQuiz] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [answersMap, setAnswersMap] = useState({}); // Stores all past answers: { questionId: { index, isCorrect } }
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null); 
  const [score, setScore] = useState(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. On Mount: Fetch Quiz, then look for unfinished attempt
  useEffect(() => {
    let isMounted = true;
    const initSession = async () => {
      try {
        setIsLoading(true);
        // Step A: Fetch Quiz
        const quizRes = await api.get(`/topics/${topicId}/quiz`);
        const fetchedQuiz = quizRes.data?.data?.quiz || quizRes.data?.quiz;
        if (!fetchedQuiz) {
          if (isMounted) setIsLoading(false);
          return;
        }
        
        if (isMounted) setQuiz(fetchedQuiz);

        // Step B: Look for unfinished attempt
        const attemptRes = await api.get(`/quiz-attempts?quizId=${fetchedQuiz._id}&status=in_progress`);
        const attempt = attemptRes.data?.data?.attempt || attemptRes.data?.attempt;

        if (isMounted) {
          if (attempt) {
            // Resume unfinished attempt
            setAttemptId(attempt._id);
            setScore(attempt.score || 0);
            
            // Reconstruct answers map
            const map = {};
            attempt.answers.forEach(a => {
              map[a.questionId] = { index: a.selectedOptionIndex, isCorrect: a.isCorrect };
            });
            setAnswersMap(map);

            // Determine where to resume (first unanswered question)
            const answeredCount = attempt.answers.length;
            if (answeredCount >= fetchedQuiz.questions.length) {
              setIsFinished(true); // Should logically be completed, but just in case
            } else {
              setCurrentIndex(answeredCount);
            }
          } else {
            // No unfinished attempt, create a new one!
            const newAttemptRes = await api.post('/quiz-attempts', {
              quizId: fetchedQuiz._id,
              topicId
            });
            const newAttempt = newAttemptRes.data?.data?.attempt || newAttemptRes.data?.attempt;
            setAttemptId(newAttempt?._id);
            setScore(0);
            setCurrentIndex(0);
            setAnswersMap({});
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Quiz init error", err);
        if (isMounted) {
          setError(err.message || 'Failed to load quiz');
          setIsLoading(false);
        }
      }
    };

    if (topicId) {
      initSession();
    }

    return () => { isMounted = false; };
  }, [topicId]);

  // 2. Select an Answer
  const selectAnswer = useCallback(async (optionIndex) => {
    if (!quiz || !attemptId || isFinished || isSubmitting) return;
    
    const currentQuestion = quiz.questions[currentIndex];
    // Block multiple selections for the same question
    if (answersMap[currentQuestion._id] !== undefined) return;

    setIsSubmitting(true);
    setSelectedAnswer(optionIndex); // Optimistically set UI

    const isCorrect = optionIndex === currentQuestion.correctIndex;

    try {
      // Step C: Persist answer immediately
      const res = await api.put(`/quiz-attempts/${attemptId}/submit`, {
        questionId: currentQuestion._id,
        selectedOptionIndex: optionIndex,
        isCorrect,
        isFinished: false
      });

      // Update state strictly from backend source of truth to prevent desync
      const updatedAttempt = res.data?.data?.attempt || res.data?.attempt;
      if (updatedAttempt) {
        setScore(updatedAttempt.score);
      }
      setAnswersMap(prev => ({
        ...prev,
        [currentQuestion._id]: { index: optionIndex, isCorrect }
      }));

    } catch (err) {
      console.error("Failed to save answer", err);
      // Revert optimistic UI on failure
      setSelectedAnswer(null); 
    } finally {
      setIsSubmitting(false);
    }
  }, [currentIndex, quiz, attemptId, answersMap, isFinished, isSubmitting]);

  // 3. Navigate to next question or finish
  const nextQuestion = useCallback(async () => {
    if (!quiz || isSubmitting) return;

    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      // Hit Finish
      setIsSubmitting(true);
      try {
        await api.put(`/quiz-attempts/${attemptId}/submit`, { isFinished: true });
        setIsFinished(true);
      } catch (err) {
        console.error("Failed to finish quiz", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [currentIndex, quiz, attemptId, isSubmitting]);

  // 4. Reset to retake
  const resetSession = useCallback(async () => {
    if (!quiz) return;
    setIsLoading(true);
    setIsFinished(false);
    
    try {
      // Create fresh attempt
      const newAttemptRes = await api.post('/quiz-attempts', {
        quizId: quiz._id,
        topicId
      });
      const attempt = newAttemptRes.data?.data?.attempt || newAttemptRes.data?.attempt;
      setAttemptId(attempt?._id);
      setScore(0);
      setCurrentIndex(0);
      setAnswersMap({});
      setSelectedAnswer(null);
    } catch (err) {
       console.error("Failed to restart quiz", err);
    } finally {
      setIsLoading(false);
    }
  }, [quiz, topicId]);

  return {
    isLoading,
    error,
    quiz,
    currentQuestion: quiz ? quiz.questions[currentIndex] : null,
    currentIndex,
    totalQuestions: quiz ? quiz.questions.length : 0,
    selectedAnswer, // Immediate local state
    answersMap,     // Global state mapping for checking if answered
    score,
    isFinished,
    isSubmitting,
    selectAnswer,
    nextQuestion,
    resetSession
  };
};
