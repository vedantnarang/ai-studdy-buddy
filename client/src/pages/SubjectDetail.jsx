import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTopic } from '../hooks/useTopic';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import api from '../services/api';

const SubjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { createTopic, deleteTopic } = useTopic(null); // Binding methods
  
  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSubjectData = useCallback(async () => {
    try {
      setLoading(true);
      const subjectRes = await api.get(`/subjects/${id}`);
      setSubject(subjectRes.data.data || subjectRes.data.subject || subjectRes.data);

      const topicsRes = await api.get(`/subjects/${id}/topics`);
      const extractedTopics = topicsRes.data.data || topicsRes.data.topics || topicsRes.data;
      setTopics(Array.isArray(extractedTopics) ? extractedTopics : []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load subject details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSubjectData();
  }, [fetchSubjectData]);

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    setCreateLoading(true);
    const result = await createTopic(id, newTitle);
    
    if (result.success) {
      setTopics((prev) => [...prev, result.data]);
      setIsCreating(false);
      setNewTitle('');
    }
    setCreateLoading(false);
  };

  const handleDeleteClick = (e, topicId) => {
    e.preventDefault();
    e.stopPropagation();
    setTopicToDelete(topicId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!topicToDelete) return;
    setIsDeleting(true);
    const result = await deleteTopic(topicToDelete);
    if (result.success) {
      setTopics((prev) => prev.filter(t => t._id !== topicToDelete));
    }
    setIsDeleting(false);
    setDeleteModalOpen(false);
    setTopicToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl">
        <h3 className="text-lg font-bold mb-2">Error Loading Subject</h3>
        <p>{error}</p>
        <button onClick={() => navigate('/dashboard')} className="mt-4 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1 mb-2 transition-colors"
          >
            &larr; Back to Subjects
          </button>
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-inner shrink-0"
              style={{ backgroundColor: subject?.color || '#3B82F6' }}
            >
              {subject?.title?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{subject?.title || 'Subject Details'}</h1>
              {subject?.description && (
                <p className="mt-1 text-gray-500 dark:text-gray-400">{subject.description}</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          {topics.some(t => t.generationStatus?.hasFlashcards) && (
            <Link
              to={`/subject/${id}/flashcards`}
              className="px-4 py-2 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium rounded-lg shadow-sm transition-colors border border-blue-200 dark:border-blue-800 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">style</span>
              View Flashcards
            </Link>
          )}
          <button 
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors shrink-0"
          >
            New Topic
          </button>
        </div>
      </div>

      {/* Creation Form */}
      {isCreating && (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Topic</h3>
          <form onSubmit={handleCreateTopic} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Topic Title</label>
              <input 
                type="text" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Newton's Laws of Motion"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                required
                autoFocus
              />
            </div>
            <div className="flex gap-3 justify-end mt-4">
              <button 
                type="button" 
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={createLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm disabled:opacity-50 transition-colors"
              >
                {createLoading ? 'Creating...' : 'Create Topic'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Topics List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <h3 className="font-semibold text-gray-900 dark:text-white">Topics ({topics.length})</h3>
        </div>
        
        {topics.length === 0 && !isCreating ? (
           <div className="p-8 text-center">
             <p className="text-gray-500 dark:text-gray-400">No topics found in this subject. Create one to get started updating your notes!</p>
           </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {topics.map((topic) => (
              <li key={topic._id} className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                <div className="flex items-center justify-between px-6 py-4">
                  <Link to={`/topic/${topic._id}`} className="flex items-center gap-3 flex-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {topic.title}
                    </span>
                  </Link>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={(e) => handleDeleteClick(e, topic._id)}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                      title="Delete Topic"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                    <Link to={`/topic/${topic._id}`}>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <DeleteConfirmationModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
        title="Delete Topic?"
        message="This will permanently delete this topic and all associated notes, flashcards, and quizzes. This action cannot be undone."
      />
    </div>
  );
};

export default SubjectDetail;
