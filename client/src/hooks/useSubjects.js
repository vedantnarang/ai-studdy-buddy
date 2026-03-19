import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

export const useSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/subjects');
      
      // Standardize extracting the response payload
      const data = res.data.data || res.data;
      setSubjects(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const createSubject = async (title, color, description = "") => {
    try {
      const res = await api.post('/subjects', { title, color, description });
      const newSubject = res.data.data || res.data.subject || res.data;
      
      setSubjects((prev) => [...prev, newSubject]);
      toast.success('Subject created successfully!');
      return { success: true, data: newSubject };
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create subject');
      return { success: false, error: err.response?.data?.message || err.message };
    }
  };

  const deleteSubject = async (id) => {
    try {
      await api.delete(`/subjects/${id}`);
      setSubjects((prev) => prev.filter(sub => sub._id !== id));
      toast.success('Subject deleted permanently.');
      return { success: true };
    } catch (err) {
       toast.error(err.response?.data?.message || err.message || 'Failed to delete subject');
       return { success: false, error: err.response?.data?.message || err.message };
    }
  };

  return { subjects, loading, error, createSubject, deleteSubject, fetchSubjects };
};
