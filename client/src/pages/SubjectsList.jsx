import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSubjects } from '../hooks/useSubjects';
import { useAnalytics } from '../hooks/useAnalytics';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

const SubjectsList = () => {
  const { subjects, loading, error, createSubject, deleteSubject } = useSubjects();
  const { streak, weakTopics, loading: analyticsLoading } = useAnalytics();
  const [isCreating, setIsCreating] = useState(false);
  // ... existing state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newColor, setNewColor] = useState('#3B82F6'); 
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    setCreateLoading(true);
    setCreateError('');
    const result = await createSubject(newTitle, newColor, newDescription);
    
    if (result.success) {
      setIsCreating(false);
      setNewTitle('');
      setNewDescription('');
    } else {
      setCreateError(result.error);
    }
    setCreateLoading(false);
  };

  const handleDeleteClick = (e, id) => {
    e.preventDefault();
    setSubjectToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!subjectToDelete) return;
    setIsDeleting(true);
    await deleteSubject(subjectToDelete);
    setIsDeleting(false);
    setDeleteModalOpen(false);
    setSubjectToDelete(null);
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setSubjectToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      {/* Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Streak Card */}
        <div className="bg-linear-to-br from-orange-400 to-red-500 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
          <div className="relative z-10">
            <h3 className="text-lg font-medium opacity-90">Study Streak</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-5xl font-bold">{streak}</span>
              <span className="text-xl">days</span>
            </div>
            <p className="mt-2 text-sm opacity-80">
              {streak > 0 ? "You're on fire! Keep it up." : "Start a session today to begin your streak!"}
            </p>
          </div>
          <svg className="absolute right-[-10px] bottom-[-10px] w-32 h-32 opacity-20 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C12 2 12 2 12 2C12 2 12 2 12 2L12 2.00001C9.61 2.00001 7.63 3.65 7.12 5.88C5.23 6.7 4 8.65 4 10.89C4 13.92 6.46 16.38 9.5 16.38C9.64 16.38 9.77 16.38 9.91 16.37C11.1 17.38 12 18 12 18C12 18 12.9 17.38 14.09 16.37C14.23 16.38 14.36 16.38 14.5 16.38C17.54 16.38 20 13.92 20 10.89C20 8.65 18.77 6.7 16.88 5.88C16.37 3.65 14.39 2 12 2ZM11 14H9.5C7.57 14 6 12.43 6 10.5C6 9.4 6.55 8.41 7.42 7.82L8.09 7.37L8 6.56C8 4.6 9.35 3 11 3C11.66 3 12.28 3.23 12.77 3.65L13.5 4.27L14.23 3.65C14.72 3.23 15.34 3 16 3C17.65 3 19 4.6 19 6.56L18.91 7.37L19.58 7.82C20.45 8.41 21 9.4 21 10.5C21 12.43 19.43 14 17.5 14H16V14.5C16 15.22 15.65 15.86 15.11 16.27C14.15 17 12 18.5 12 18.5C12 18.5 9.85 17 8.89 16.27C8.35 15.86 8 15.22 8 14.5V14H11V14.5C11 15.22 10.65 15.86 10.11 16.27L11 14Z" /></svg>
        </div>

        {/* Weak Topics Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Focus Areas
          </h3>
          {weakTopics.length > 0 ? (
            <ul className="space-y-3">
              {weakTopics.map(topic => (
                <li key={topic.id} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{topic.title}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500" 
                        style={{ width: `${topic.avgScore}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-semibold text-red-500">{Math.round(topic.avgScore)}%</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
              {analyticsLoading ? 'Loading stats...' : 'No weak spots detected. Doing great!'}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Subjects</h1>
        <button 
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          New Subject
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/50">
          {error}
        </div>
      )}

      {/* Create Form */}
      {isCreating && (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Subject</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            {createError && <p className="text-sm text-red-500">{createError}</p>}
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Physics 101"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
                <input 
                  type="color" 
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-full h-10 p-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 cursor-pointer"
                />
              </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
               <input 
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g. Fundamental concepts of mechanics and kinematics."
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
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
                {createLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid */}
      {subjects.length === 0 && !isCreating ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 border-dashed">
          <h3 className="text-xl font-medium text-gray-900 dark:text-white">No subjects yet</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400 mb-6">Create your first subject to start organizing your study materials.</p>
          <button 
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Create Subject
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {subjects.map((subject) => (
            <Link 
              to={`/subject/${subject._id}`} 
              key={subject._id}
              className="group flex flex-col p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-inner"
                  style={{ backgroundColor: subject.color || '#3B82F6' }}
                >
                  {subject.title ? subject.title.charAt(0).toUpperCase() : 'S'}
                </div>
                <button 
                  onClick={(e) => handleDeleteClick(e, subject._id)}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  title="Delete Subject"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1 truncate">
                {subject.title || 'Untitled Subject'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                {subject.description || 'No description provided.'}
              </p>
            </Link>
          ))}
        </div>
      )}

      <DeleteConfirmationModal 
        isOpen={deleteModalOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
        title="Delete Subject?"
        message="Are you completely sure you want to delete this subject? All associated topics, notes, AI generations, and flashcards will be permanently erased. This cannot be undone."
      />
    </div>
  );
};

export default SubjectsList;
