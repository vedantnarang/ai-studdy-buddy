import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    streak: 0,
    weakTopics: [],
    totalSessions: 0,
    forgottenTopics: [],
    materialGaps: [],
    subjectReadiness: []
  });

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both sessions (for streak) and new analytics
      const [sessionsRes, analyticsRes] = await Promise.all([
        api.get('/sessions'),
        api.get('/analytics')
      ]);

      const sessions = sessionsRes.data.data || [];
      const analytics = analyticsRes.data.data || {};

      // Calculate Streak (Client-side for now to keep existing logic)
      const calculateStreak = (sessionsList) => {
        if (!sessionsList || sessionsList.length === 0) return 0;
        const dates = sessionsList.map(s => new Date(s.createdAt).toDateString());
        const uniqueDates = [...new Set(dates)].map(d => new Date(d));
        uniqueDates.sort((a, b) => b - a);

        let streakCount = 0;
        let current = new Date();
        current.setHours(0, 0, 0, 0);

        const todayStr = current.toDateString();
        const yesterdayStr = new Date(current.getTime() - 86400000).toDateString();

        const hasToday = dates.includes(todayStr);
        const hasYesterday = dates.includes(yesterdayStr);

        if (!hasToday && !hasYesterday) return 0;

        let checkDate = hasToday ? current : new Date(current.getTime() - 86400000);

        for (let i = 0; i < uniqueDates.length; i++) {
          const sessionDate = uniqueDates[i];
          if (sessionDate.toDateString() === checkDate.toDateString()) {
            streakCount++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
        return streakCount;
      };

      // Calculate Weak Topics
      const calculateWeakTopics = (sessionsList) => {
        const topicStats = {};
        
        // Filter out sessions with orphaned topicId
        const validSessions = sessionsList.filter(s => s.topicId);

        validSessions.forEach(s => {
          const tId = s.topicId?._id || s.topicId;
          const tTitle = s.topicId?.title || 'Unknown Topic';
          const tSubjectTitle = s.topicId?.subjectId?.title || null;
          const tSubjectColor = s.topicId?.subjectId?.color || null;
          
          if (!topicStats[tId]) {
            topicStats[tId] = { id: tId, title: tTitle, totalScore: 0, count: 0, subjectTitle: tSubjectTitle, subjectColor: tSubjectColor };
          }
          topicStats[tId].totalScore += (s.score / s.totalQuestions) * 100;
          topicStats[tId].count++;
        });

        return Object.values(topicStats)
          .map(topic => ({
            ...topic,
            avgScore: topic.totalScore / topic.count
          }))
          .filter(topic => topic.avgScore < 70) 
          .sort((a, b) => a.avgScore - b.avgScore);
      };

      setStats({
        streak: calculateStreak(sessions),
        weakTopics: calculateWeakTopics(sessions),
        totalSessions: sessions.length,
        forgottenTopics: analytics.forgottenTopics || [],
        materialGaps: analytics.materialGaps || [],
        subjectReadiness: analytics.subjectReadiness || []
      });

    } catch (err) {
      console.error('Analytics Fetch Error:', err);
      setError('Failed to load study insights');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { ...stats, loading, error, refresh: fetchAnalytics };
};
