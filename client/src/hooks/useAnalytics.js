import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useAnalytics = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    streak: 0,
    weakTopics: [],
    totalSessions: 0
  });

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/sessions');
      const data = res.data.data || res.data.sessions || res.data;
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (sessions.length === 0) return;

    // Calculate Streak
    const calculateStreak = (sessions) => {
      const dates = sessions.map(s => new Date(s.createdAt).toDateString());
      const uniqueDates = [...new Set(dates)].map(d => new Date(d));
      uniqueDates.sort((a, b) => b - a); // Descending

      let streak = 0;
      let current = new Date();
      current.setHours(0, 0, 0, 0);

      const todayStr = current.toDateString();
      const yesterdayStr = new Date(current.getTime() - 86400000).toDateString();

      // Check if there's a session today or yesterday to start the streak
      const hasToday = dates.includes(todayStr);
      const hasYesterday = dates.includes(yesterdayStr);

      if (!hasToday && !hasYesterday) return 0;

      // Start from the most recent session date
      let checkDate = hasToday ? current : new Date(current.getTime() - 86400000);

      for (let i = 0; i < uniqueDates.length; i++) {
        const sessionDate = uniqueDates[i];
        if (sessionDate.toDateString() === checkDate.toDateString()) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      return streak;
    };

    // Calculate Weak Topics (Score < 70% on average)
    const calculateWeakTopics = (sessions) => {
      const topicStats = {};
      
      sessions.forEach(s => {
        const tId = s.topicId?._id || s.topicId;
        const tTitle = s.topicId?.title || 'Unknown Topic';
        
        if (!topicStats[tId]) {
          topicStats[tId] = { totalScore: 0, count: 0, title: tTitle };
        }
        topicStats[tId].totalScore += (s.score / s.totalQuestions) * 100;
        topicStats[tId].count += 1;
      });

      return Object.entries(topicStats)
        .map(([id, stats]) => ({
          id,
          title: stats.title,
          avgScore: stats.totalScore / stats.count,
          count: stats.count
        }))
        .filter(t => t.avgScore < 70 && t.count >= 1)
        .sort((a, b) => a.avgScore - b.avgScore)
        .slice(0, 3);
    };

    setStats({
      streak: calculateStreak(sessions),
      weakTopics: calculateWeakTopics(sessions),
      totalSessions: sessions.length
    });
  }, [sessions]);

  return { ...stats, loading, refresh: fetchSessions };
};
