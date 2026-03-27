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
      // Use the generic topic PUT route
      const res = await api.put(`/topics/${topicId}`, { notes: content });
      const updatedTopic = res.data.data || res.data.topic || res.data;
      setTopic(updatedTopic);
      toast.success('Notes autosaved', { position: 'bottom-right', duration: 2000 });
      return { success: true, data: updatedTopic };
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save notes');
      return { success: false, error: err.response?.data?.message || err.message };
    }
  };

  const updateSummaryText = async (newSummary) => {
    if (!topicId) return { success: false, error: "No topic ID provided" };
    
    try {
      // Use the same generic topic PUT route
      const res = await api.put(`/topics/${topicId}`, { summary: newSummary });
      const updatedTopic = res.data.data || res.data.topic || res.data;
      setTopic(updatedTopic);
      toast.success('Summary saved successfully!');
      return { success: true, data: updatedTopic };
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save summary');
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

  const uploadDocuments = async (files) => {
    if (!topicId || !files || files.length === 0) return { success: false, error: "No files provided" };

    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append('files', file);
      }

      const res = await api.post(`/topics/${topicId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const updatedTopic = res.data.data?.topic || res.data.topic || res.data.data;
      if (updatedTopic) {
        setTopic(updatedTopic);
      } else {
        // Re-fetch if we didn't get the topic back from the response
        await fetchTopic();
      }

      toast.success(res.data.data?.message || 'Documents uploaded successfully!');
      return { success: true, data: res.data.data };
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to upload documents');
      return { success: false, error: err.response?.data?.message || err.message };
    }
  };

  const updateDocumentText = async (documentId, extractedText) => {
    if (!topicId) return { success: false, error: "No topic ID" };

    try {
      const res = await api.put(`/topics/${topicId}/documents/${documentId}`, { extractedText });
      const updatedTopic = res.data.data || res.data;
      setTopic(updatedTopic);
      toast.success('Document text updated!', { duration: 2000 });
      return { success: true, data: updatedTopic };
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update document');
      return { success: false, error: err.response?.data?.message || err.message };
    }
  };

  const deleteDocument = async (documentId) => {
    if (!topicId) return { success: false, error: "No topic ID" };

    try {
      const res = await api.delete(`/topics/${topicId}/documents/${documentId}`);
      const updatedTopic = res.data.data || res.data;
      setTopic(updatedTopic);
      toast.success('Document removed.');
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete document');
      return { success: false, error: err.response?.data?.message || err.message };
    }
  };

  const deleteImage = async (imageId) => {
    if (!topicId) return { success: false, error: "No topic ID" };

    try {
      const res = await api.delete(`/topics/${topicId}/images?imageId=${encodeURIComponent(imageId)}`);
      const updatedTopic = res.data.data || res.data;
      setTopic(updatedTopic);
      toast.success('Image removed.');
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete image');
      return { success: false, error: err.response?.data?.message || err.message };
    }
  };

  const retryImageExtraction = async (imageId) => {
    if (!topicId || !imageId) return { success: false, error: "Missing topicId or imageId" };

    try {
      const res = await api.post(`/topics/${topicId}/images`, { imageId });
      const updatedTopic = res.data.data?.topic || res.data.topic || res.data.data;
      if (updatedTopic) {
        setTopic(updatedTopic);
      }
      toast.success('Text extracted successfully!');
      return { success: true, data: res.data.data };
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Extraction failed. Model might still be busy.';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  return { 
    topic, 
    setTopic,
    loading, 
    error, 
    updateNotes, 
    updateSummaryText,
    createTopic,
    deleteTopic, 
    fetchTopic,
    uploadDocuments,
    updateDocumentText,
    deleteDocument,
    deleteImage,
    retryImageExtraction,
  };
};
