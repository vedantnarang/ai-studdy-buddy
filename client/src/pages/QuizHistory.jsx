import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTopic } from '../hooks/useTopic';
import api from '../services/api';
import toast from 'react-hot-toast';

const QuizHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { topic, loading: topicLoading } = useTopic(id);

  const [attempts, setAttempts] = useState([]);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedQuiz, setExpandedQuiz] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/topics/${id}/quiz-attempts`);
        setAttempts(res.data?.data?.attempts || res.data?.attempts || []);
        setTotalQuizzes(res.data?.data?.totalQuizzes || res.data?.totalQuizzes || 0);
      } catch (err) {
        setError(err.message || 'Failed to load history');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchHistory();
  }, [id]);

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm("Are you sure you want to delete this quiz and all its attempts?")) return;
    try {
      await api.delete(`/topics/${id}/quizzes/${quizId}`);
      setAttempts(prev => prev.filter(group => group.quizId !== quizId));
      toast.success("Quiz deleted successfully");
    } catch (err) {
      toast.error("Failed to delete quiz");
    }
  };

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

  // Average from most recent attempts of quizzes that have been attempted
  const attemptedQuizzes = attempts.filter(g => g.mostRecentAttempt);
  const averageScore = attemptedQuizzes.length > 0 
    ? Math.round(attemptedQuizzes.reduce((acc, curr) => {
        const a = curr.mostRecentAttempt;
        return acc + (a.score / (a.totalQuestions || 1));
      }, 0) / attemptedQuizzes.length * 100) 
    : 0;

  const totalAttemptsCount = attempts.reduce((acc, curr) => acc + curr.totalAttempts, 0);

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
                <span className="text-3xl font-black text-on-surface dark:text-white font-headline">{totalQuizzes}</span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-secondary dark:text-gray-400 mt-1">Quizzes</span>
              </div>
              <div className="bg-surface-container-lowest dark:bg-gray-800 shadow-sm px-6 py-4 rounded-3xl flex flex-col items-center border border-surface-variant/30 dark:border-gray-700">
                <span className="text-3xl font-black text-on-surface dark:text-white font-headline">{totalAttemptsCount}</span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-secondary dark:text-gray-400 mt-1">Attempts</span>
              </div>
            </div>
          )}
        </div>

        {/* History Grid — each card = one unique quiz */}
        {attempts.length === 0 ? (
          <div className="text-center p-16 bg-surface-container-lowest dark:bg-gray-800 rounded-3xl shadow-sm border border-surface-variant/30 dark:border-gray-700 mt-8">
            <span className="material-symbols-outlined text-6xl text-surface-variant dark:text-gray-600 mb-4 block">history_toggle_off</span>
            <h3 className="text-xl font-bold font-headline mb-2 text-on-surface dark:text-white">No quizzes yet</h3>
            <p className="text-on-surface-variant dark:text-gray-400 mb-6">You haven't generated any quizzes for this topic. Generate one from the topic page to get started.</p>
            <button onClick={() => navigate(`/topic/${id}`)} className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold shadow-md hover:bg-primary/90 transition-all">Go to Topic</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start animate-in fade-in slide-in-from-bottom-8 duration-700 transition-all duration-500">
            {attempts.map((group, idx) => {
              const hasAttempts = group.mostRecentAttempt !== null;
              const attempt = group.mostRecentAttempt;
              const badge = hasAttempts ? getBadgeStyle(attempt.score, attempt.totalQuestions) : null;
              const quizDate = new Date(group.quizCreatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
              const isExpanded = expandedQuiz === group.quizId;
              
              return (
                <div key={group.quizId} className="group relative bg-surface-container-lowest dark:bg-gray-800 rounded-3xl flex flex-col transition-all duration-300 shadow-sm hover:shadow-md border border-surface-variant/30 dark:border-gray-700 overflow-hidden">
                  {/* Left color bar */}
                  <div className={`absolute top-0 left-0 w-2 h-full ${badge ? badge.border : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                  
                  {/* Card Content */}
                  <div className="p-8 flex flex-col flex-1">
                    {/* Header row */}
                    <div className="flex justify-between items-start mb-8 pl-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-outline dark:text-gray-500 mb-1">Quiz #{attempts.length - idx}</p>
                        <h3 className="text-xl font-headline font-bold text-on-surface dark:text-white">{quizDate}</h3>
                        <p className="text-xs text-outline dark:text-gray-500 mt-1">
                          {group.totalQuestions} questions · {group.totalAttempts} attempt{group.totalAttempts !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {badge && (
                          <span className={`${badge.bg} ${badge.text} text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider`}>
                            {badge.label}
                          </span>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteQuiz(group.quizId); }}
                          className="text-outline hover:text-error transition-colors p-1.5 rounded-full hover:bg-error/10 flex items-center justify-center"
                          title="Delete Quiz"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Score section */}
                    {hasAttempts ? (
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
                    ) : (
                      <div className="flex items-center gap-3 mb-8 pl-4 py-4 bg-surface-container/50 dark:bg-gray-700/30 rounded-xl px-5">
                        <span className="material-symbols-outlined text-outline dark:text-gray-500">info</span>
                        <p className="text-sm text-on-surface-variant dark:text-gray-400 font-medium">Not attempted yet</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-6 border-t border-surface-variant/40 dark:border-gray-700 pl-4 mt-auto gap-3">
                      {hasAttempts && group.totalAttempts > 0 ? (
                        <button 
                          onClick={() => setExpandedQuiz(isExpanded ? null : group.quizId)}
                          className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors py-2.5 px-4 rounded-xl hover:bg-primary/5"
                        >
                          <span className="material-symbols-outlined text-sm">
                            {isExpanded ? 'expand_less' : 'history'}
                          </span>
                          {isExpanded ? 'Hide Attempts' : `View Attempts (${group.totalAttempts})`}
                        </button>
                      ) : (
                        <div></div>
                      )}
                      <button 
                        onClick={() => navigate(`/topic/${id}/quiz?quizId=${group.quizId}`)} 
                        className="flex items-center gap-2 bg-surface-container hover:bg-surface-container-high dark:bg-gray-700 dark:hover:bg-gray-600 text-on-surface dark:text-white py-2.5 px-6 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm"
                      >
                        {hasAttempts ? 'Retake Quiz' : 'Start Quiz'}
                        <span className="material-symbols-outlined text-sm">{hasAttempts ? 'refresh' : 'play_arrow'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Expandable Attempts List */}
                  {isExpanded && group.allAttempts.length > 0 && (
                    <div className="border-t border-surface-variant/40 dark:border-gray-700 bg-surface-container/30 dark:bg-gray-900/40 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="px-8 py-4">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-outline dark:text-gray-500 mb-3 pl-4">All Attempts</p>
                        <div className="space-y-2">
                          {group.allAttempts.map((att, attIdx) => {
                            const attBadge = getBadgeStyle(att.score, att.totalQuestions);
                            const attDate = new Date(att.createdAt).toLocaleDateString(undefined, { 
                              month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                            });
                            const percentage = Math.round((att.score / (att.totalQuestions || 1)) * 100);
                            
                            return (
                              <div 
                                key={att._id} 
                                className="flex items-center justify-between pl-4 pr-3 py-3 bg-surface-container-lowest dark:bg-gray-800 rounded-xl border border-surface-variant/20 dark:border-gray-700"
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`w-8 h-8 rounded-lg ${attBadge.bg} flex items-center justify-center`}>
                                    <span className={`text-xs font-black ${attBadge.text}`}>{percentage}%</span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-on-surface dark:text-gray-200">
                                      Attempt #{group.allAttempts.length - attIdx}
                                      {attIdx === 0 && <span className="text-[10px] ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded-full font-bold uppercase">Latest</span>}
                                    </p>
                                    <p className="text-xs text-outline dark:text-gray-500">{attDate}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className={`text-lg font-bold font-headline ${attBadge.text}`}>
                                    {att.score}/{att.totalQuestions}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
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
