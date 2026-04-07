import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useContributionGraph = () => {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGraph = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/contribution-graph');
      console.log(res.data.data);
      setDays(res.data.data || []);
    } catch (err) {
      console.error('Contribution graph fetch error:', err);
      setError('Failed to load contribution data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  return { days, loading, error, refresh: fetchGraph };
};
