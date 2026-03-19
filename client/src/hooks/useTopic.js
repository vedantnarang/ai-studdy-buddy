import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

export const useTopic = (topicId) => {
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTopic = useCallback(async () => {
    if (!topicId) return;
    try {
      setLoading(true);
      const res = await api.get(`/topics/${topicId}`);
      setTopic(res.data.data || res.data.topic || res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch topic');
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    if (topicId) {
      fetchTopic();
    }
  }, [fetchTopic, topicId]);

  const updateNotes = async (content) => {
    if (!topicId) return { success: false, error: "No topic ID provided" };
    
    try {
      const res = await api.put(`/topics/${topicId}`, { content });
      const updatedTopic = res.data.data || res.data.topic || res.data;
      setTopic(updatedTopic);
      toast.success('Notes autosaved', { position: 'bottom-right', duration: 2000 });
      return { success: true, data: updatedTopic };
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save notes');
      return { success: false, error: err.response?.data?.message || err.message };
    }
  };
  
  const createTopic = async (subjectId, title) => {
     try {
         const res = await api.post(`/subjects/${subjectId}/topics`, { title });
         toast.success('Topic created successfully!');
         return { success: true, data: res.data.data || res.data.topic || res.data };
     } catch (err) {
         toast.error(err.response?.data?.message || err.message || 'Failed to create topic');
         return { success: false, error: err.response?.data?.message || err.message };
     }
  };

  const deleteTopic = async (topicId) => {
     try {
         await api.delete(`/topics/${topicId}`);
         toast.success('Topic permanently deleted.');
         return { success: true };
     } catch (err) {
         toast.error(err.response?.data?.message || err.message || 'Failed to delete topic');
         return { success: false, error: err.response?.data?.message || err.message };
     }
  };

  return { 
    topic, 
    setTopic, // exported so UI can optimistically mutate local state if needed
    loading, 
    error, 
    updateNotes, 
    createTopic,
    deleteTopic, 
    fetchTopic 
  };
};
