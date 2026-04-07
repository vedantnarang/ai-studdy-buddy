import { useState } from "react";
import { Link } from "react-router-dom";
import { useSubjects } from "../hooks/useSubjects";
import { useAnalytics } from "../hooks/useAnalytics";
import { useAuth } from "../context/AuthContext";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";

// Helper components for metrics
const EmptyMetricState = ({ icon, title, message }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in-95 duration-500">
    <div className="w-16 h-16 bg-primary-container/30 rounded-full flex items-center justify-center mb-4">
      <span className="material-symbols-outlined text-primary text-3xl">
        {icon}
      </span>
    </div>
    <p className="text-base font-bold text-on-surface">{title}</p>
    <p className="text-sm text-on-surface-variant mt-1 max-w-sm">{message}</p>
  </div>
);

const SubjectsList = () => {
  const { user } = useAuth();
  const { subjects, loading, error, createSubject, deleteSubject } =
    useSubjects();

  // Metrics & Analytics
  const [activeMetricTab, setActiveMetricTab] = useState("weakness");
  const {
    weakTopics,
    forgottenTopics,
    materialGaps,
    subjectReadiness,
    loading: analyticsLoading,
    error: analyticsError,
    refresh: refreshAnalytics,
  } = useAnalytics();

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newColor, setNewColor] = useState("#0053db");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError("");
    
    // Manual validation
    let errors = {};
    if (!newTitle.trim()) {
      errors.title = "Subject title is required";
    }
    const wordCount = newDescription.trim() ? newDescription.trim().split(/\s+/).filter(word => word.length > 0).length : 0;
    if (wordCount > 20) {
      errors.description = "Description cannot exceed 20 words";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    setFieldErrors({});

    setCreateLoading(true);
    setCreateError("");
    const result = await createSubject(newTitle, newColor, newDescription);

    if (result.success) {
      setIsCreating(false);
      setNewTitle("");
      setNewDescription("");
      setFieldErrors({});
      refreshAnalytics();
    } else {
      if (result.status === 409) {
        setDuplicateModalOpen(true);
      } else {
        setCreateError(result.error);
      }
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
    const result = await deleteSubject(subjectToDelete);
    if (result.success) {
      refreshAnalytics();
    }
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

  const getTint = (hex, opacity) => `${hex}${opacity}`;

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Welcome Header */}
      <header className="mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">
          Welcome back,{" "}
          {(user?.name?.split(" ")[0] || "Scholar").charAt(0).toUpperCase() +
            (user?.name?.split(" ")[0] || "Scholar").slice(1)}
        </h2>
        <p className="text-tertiary font-medium">
          Ready for your deep study session today?
        </p>
      </header>

      {error && (
        <div className="mb-8 p-4 bg-error-container text-on-error-container rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Main Grid Section */}
      <section className="mb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h3 className="text-xl font-bold font-headline text-on-surface">
            My Subjects
          </h3>
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
            <h3 className="text-lg font-bold text-on-surface mb-6">
              Create New Subject
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              {createError && (
                <p className="text-sm text-error font-medium">{createError}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3">
                  <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => {
                      setNewTitle(e.target.value);
                      if (fieldErrors.title) setFieldErrors(prev => ({ ...prev, title: null }));
                    }}
                    placeholder="e.g. Molecular Biology"
                    className={`w-full px-4 py-3 bg-surface-container-low border-2 rounded-xl text-on-surface focus:ring-2 focus:border-transparent outline-none transition-all ${
                      fieldErrors.title 
                        ? 'border-red-500 focus:ring-red-500/40' 
                        : 'border-transparent focus:ring-primary/40'
                    }`}
                    required
                    autoFocus
                  />
                  {fieldErrors.title && <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.title}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface-variant mb-3">
                    Theme Color
                  </label>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2.5">
                      {[
                        "#0053db",
                        "#7c3aed",
                        "#db2777",
                        "#ea580c",
                        "#16a34a",
                        "#0891b2",
                        "#4b5563",
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setNewColor(preset)}
                          className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 active:scale-95 ${
                            newColor === preset
                              ? "border-on-surface scale-110 shadow-md"
                              : "border-transparent"
                          }`}
                          style={{ backgroundColor: preset }}
                          title={preset}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative group cursor-pointer">
                        <div
                          className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-700 shadow-sm transition-transform group-hover:scale-105"
                          style={{ backgroundColor: newColor }}
                          onClick={() =>
                            document
                              .getElementById("custom-color-picker")
                              .click()
                          }
                        />
                        <input
                          id="custom-color-picker"
                          type="color"
                          value={newColor}
                          onChange={(e) => setNewColor(e.target.value)}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-grab"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">
                            #
                          </span>
                          <input
                            type="text"
                            value={newColor.replace("#", "")}
                            onChange={(e) => {
                              const val = e.target.value
                                .replace(/[^0-9A-Fa-f]/g, "")
                                .slice(0, 6);
                              setNewColor(`#${val}`);
                            }}
                            placeholder="FFFFFF"
                            className="w-full pl-7 pr-4 py-2 bg-surface-container-low border-none rounded-xl text-on-surface font-mono text-sm focus:ring-2 focus:ring-primary/40 outline-none transition-all uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-on-surface-variant">
                    Description (Optional)
                  </label>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    (newDescription.trim() ? newDescription.trim().split(/\s+/).filter(w => w.length > 0).length : 0) > 20 
                      ? 'text-red-500' 
                      : 'text-tertiary'
                  }`}>
                    {newDescription.trim() ? newDescription.trim().split(/\s+/).filter(w => w.length > 0).length : 0} / 20 words
                  </span>
                </div>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => {
                    setNewDescription(e.target.value);
                    if (fieldErrors.description) setFieldErrors(prev => ({ ...prev, description: null }));
                  }}
                  placeholder="e.g. Cellular structures, DNA replication, and gene expression."
                  className={`w-full px-4 py-3 pt-2 bg-surface-container-low border-2 rounded-xl text-on-surface focus:ring-2 focus:border-transparent outline-none transition-all ${
                    fieldErrors.description 
                      ? 'border-red-500 focus:ring-red-500/40' 
                      : 'border-transparent focus:ring-primary/40'
                  }`}
                />
                {fieldErrors.description && <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.description}</p>}
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
                  {createLoading ? "Building..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        )}

        {subjects.length === 0 && !isCreating ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 bg-surface-container-lowest dark:bg-gray-800/40 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-700/50 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl text-primary">
                library_books
              </span>
            </div>
            <h3 className="text-2xl font-bold text-on-surface mb-3">
              Your Knowledge Hub is Ready
            </h3>
            <p className="text-on-surface-variant mb-10 max-w-sm mx-auto text-center leading-relaxed font-medium p-2">
              Start by creating your first subject. We'll help you organize
              notes, generate AI flashcards, and master your topics.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="group flex items-center border-3 border-blue-100 gap-2 px-8 py-3.5 bg-primary text-on-primary font-bold rounded-2xl hover:bg-primary-dim transition-all hover:shadow-lg hover:shadow-blue-200/50 active:scale-95 gradient-text"
            >
              <span className="material-symbols-outlined text-[20px] ">
                add
              </span>
              Start Your First Subject
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 ">
            {subjects.map((subject) => {
              const accentColor = subject.color || "#0053db";
              const shadowColor = `${accentColor}40`;
              return (
                <Link
                  to={`/subject/${subject._id}`}
                  key={subject._id}
                  className="bg-surface-container-lowest p-6 lg:p-8 rounded-2xl flex flex-col relative overflow-hidden group hover:shadow-(--hover-shadow) hover:-translate-y-1 transition-all duration-300 border-2 border-gray-100 dark:border-gray-800"
                  style={{
                    "--hover-shadow": `0 10px 15px -3px ${shadowColor}, 0 4px 6px -4px ${shadowColor}`,
                  }}
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5"
                    style={{ backgroundColor: accentColor }}
                  ></div>

                  <div className="flex justify-between items-start mb-6 w-full">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl"
                      style={{
                        backgroundColor: getTint(accentColor, "20"),
                        color: accentColor,
                      }}
                    >
                      {subject.title
                        ? subject.title.charAt(0).toUpperCase()
                        : "S"}
                    </div>
                    <button
                      onClick={(e) => handleDeleteClick(e, subject._id)}
                      className="text-gray-400 hover:text-error opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-error-container"
                      title="Delete Subject"
                    >
                      <span className="material-symbols-outlined text-xl">
                        delete
                      </span>
                    </button>
                  </div>

                  <h4 className="text-lg md:text-xl font-bold mb-2 text-on-surface truncate pr-2">
                    {subject.title || "Untitled"}
                  </h4>

                  <p className="text-sm text-on-surface-variant mb-8 line-clamp-2 pb-1">
                    {subject.description || "No description provided."}
                  </p>

                  <div className="mt-auto pt-4 border-t border-gray-50 dark:border-gray-800/50 flex flex-col gap-2">
                    <button
                      className="w-full py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all border-3 cursor-pointer"
                      style={{
                        color: accentColor,
                        borderColor: getTint(accentColor, "20"),
                      }}
                    >
                      View Subject
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Focus Areas Section */}
      {subjects.length > 0 && (
        <section className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-surface-container-low rounded-3xl p-8 border border-blue-400 dark:border-gray-800 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h3 className="text-xl font-bold font-headline text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500">
                    insights
                  </span>
                  Focus & Insights
                </h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  AI-powered analysis of your study progress
                </p>
              </div>

              <div className="flex flex-wrap gap-2 bg-surface-container-highest p-1.5 rounded-2xl">
                {[
                  { id: "weakness", label: "Weak Topics", icon: "flag" },
                  { id: "retention", label: "Retention", icon: "history" },
                  { id: "gaps", label: "Gaps", icon: "format_list_bulleted" },
                  { id: "readiness", label: "Readiness", icon: "verified" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveMetricTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeMetricTab === tab.id
                        ? "bg-primary text-on-primary shadow-sm"
                        : "text-on-surface-variant hover:bg-surface-container-low"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {tab.icon}
                    </span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-gray-100 dark:border-gray-800 min-h-[220px] flex flex-col justify-center">
              {analyticsLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-4"></div>
                  <p className="text-sm font-medium text-on-surface-variant">
                    Analyzing your progress...
                  </p>
                </div>
              ) : (
                <>
                  {activeMetricTab === "weakness" && (
                    <div className="animate-in fade-in duration-500">
                      {weakTopics.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {weakTopics.map((topic) => {
                            const accentColor = topic.subjectColor || "#0053db";
                            const shadowColor = `${accentColor}40`;
                            return (
                            <Link
                              to={`/topic/${topic.id}`}
                              key={topic.id}
                              className="flex flex-col gap-2 p-4 rounded-xl bg-surface-container-low border-2 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                              style={{ borderColor: accentColor }}
                              onMouseEnter={(e) => e.currentTarget.style.boxShadow = `0 8px 24px -4px ${shadowColor}`}
                              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-on-surface truncate pr-4">
                                    {topic.title}
                                  </span>
                                  <span className="text-[10px] font-black uppercase tracking-wider mt-0.5" style={{ color: accentColor }}>
                                    {topic.subjectTitle || "Unknown Subject"}
                                  </span>
                                </div>
                                <span className="text-xs font-black text-error mt-0.5">
                                  {Math.round(topic.avgScore)}%
                                </span>
                              </div>
                              <div className="w-full h-2.5 bg-surface-container-high rounded-full overflow-hidden mt-1">
                                <div
                                  className="h-full bg-error transition-all duration-1000 ease-out"
                                  style={{
                                    width: `${topic.avgScore}%`,
                                  }}
                                ></div>
                              </div>
                            </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <EmptyMetricState
                          icon="done_all"
                          title="Master of all!"
                          message="No weak spots detected. Your recent quiz scores are consistently above 70%."
                        />
                      )}
                    </div>
                  )}

                  {activeMetricTab === "retention" && (
                    <div className="animate-in fade-in duration-500">
                      {forgottenTopics.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {forgottenTopics.map((topic) => {
                            const accentColor = topic.subjectColor || "#fbbf24";
                            const shadowColor = `${accentColor}40`;
                            return (
                            <Link
                              to={`/topic/${topic.id}`}
                              key={topic.id}
                              className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low border-2 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                              style={{ borderColor: accentColor }}
                              onMouseEnter={(e) => e.currentTarget.style.boxShadow = `0 8px 24px -4px ${shadowColor}`}
                              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                            >
                              <div className="flex items-center gap-4">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                  <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">
                                    timer
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-on-surface">
                                    {topic.title}
                                  </span>
                                  <span className="text-[10px] font-black uppercase tracking-wider mt-0.5" style={{ color: accentColor }}>
                                    {topic.subjectTitle || "Unknown Subject"}
                                  </span>
                                  <p className="text-[10px] text-tertiary mt-1">
                                    Last review:{" "}
                                    {new Date(
                                      topic.lastReviewed,
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div
                                className="px-3 py-1.5 bg-amber-500 text-white text-[10px] font-black uppercase rounded-lg hover:bg-amber-600 transition-colors"
                              >
                                Review
                              </div>
                            </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <EmptyMetricState
                          icon="auto_awesome"
                          title="Memory is Fresh"
                          message="No topics found that haven't been reviewed in 4+ days. Great consistency!"
                        />
                      )}
                    </div>
                  )}

                  {activeMetricTab === "gaps" && (
                    <div className="animate-in fade-in duration-500">
                      {materialGaps.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {materialGaps.map((topic) => {
                            const accentColor = topic.subjectColor || "#3b82f6";
                            const shadowColor = `${accentColor}40`;
                            return (
                            <Link
                              to={`/topic/${topic.id}`}
                              key={topic.id}
                              className="flex flex-col justify-center p-4 rounded-xl bg-surface-container-low border-2 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                              style={{ borderColor: accentColor }}
                              onMouseEnter={(e) => e.currentTarget.style.boxShadow = `0 8px 24px -4px ${shadowColor}`}
                              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                            >
                              <div className="flex flex-col mb-3">
                                <span className="text-sm font-bold text-on-surface">
                                  {topic.title}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-wider mt-0.5" style={{ color: accentColor }}>
                                  {topic.subjectTitle || "Unknown Subject"}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                {topic.missing.flashcards && (
                                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-md">
                                    No Flashcards
                                  </span>
                                )}
                                {topic.missing.quiz && (
                                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[10px] font-bold rounded-md">
                                    No Quiz
                                  </span>
                                )}
                              </div>
                            </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <EmptyMetricState
                          icon="library_add_check"
                          title="Fully Equipped"
                          message="All your topics with notes have generated study materials. You're ready to go!"
                        />
                      )}
                    </div>
                  )}

                  {activeMetricTab === "readiness" && (
                    <div className="animate-in fade-in duration-500">
                      {subjectReadiness.some((s) => s.sessionCount > 0) ? (
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {subjectReadiness
                            .filter((s) => s.sessionCount > 0)
                            .map((sub) => (
                              <li
                                key={sub.title}
                                className="p-4 rounded-xl bg-surface-container-low border border-gray-100 dark:border-gray-800"
                              >
                                <div className="flex justify-between items-center mb-3">
                                  <span className="text-sm font-bold text-on-surface">
                                    {sub.title}
                                  </span>
                                  <span
                                    className="text-xs font-black"
                                    style={{ color: sub.color }}
                                  >
                                    {sub.readiness}% Readiness
                                  </span>
                                </div>
                                <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden p-0.5">
                                  <div
                                    className="h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{
                                      width: `${sub.readiness}%`,
                                      backgroundColor: sub.color,
                                    }}
                                  ></div>
                                </div>
                                <p className="text-[10px] text-on-surface-variant mt-2">
                                  Based on {sub.sessionCount} sessions
                                </p>
                              </li>
                            ))}
                        </ul>
                      ) : (
                        <EmptyMetricState
                          icon="analytics"
                          title="Need Data"
                          message="Take more quizzes to see your overall subject readiness scores!"
                        />
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
        title="Delete Subject?"
        message="Are you sure you want to delete this subject? This cannot be undone."
      />

      {/* Duplicate Subject Modal */}
      {duplicateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 w-full max-w-md overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Subject Already Exists</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                You already have a subject with this name. Please choose a different name or navigate to the existing subject.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end transition-colors">
              <button 
                onClick={() => setDuplicateModalOpen(false)} 
                className="px-4 py-2 bg-primary hover:bg-primary-dim text-white font-medium rounded-lg shadow-sm transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectsList;
