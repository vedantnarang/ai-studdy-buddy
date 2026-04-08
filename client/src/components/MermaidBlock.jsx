import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: '"ui-sans-serif", "system-ui", "sans-serif"',
  flowchart: {
    htmlLabels: false,
    useMaxWidth: false,
  }
});

const MermaidBlock = ({ chart }) => {
  const containerRef = useRef(null);
  const [svgStr, setSvgStr] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!chart) return;

    const renderChart = async () => {
      try {
        setError(false);
        const id = `mermaid-chart-${Math.random().toString(36).substring(7)}`;
        mermaid.mermaidAPI.reset();
        
        const { svg } = await mermaid.render(id, chart);
        setSvgStr(svg);
      } catch (err) {
        console.error('Mermaid render error:', err);
        setError(true);
      }
    };

    renderChart();
  }, [chart]);

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 border border-red-200 rounded-md my-4 font-mono text-sm overflow-x-auto whitespace-pre-wrap">
        <p className="font-bold mb-2">Error rendering diagram</p>
        {chart}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="mermaid-container break-inside-avoid flex justify-center my-6 overflow-x-auto bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
      dangerouslySetInnerHTML={{ __html: svgStr }} 
    />
  );
};

export default MermaidBlock;
