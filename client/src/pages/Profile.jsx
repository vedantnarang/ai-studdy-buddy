import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSubjects } from '../hooks/useSubjects';
import { useAnalytics } from '../hooks/useAnalytics';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { subjects, loading: loadingSubjects } = useSubjects();
  const { streak, totalSessions, loading: loadingAnalytics } = useAnalytics();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);

  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Name and email are required');
      return;
    }

    setIsSaving(true);
    const result = await updateProfile(name, email);
    setIsSaving(false);

    if (result.success) {
      toast.success('Profile updated successfully!');
    } else {
      // Direct notification for duplicate email or other backend errors
      toast.error(result.error || 'Failed to update profile');
    }
  };

  const focusInput = (ref) => {
    if (ref.current) {
      ref.current.focus();
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 gradient-mesh min-h-[calc(100vh-80px)] p-4 md:p-8 rounded-[2.5rem]">
      {/* Profile Header Section */}
      <section className="glass-card rounded-[2rem] p-6 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-10 border border-white/20 shadow-2xl shadow-blue-500/5">
        <div className="relative group">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] overflow-hidden border-4 border-white dark:border-slate-700 shadow-xl bg-surface-container-high transition-transform duration-500 group-hover:scale-[1.02]">
             <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center text-5xl font-bold font-headline">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
        </div>
        
        <div className="flex-1 space-y-6 w-full">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant dark:text-gray-400 ml-1">Full Name</label>
                <div className="group relative flex items-center">
                  <input 
                    ref={nameInputRef}
                    className="w-full bg-surface-container-high dark:bg-slate-800 border-none rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-slate-700 transition-all font-headline text-lg font-semibold text-on-surface dark:text-white pr-12" 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => focusInput(nameInputRef)}
                    className="absolute right-4 text-outline opacity-40 group-hover:opacity-100 transition-opacity hover:text-primary active:scale-90"
                    title="Edit Name"
                  >
                    <span className="material-symbols-outlined pointer-events-none">edit</span>
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant dark:text-gray-400 ml-1">University Email</label>
                <div className="group relative flex items-center">
                  <input 
                    ref={emailInputRef}
                    className="w-full bg-surface-container-high dark:bg-slate-800 border-none rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-slate-700 transition-all font-body text-on-surface dark:text-white pr-12" 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => focusInput(emailInputRef)}
                    className="absolute right-4 text-outline opacity-40 group-hover:opacity-100 transition-opacity hover:text-primary active:scale-90"
                    title="Edit Email"
                  >
                    <span className="material-symbols-outlined pointer-events-none">edit</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button 
                type="submit"
                disabled={isSaving || (name === user?.name && email === user?.email)}
                className="bg-primary hover:bg-primary-dim text-white font-bold text-[10px] tracking-widest uppercase px-8 py-3.5 rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
              >
                {isSaving ? 'Updating...' : 'Save Changes'}
                <span className="material-symbols-outlined text-sm">check_circle</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl flex items-center gap-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="w-14 h-14 rounded-2xl bg-primary-container/30 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-3xl">library_books</span>
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant dark:text-gray-400 uppercase tracking-tighter">Subjects</p>
            <h3 className="text-3xl font-extrabold text-on-surface dark:text-white">{subjects.length}</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl flex items-center gap-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="w-14 h-14 rounded-2xl bg-tertiary-container/30 flex items-center justify-center text-on-tertiary-container">
            <span className="material-symbols-outlined text-3xl">quiz</span>
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant dark:text-gray-400 uppercase tracking-tighter">Quizzes Taken</p>
            <h3 className="text-3xl font-extrabold text-on-surface dark:text-white">
              {loadingAnalytics ? '...' : totalSessions}
            </h3>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl flex items-center gap-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <span className="material-symbols-outlined text-3xl filled-icon">local_fire_department</span>
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant dark:text-gray-400 uppercase tracking-tighter">Study Streak</p>
            <h3 className="text-3xl font-extrabold text-on-surface dark:text-white">
              {loadingAnalytics ? '...' : `${streak}-day`}
            </h3>
          </div>
        </div>
      </section>

      {/* My Subjects Section */}
      <section className="space-y-8 pb-12">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-bold text-on-surface dark:text-white tracking-tight font-headline">My Subjects</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loadingSubjects ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-48 bg-white dark:bg-slate-800 rounded-3xl animate-pulse"></div>
            ))
          ) : subjects.length > 0 ? (
            subjects.map((subject) => (
              <div key={subject._id} className="bg-white dark:bg-slate-800 p-8 rounded-3xl relative overflow-hidden group hover:bg-surface-container-low dark:hover:bg-slate-700 transition-all border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md">
                <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: subject.color || '#3b82f6' }}></div>
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <span className="material-symbols-outlined">school</span>
                    </div>
                    <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">Academic</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-on-surface dark:text-white mb-1 truncate">{subject.title}</h4>
                    <p className="text-xs text-on-surface-variant dark:text-gray-400 uppercase tracking-widest font-bold">{subject.description}</p>
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>Progress</span>
                      <span>{subject.readiness || 0}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-container dark:bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${subject.readiness || 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center glass-card rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 font-medium">No subjects yet. Start by creating one from the dashboard!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Profile;
