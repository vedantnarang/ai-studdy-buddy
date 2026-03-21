import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTopic } from '../hooks/useTopic';
import api from '../services/api';

const QuizHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { topic, loading: topicLoading } = useTopic(id);

  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/topics/${id}/quiz-attempts`);
        setAttempts(res.data?.data?.attempts || res.data?.attempts || []);
      } catch (err) {
        setError(err.message || 'Failed to load history');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchHistory();
  }, [id]);

  if (topicLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-surface">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-surface px-6 text-center">
        <div className="bg-error-container text-on-error-container p-6 rounded-2xl max-w-md">
           <span className="material-symbols-outlined text-4xl mb-2">error</span>
           <p className="font-bold">{error}</p>
           <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">Go Back</button>
        </div>
      </div>
    );
  }

  // Compute average score from grouped data (based on most recent attempt per quiz)
  const averageScore = attempts.length > 0 
    ? Math.round(attempts.reduce((acc, curr) => {
        const a = curr.mostRecentAttempt;
        return acc + (a.score / (a.totalQuestions || 1));
      }, 0) / attempts.length * 100) 
    : 0;

  const getBadgeStyle = (score, total) => {
    const percentage = score / (total || 1);
    if (percentage >= 0.8) return { label: 'Distinction', bg: 'bg-[#22C55E]/10', text: 'text-[#22C55E]', border: 'bg-[#22C55E]' };
    if (percentage >= 0.6) return { label: 'Pass', bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]', border: 'bg-[#F59E0B]' };
    if (percentage >= 0.4) return { label: 'Review', bg: 'bg-[#3B82F6]/10', text: 'text-[#3B82F6]', border: 'bg-[#3B82F6]' };
    return { label: 'Unsatisfactory', bg: 'bg-[#EF4444]/10', text: 'text-[#EF4444]', border: 'bg-[#EF4444]' };
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-[#111827] text-on-surface dark:text-gray-100 font-body relative overflow-x-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-blue-100/15 via-white/5 to-transparent dark:from-primary/10"></div>
      
      {/* TopNavBar Shell */}
      <nav className="sticky top-0 w-full z-30 flex justify-between items-center px-6 md:px-8 py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-surface-variant/20 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <span className="text-lg font-black text-primary font-headline tracking-tight">Study Buddy</span>
          <div className="h-6 w-px bg-surface-variant dark:bg-gray-700 mx-1 md:mx-2 hidden sm:block"></div>
          <span className="text-sm font-medium text-secondary truncate max-w-[150px] md:max-w-xs hidden sm:block">
            {topic?.title || 'History'}
          </span>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <button 
            onClick={() => navigate(`/topic/${id}`)}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface-container hover:bg-surface-container-high dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full text-xs font-bold font-label transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
            Exit
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-12 px-6 md:px-12 pb-24 max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <nav className="flex items-center gap-2 mb-4 text-sm font-medium text-secondary dark:text-gray-400">
              <Link to={`/topic/${id}`} className="hover:text-primary transition-colors">{topic?.title}</Link>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-primary font-bold">Quiz History</span>
            </nav>
            <h2 className="text-4xl font-headline font-extrabold text-on-surface dark:text-white tracking-tight mb-2">Quiz History</h2>
            <p className="text-on-surface-variant dark:text-gray-400 max-w-lg leading-relaxed">
              Review your past performance in <span className="text-primary font-semibold">{topic?.title}</span>. Tracking your metrics helps pinpoint knowledge gaps.
            </p>
          </div>
          
          {attempts.length > 0 && (
            <div className="flex gap-4">
              <div className="bg-surface-container-lowest dark:bg-gray-800 shadow-sm px-6 py-4 rounded-3xl flex flex-col items-center border border-surface-variant/30 dark:border-gray-700">
                <span className="text-3xl font-black text-primary font-headline">{averageScore}%</span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-secondary dark:text-gray-400 mt-1">Avg Score</span>
              </div>
              <div className="bg-surface-container-lowest dark:bg-gray-800 shadow-sm px-6 py-4 rounded-3xl flex flex-col items-center border border-surface-variant/30 dark:border-gray-700">
                <span className="text-3xl font-black text-on-surface dark:text-white font-headline">{attempts.length}</span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-secondary dark:text-gray-400 mt-1">Quizzes</span>
              </div>
            </div>
          )}
        </div>

        {/* History Grid — each card = one unique quiz, showing most recent attempt */}
        {attempts.length === 0 ? (
          <div className="text-center p-16 bg-surface-container-lowest dark:bg-gray-800 rounded-3xl shadow-sm border border-surface-variant/30 dark:border-gray-700 mt-8">
            <span className="material-symbols-outlined text-6xl text-surface-variant dark:text-gray-600 mb-4 block">history_toggle_off</span>
            <h3 className="text-xl font-bold font-headline mb-2 text-on-surface dark:text-white">No attempts yet</h3>
            <p className="text-on-surface-variant dark:text-gray-400 mb-6">You haven't completed any quizzes for this topic. Generate and finish one to see your stats here.</p>
            <button onClick={() => navigate(`/topic/${id}/quiz`)} className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold shadow-md hover:bg-primary/90 transition-all">Start a Quiz</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {attempts.map((group, idx) => {
              const attempt = group.mostRecentAttempt;
              const badge = getBadgeStyle(attempt.score, attempt.totalQuestions);
              const dateStr = new Date(attempt.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
              
              return (
                <div key={group.quizId} className="group relative bg-surface-container-lowest dark:bg-gray-800 rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md border border-surface-variant/30 dark:border-gray-700">
                  <div className={`absolute top-0 left-0 w-2 h-full rounded-l-3xl ${badge.border}`}></div>
                  
                  <div className="flex justify-between items-start mb-8 pl-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-outline dark:text-gray-500 mb-1">Quiz #{idx + 1}</p>
                      <h3 className="text-xl font-headline font-bold text-on-surface dark:text-white">{dateStr}</h3>
                      <p className="text-xs text-outline dark:text-gray-500 mt-1">
                        {group.totalAttempts} attempt{group.totalAttempts !== 1 ? 's' : ''} total
                      </p>
                    </div>
                    <span className={`${badge.bg} ${badge.text} text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-8 mb-8 pl-4">
                    <div>
                      <p className="text-xs text-outline dark:text-gray-500 mb-1 font-semibold uppercase tracking-wider">Questions</p>
                      <p className="text-lg font-bold text-on-surface dark:text-gray-200">{attempt.totalQuestions} Items</p>
                    </div>
                    <div className="h-10 w-px bg-surface-variant dark:bg-gray-700"></div>
                    <div>
                      <p className="text-xs text-outline dark:text-gray-500 mb-1 font-semibold uppercase tracking-wider">Latest Score</p>
                      <p className={`text-3xl font-headline font-extrabold ${badge.text}`}>{attempt.score}/{attempt.totalQuestions}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-surface-variant/40 dark:border-gray-700 pl-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-secondary dark:text-gray-400 uppercase tracking-widest">
                       {badge.label === 'Unsatisfactory' && <><span className="material-symbols-outlined text-sm text-[#EF4444]">warning</span> Needs Review</>}
                       {(badge.label === 'Distinction' || badge.label === 'Pass') && <><span className="material-symbols-outlined text-sm text-[#22C55E]">verified</span> Solid Grasp</>}
                    </div>
                    <button onClick={() => navigate(`/topic/${id}/quiz`)} className="flex items-center gap-2 bg-surface-container hover:bg-surface-container-high dark:bg-gray-700 dark:hover:bg-gray-600 text-on-surface dark:text-white py-2.5 px-6 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm">
                        Retake Quiz
                        <span className="material-symbols-outlined text-sm">refresh</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default QuizHistory;
