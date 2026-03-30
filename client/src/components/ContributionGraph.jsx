import { useState } from 'react';
import { useContributionGraph } from '../hooks/useContributionGraph';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ContributionGraph = () => {
  const { days, loading, error } = useContributionGraph();
  const [hoveredDay, setHoveredDay] = useState(null);

  // Build a unique legend from all subjects across all days
  const buildLegend = () => {
    const seen = new Map();
    days.forEach(day => {
      day.subjects.forEach(sub => {
        if (!seen.has(sub.subjectId)) {
          seen.set(sub.subjectId, { title: sub.title, color: sub.color });
        }
      });
    });
    return Array.from(seen.values());
  };

  const isToday = (dateStr) => {
    const today = new Date();
    return dateStr === today.toISOString().slice(0, 10);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
  };

  if (loading) {
    return (
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="mb-6">
          <div className="h-6 w-40 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-100 dark:bg-slate-700/50 rounded-lg animate-pulse" />
        </div>
        <div className="flex items-end gap-3 h-40">
          {Array(10).fill(0).map((_, i) => (
            <div key={i} className="flex-1 h-full rounded-xl bg-gray-100 dark:bg-slate-700 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
        <p className="text-sm text-red-500">{error}</p>
      </section>
    );
  }

  const maxTotal = Math.max(...days.map(d => d.total), 1);
  const legend = buildLegend();

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h3 className="text-xl font-bold text-on-surface dark:text-white font-headline tracking-tight">Quiz Activity</h3>
          <p className="text-sm text-on-surface-variant dark:text-gray-400 mt-0.5">Activity reflects quizzes taken per subject.</p>
        </div>
        {/* Legend */}
        {legend.length > 0 && (
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {legend.map(item => (
              <div key={item.title} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-bold text-on-surface-variant dark:text-gray-400 uppercase tracking-wide">{item.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Graph */}
      <div className="flex items-end gap-2 md:gap-3">
        {days.map((day, idx) => {
          const isEmpty = day.total === 0;
          // Each bar fills proportionally: busiest day = 100%, others scale down
          const fillPercent = isEmpty ? 0 : (day.total / maxTotal) * 100;
          const today = isToday(day.date);

          return (
            <div 
              key={day.date} 
              className="flex-1 flex flex-col items-center gap-2 relative group"
              onMouseEnter={() => setHoveredDay(idx)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              {/* Tooltip */}
              {hoveredDay === idx && (
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-20 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-xl px-4 py-3 shadow-xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-200">
                  <p className="font-bold mb-1.5">
                    {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  {isEmpty ? (
                    <p className="text-gray-400">No quizzes taken</p>
                  ) : (
                    <>
                      <p className="text-gray-300 mb-1">{day.total} quiz{day.total > 1 ? 'zes' : ''}</p>
                      <div className="space-y-1 border-t border-slate-600 pt-1.5 mt-1">
                        {day.subjects.map(sub => (
                          <div key={sub.subjectId} className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                            <span className="truncate max-w-[120px]">{sub.title}</span>
                            <span className="text-gray-400 ml-auto pl-2">{sub.count}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900 dark:border-t-slate-700" />
                </div>
              )}

              {/* Bar container — fixed height, segments grow from bottom */}
              <div 
                className="w-full h-36 md:h-40 rounded-xl overflow-hidden flex flex-col justify-end bg-gray-100 dark:bg-slate-700/40 cursor-pointer transition-transform duration-200 group-hover:scale-[1.03]"
              >
                {!isEmpty && day.subjects.map(sub => (
                  <div
                    key={sub.subjectId}
                    style={{
                      backgroundColor: sub.color,
                      height: `${(sub.count / maxTotal) * 100}%`,
                    }}
                    className="w-full transition-all duration-500 first:rounded-t-lg"
                  />
                ))}
              </div>

              {/* Date label */}
              <span className={`text-[11px] font-bold tracking-tight ${today ? 'text-primary' : 'text-on-surface-variant dark:text-gray-500'}`}>
                {today ? 'Today' : formatDate(day.date)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ContributionGraph;
