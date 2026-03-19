import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSubjects } from '../hooks/useSubjects';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

const SubjectsList = () => {
  const { subjects, loading, error, createSubject, deleteSubject } = useSubjects();
  const [isCreating, setIsCreating] = useState(false);
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
