import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSubjects } from '../hooks/useSubjects';
import { useAnalytics } from '../hooks/useAnalytics';
import { useAuth } from '../context/AuthContext';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

const SubjectsList = () => {
  const { user } = useAuth();
  const { subjects, loading, error, createSubject, deleteSubject } = useSubjects();
  const { weakTopics, loading: analyticsLoading } = useAnalytics();
  
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newColor, setNewColor] = useState('#0053db'); // Default primary blue
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
    e.stopPropagation();
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
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Helper to adjust color opacity easily for tailwind styles
  const getTint = (hex, opacity) => `${hex}${opacity}`;

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-300">
      
      {/* Welcome Header */}
      <header className="mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">
          Welcome back, {user?.name?.split(' ')[0] || 'Scholar'}
        </h2>
        <p className="text-tertiary font-medium">Ready for your deep study session today?</p>
      </header>

      {error && (
        <div className="mb-8 p-4 bg-error-container text-on-error-container rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Main Grid Section */}
      <section className="mb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h3 className="text-xl font-bold font-headline text-on-surface">My Subjects</h3>
          <button 
            onClick={() => setIsCreating(true)}
            className="text-sm font-bold bg-primary text-on-primary hover:bg-primary-dim transition-colors px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md active:scale-95"
          >
            + Create Subject
          </button>
        </div>

        {/* Create Form inline */}
        {isCreating && (
          <div className="p-6 md:p-8 bg-surface-container-lowest dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-4 mb-10">
            <h3 className="text-lg font-bold text-on-surface mb-6">Create New Subject</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              {createError && <p className="text-sm text-error font-medium">{createError}</p>}
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3">
                  <label className="block text-sm font-semibold text-on-surface-variant mb-2">Title</label>
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Molecular Biology"
                    className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-on-surface focus:ring-2 focus:ring-primary/40 outline-none transition-all"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface-variant mb-2">Theme Color</label>
                  <div className="relative">
                    <input 
                      type="color" 
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="w-full h-12 p-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-surface-container-lowest cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div>
                 <label className="block text-sm font-semibold text-on-surface-variant mb-2">Description (Optional)</label>
                 <input 
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="e.g. Cellular structures, DNA replication, and gene expression."
                    className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-on-surface focus:ring-2 focus:ring-primary/40 outline-none transition-all"
                 />
              </div>

              <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)}
                  className="px-5 py-2.5 text-on-surface-variant hover:bg-surface-container-highest rounded-xl transition-colors font-bold text-sm uppercase tracking-wide"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={createLoading}
                  className="px-6 py-2.5 bg-primary hover:bg-primary-dim text-on-primary rounded-xl font-bold shadow-sm disabled:opacity-50 transition-colors text-sm uppercase tracking-wide"
                >
                  {createLoading ? 'Building...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bento Grid */}
        {subjects.length === 0 && !isCreating ? (
          <div className="text-center py-20 bg-surface-container-low rounded-3xl border border-gray-200 dark:border-gray-800 border-dashed">
            <h3 className="text-xl font-bold text-on-surface">Your library is empty</h3>
            <p className="mt-2 text-on-surface-variant mb-8 max-w-sm mx-auto">Create a subject to start analyzing your notes, generating flashcards, and taking quizzes.</p>
            <button 
              onClick={() => setIsCreating(true)}
              className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-dim transition-colors shadow-md"
            >
              Start Your First Subject
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {subjects.map((subject) => {
              const accentColor = subject.color || '#0053db';
              
              return (
                <Link 
                  to={`/subject/${subject._id}`} 
                  key={subject._id}
                  className="bg-surface-container-lowest p-6 lg:p-8 rounded-2xl flex flex-col relative overflow-hidden group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-800"
                >
                  {/* Glowing side accent */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: accentColor }}></div>
                  
                  <div className="flex justify-between items-start mb-6 w-full">
                    {/* Icon Container */}
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl"
                      style={{ 
                        backgroundColor: getTint(accentColor, '20'), // 20% opacity 
                        color: accentColor 
                      }}
                    >
                      {subject.title ? subject.title.charAt(0).toUpperCase() : 'S'}
                    </div>

                    {/* Delete Action button (appears on hover) */}
                    <button 
                      onClick={(e) => handleDeleteClick(e, subject._id)}
                      className="text-gray-400 hover:text-error opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-error-container"
                      title="Delete Subject"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>

                  <h4 className="text-lg md:text-xl font-bold mb-2 text-on-surface truncate pr-2">
                    {subject.title || 'Untitled'}
                  </h4>
                  
                  <p className="text-sm text-on-surface-variant mb-8 line-clamp-2">
                    {subject.description || 'No description provided. Click to add topics and notes.'}
                  </p>

                  <div className="mt-auto pt-4 border-t border-gray-50 dark:border-gray-800/50 flex flex-col gap-2">
                    <button 
                      className="w-full py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all border"
                      style={{ 
                        color: accentColor, 
                        borderColor: getTint(accentColor, '20') 
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = accentColor;
                        e.target.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = accentColor;
                      }}
                    >
                      View Subject
                    </button>
                    {subject.hasFlashcards && (
                      <Link 
                        to={`/subject/${subject._id}/flashcards`}
                        onClick={(e) => e.stopPropagation()} // Prevent double nav since parent is a Link
                        className="w-full py-2.5 bg-surface-container-high hover:bg-surface-container-highest dark:bg-gray-700 dark:hover:bg-gray-600 text-on-surface dark:text-gray-100 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors text-center shadow-sm flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[16px]">style</span>
                        Flashcards
                      </Link>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Focus Areas (Weak Topics Widget replacing the Focus Hours UI) */}
      <section className="mt-12">
        <div className="bg-surface-container-low rounded-3xl p-8 border border-white dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold font-headline text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-error">flag</span>
                Focus Areas
              </h3>
              <p className="text-sm text-on-surface-variant mt-1">AI-detected weak points based on recent quizzes</p>
            </div>
            {/* Design flair: minimal action pill */}
            <div className="hidden sm:flex gap-2">
               <span className="px-4 py-1.5 text-xs font-bold rounded-full bg-surface-container-highest text-on-surface">Auto-updated</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
            {weakTopics.length > 0 ? (
              <ul className="space-y-6">
                {weakTopics.map(topic => (
                  <li key={topic.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                    <span className="text-sm font-bold text-on-surface truncate flex-1">{topic.title}</span>
                    <div className="flex items-center gap-4 w-full sm:w-1/2 justify-end">
                      <div className="w-full max-w-[200px] h-2 bg-surface-container-high rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-error transition-all duration-1000 ease-out relative" 
                          style={{ width: `${Math.max(10, topic.avgScore)}%` }} // Ensure bar has some minimum vis
                        >
                          <div className="absolute inset-0 bg-white/20"></div>
                        </div>
                      </div>
                      <span className="text-xs font-black text-error w-10 text-right">{Math.round(topic.avgScore)}%</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-primary text-3xl">done_all</span>
                </div>
                <p className="text-base font-bold text-on-surface">You're doing great!</p>
                <p className="text-sm text-on-surface-variant mt-1 max-w-sm">
                  {analyticsLoading ? 'Crunching the numbers...' : 'No weak spots detected yet. Keep taking quizzes to give the AI more data.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

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
